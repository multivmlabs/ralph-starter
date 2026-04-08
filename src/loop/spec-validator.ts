/**
 * Spec Validator
 *
 * Validates spec completeness before starting a coding loop.
 * Checks for required sections, RFC 2119 keywords, and acceptance criteria.
 */

export type SpecWarning = {
  level: 'error' | 'warning' | 'info';
  message: string;
};

export type SpecValidationResult = {
  valid: boolean;
  score: number; // 0-100 completeness score
  warnings: SpecWarning[];
};

/**
 * Validate a spec's completeness and quality.
 * Returns a result with a completeness score and any warnings.
 */
export function validateSpec(content: string): SpecValidationResult {
  const warnings: SpecWarning[] = [];
  let score = 0;
  const maxScore = 100;

  // Check for proposal/rationale section (20 points)
  const hasProposal = /^#+\s*(proposal|rationale|why|overview|purpose|summary)/im.test(content);
  if (hasProposal) {
    score += 20;
  } else {
    warnings.push({
      level: 'warning',
      message:
        'No proposal or rationale section found. Add a ## Proposal section explaining why this change is needed.',
    });
  }

  // Check for requirements with RFC 2119 keywords (25 points)
  const rfc2119 = /\b(SHALL|MUST|SHOULD|MAY|REQUIRED|RECOMMENDED)\b/g;
  const rfc2119Matches = content.match(rfc2119);
  if (rfc2119Matches && rfc2119Matches.length > 0) {
    score += 25;
  } else {
    warnings.push({
      level: 'info',
      message:
        'No RFC 2119 keywords found (SHALL, MUST, SHOULD). Consider using formal requirement language for clarity.',
    });
    // Still give partial credit for having content
    if (content.length > 200) {
      score += 10;
    }
  }

  // Check for design/technical approach section (15 points)
  const hasDesign = /^#+\s*(design|architecture|technical|approach|implementation|how)/im.test(
    content
  );
  if (hasDesign) {
    score += 15;
  } else {
    warnings.push({
      level: 'info',
      message:
        'No design section found. Consider adding a ## Design section with the technical approach.',
    });
  }

  // Check for tasks/checklist (15 points)
  const hasTasks =
    /^#+\s*(tasks?|checklist|steps|todo|plan)/im.test(content) || /- \[[ x]\]/m.test(content);
  if (hasTasks) {
    score += 15;
  } else {
    warnings.push({
      level: 'info',
      message:
        'No tasks or checklist found. Consider adding a ## Tasks section with implementation steps.',
    });
  }

  // Check for acceptance criteria or Given/When/Then (15 points)
  const hasGWT =
    /given\s*:/i.test(content) && /when\s*:/i.test(content) && /then\s*:/i.test(content);
  const hasAcceptanceCriteria = /^#+\s*(acceptance\s+criteria|criteria|verification)/im.test(
    content
  );
  if (hasGWT || hasAcceptanceCriteria) {
    score += 15;
  } else {
    warnings.push({
      level: 'warning',
      message:
        'No acceptance criteria found. Add Given/When/Then blocks to define testable conditions.',
    });
  }

  // Check minimum content length (10 points)
  const trimmed = content.trim();
  if (trimmed.length >= 500) {
    score += 10;
  } else if (trimmed.length >= 200) {
    score += 5;
    warnings.push({
      level: 'info',
      message: `Spec is short (${trimmed.length} chars). More detail helps the agent produce better results.`,
    });
  } else {
    warnings.push({
      level: 'warning',
      message: `Spec is very short (${trimmed.length} chars). Consider adding more context and requirements.`,
    });
  }

  // Determine validity: score >= 40 means usable
  const valid = score >= 40;

  if (!valid) {
    warnings.unshift({
      level: 'error',
      message: `Spec completeness is low (${score}/${maxScore}). The spec may not have enough detail for the agent to work effectively.`,
    });
  }

  return { valid, score, warnings };
}

/**
 * Format validation result for CLI output.
 */
export function formatValidationResult(result: SpecValidationResult): string {
  const lines: string[] = [];

  const emoji = result.valid ? 'PASS' : 'FAIL';
  lines.push(`Spec Validation: ${emoji} (${result.score}/100)`);
  lines.push('');

  for (const warning of result.warnings) {
    const prefix =
      warning.level === 'error' ? '[ERROR]' : warning.level === 'warning' ? '[WARN]' : '[INFO]';
    lines.push(`  ${prefix} ${warning.message}`);
  }

  if (result.warnings.length === 0) {
    lines.push('  No issues found.');
  }

  return lines.join('\n');
}
