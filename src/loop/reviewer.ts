/**
 * Agent Reviewer — LLM-powered diff review step for the executor loop.
 *
 * Slots into the validation pipeline after lint/build/test pass but before commit.
 * Analyzes the current git diff and returns structured feedback that can be fed
 * back into the next iteration via lastValidationFeedback.
 */

import { execa } from 'execa';
import { tryCallLLM } from '../llm/api.js';
import type { ValidationResult } from './validation.js';

/** Maximum diff size in characters to send to the LLM (avoid context overflow) */
const MAX_DIFF_CHARS = 30_000;

/** Review severity levels */
export type ReviewSeverity = 'error' | 'warning' | 'info';

export type ReviewFinding = {
  severity: ReviewSeverity;
  message: string;
  file?: string;
  line?: number;
};

export type ReviewResult = {
  passed: boolean;
  findings: ReviewFinding[];
  model?: string;
  /** Raw LLM response for debugging */
  raw?: string;
};

/**
 * Get all working-tree changes as a single coherent diff.
 * Prefers `git diff HEAD` (covers staged + unstaged in one pass).
 * Falls back to combining staged + unstaged for repos with no commits.
 */
async function getDiff(cwd: string): Promise<string> {
  // Register untracked files so git diff HEAD includes new files
  await execa('git', ['add', '--intent-to-add', '--all'], { cwd, reject: false });

  const head = await execa('git', ['diff', 'HEAD'], { cwd, reject: false });

  // Clean up: remove intent-to-add entries so the index isn't permanently mutated
  await execa('git', ['restore', '--staged', '.'], { cwd, reject: false });

  if (head.stdout.trim()) return head.stdout;

  // Fallback for repos with no commits yet: combine staged + unstaged
  const [staged, unstaged] = await Promise.all([
    execa('git', ['diff', '--cached'], { cwd, reject: false }),
    execa('git', ['diff'], { cwd, reject: false }),
  ]);
  return [staged.stdout, unstaged.stdout].filter(Boolean).join('\n');
}

const REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer embedded in an automated coding loop. Your job is to review a git diff and catch issues that lint, build, and test checks cannot detect.

Focus on:
1. **Security**: Hardcoded secrets, SQL injection, XSS, insecure defaults, exposed API keys
2. **Logic errors**: Off-by-one, race conditions, null/undefined access, wrong operator
3. **Pattern violations**: Not following the codebase's existing patterns/conventions
4. **Missing error handling**: Unhandled promises, missing try/catch at boundaries
5. **Performance**: Obvious N+1 queries, missing indexes, unbounded loops/allocations

Do NOT flag:
- Style issues (handled by lint)
- Type errors (handled by build/typecheck)
- Missing tests (handled by test runner)
- Minor naming preferences

Respond with a JSON array of findings. Each finding has:
- "severity": "error" | "warning" | "info"
- "message": concise description of the issue
- "file": the affected file path (if identifiable from the diff)
- "line": the relevant line number in the file (if identifiable from the diff)

If the diff looks clean, respond with an empty array: []

Respond ONLY with the JSON array, no markdown fences or explanation.`;

/**
 * Run the agent reviewer on the current diff.
 * Returns null if no diff exists or no LLM provider is available.
 */
export async function runReview(cwd: string): Promise<ReviewResult | null> {
  const diff = await getDiff(cwd);
  if (!diff.trim()) return null;

  // Truncate large diffs at a line boundary to avoid malformed patch hunks
  const truncatedDiff = (() => {
    if (diff.length <= MAX_DIFF_CHARS) return diff;
    const cutIndex = diff.lastIndexOf('\n', MAX_DIFF_CHARS);
    const slice = cutIndex > 0 ? diff.slice(0, cutIndex) : diff.slice(0, MAX_DIFF_CHARS);
    return `${slice}\n\n... (diff truncated at ${MAX_DIFF_CHARS} chars, ${diff.length} total)`;
  })();

  const response = await tryCallLLM({
    system: REVIEW_SYSTEM_PROMPT,
    prompt: `Review this diff:\n\n\`\`\`diff\n${truncatedDiff}\n\`\`\``,
    maxTokens: 2048,
  });

  if (!response) return null;

  // Parse JSON findings from the response — null means LLM returned unparseable output
  const findings = parseFindings(response.content);
  if (!findings) return null;

  const hasErrors = findings.some((f) => f.severity === 'error');

  return {
    passed: !hasErrors,
    findings,
    model: response.model,
    raw: response.content,
  };
}

/**
 * Parse review findings from LLM response.
 * Handles both raw JSON arrays and markdown-fenced JSON.
 */
function parseFindings(content: string): ReviewFinding[] | null {
  // Strip markdown code fences if present
  const cleaned = content
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    // Empty array = clean review
    if (parsed.length === 0) return [];

    const valid = parsed
      .filter(
        (f: unknown): f is { severity: string; message: string; file?: string; line?: number } =>
          typeof f === 'object' &&
          f !== null &&
          'severity' in f &&
          'message' in f &&
          typeof (f as Record<string, unknown>).message === 'string'
      )
      .map((f) => ({
        severity: (['error', 'warning', 'info'].includes(f.severity)
          ? f.severity
          : 'warning') as ReviewSeverity,
        message: f.message,
        file: typeof f.file === 'string' ? f.file : undefined,
        line: typeof f.line === 'number' ? f.line : undefined,
      }));

    // Non-empty array but all items malformed = indeterminate
    if (valid.length === 0) return null;

    return valid;
  } catch {
    // LLM returned non-JSON — caller should treat as indeterminate (skipped), not passed
    return null;
  }
}

/**
 * Format review findings as a ValidationResult for the executor loop.
 * This allows the reviewer to slot into the existing validation pipeline.
 */
export function formatReviewAsValidation(result: ReviewResult): ValidationResult {
  if (result.passed && result.findings.length === 0) {
    return {
      success: true,
      command: 'agent-review',
      output: 'No issues found',
    };
  }

  const lines: string[] = [];
  for (const finding of result.findings) {
    const icon = finding.severity === 'error' ? '❌' : finding.severity === 'warning' ? '⚠️' : 'ℹ️';
    const location = finding.file
      ? ` (${finding.file}${finding.line ? `:${finding.line}` : ''})`
      : '';
    lines.push(`${icon} [${finding.severity.toUpperCase()}]${location}: ${finding.message}`);
  }

  return {
    success: result.passed,
    command: 'agent-review',
    output: lines.join('\n'),
    ...(result.passed ? {} : { error: lines.join('\n') }),
  };
}

/**
 * Format review findings as feedback text for the lastValidationFeedback mechanism.
 */
export function formatReviewFeedback(result: ReviewResult): string {
  if (result.findings.length === 0) return '';

  const hasFailed = !result.passed;
  const feedback = [hasFailed ? '## Agent Review Failed\n' : '## Agent Review Warnings\n'];
  feedback.push(
    `The automated code reviewer (${result.model || 'unknown'}) found issues in your changes:\n`
  );

  for (const finding of result.findings) {
    const location = finding.file
      ? ` in \`${finding.file}${finding.line ? `:${finding.line}` : ''}\``
      : '';
    feedback.push(`- **${finding.severity.toUpperCase()}**${location}: ${finding.message}`);
  }

  if (hasFailed) {
    feedback.push('\nPlease fix the errors above before continuing.');
  }

  return feedback.join('\n');
}
