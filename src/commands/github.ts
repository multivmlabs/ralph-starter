/**
 * ralph-starter github — Interactive GitHub issue-to-code wizard
 *
 * Guides the user through 4 steps:
 * 1. Repository (owner/repo or full URL)
 * 2. Issue selection (fetch open issues, pick one)
 * 3. Tech stack selection (auto-detect + list + custom)
 * 4. Model selection (smart per-agent dropdown)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { detectAvailableAgents } from '../loop/agents.js';
import { type RunCommandOptions, runCommand } from './run.js';

interface GitHubWizardOptions {
  commit?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  labels: Array<{ name: string }>;
  body?: string;
}

/** Parse a GitHub repository identifier from various formats */
function parseRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();

  // Full GitHub URL: https://github.com/owner/repo or https://github.com/owner/repo/...
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  // owner/repo format
  const slashMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }

  return null;
}

/** Fetch open issues from a GitHub repository using gh CLI */
function fetchIssues(owner: string, repo: string, limit = 20): GitHubIssue[] {
  try {
    const result = execSync(
      `gh issue list -R ${owner}/${repo} --json number,title,labels --state open --limit ${limit}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return JSON.parse(result) as GitHubIssue[];
  } catch {
    return [];
  }
}

/** Detect the frontend framework from the current project's package.json */
function detectProjectStack(): string | null {
  const pkgPath = join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (allDeps.next) return 'Next.js + TypeScript + Tailwind CSS';
    if (allDeps.astro) return 'Astro';
    if (allDeps.nuxt) return 'Nuxt + Vue + TypeScript';
    if (allDeps.svelte || allDeps['@sveltejs/kit']) return 'SvelteKit';
    if (allDeps.vue) return 'Vue + TypeScript';
    if (allDeps.react) {
      const hasTailwind = !!allDeps.tailwindcss;
      return hasTailwind ? 'React + TypeScript + Tailwind CSS' : 'React + TypeScript';
    }
    return null;
  } catch {
    return null;
  }
}

/** Build model choices based on detected agents */
async function buildModelChoices(): Promise<Array<{ name: string; value: string }>> {
  const agents = await detectAvailableAgents();
  const hasClaude = agents.some((a) => a.type === 'claude-code' && a.available);
  const hasCodex = agents.some((a) => a.type === 'codex' && a.available);

  const choices: Array<{ name: string; value: string }> = [];

  if (hasClaude) {
    choices.push(
      {
        name: 'Claude Opus 4.6 — maximum quality (Recommended)',
        value: 'claude-opus-4-6',
      },
      {
        name: 'Claude Sonnet 4.5 — fast + cost-effective',
        value: 'claude-sonnet-4-5-20250929',
      }
    );
  }

  if (hasCodex) {
    choices.push(
      { name: 'o3 (OpenAI)', value: 'o3' },
      { name: 'o4-mini (OpenAI)', value: 'o4-mini' }
    );
  }

  if (choices.length === 0) {
    choices.push(
      {
        name: 'Claude Opus 4.6 (Recommended)',
        value: 'claude-opus-4-6',
      },
      {
        name: 'Claude Sonnet 4.5',
        value: 'claude-sonnet-4-5-20250929',
      }
    );
  }

  choices.push({
    name: 'Custom model ID',
    value: 'custom',
  });

  return choices;
}

export async function githubCommand(options: GitHubWizardOptions): Promise<void> {
  // Detect available agents BEFORE any interactive prompts
  const modelChoices = await buildModelChoices();

  console.log(chalk.cyan.bold('  GitHub to Code'));
  console.log(chalk.dim('  Build from GitHub issues in one command'));
  console.log();

  // Step 1: Repository
  const { repoInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'repoInput',
      message: 'GitHub repository:',
      suffix: chalk.dim('\n  (owner/repo or full GitHub URL)\n  '),
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Please provide a repository';
        if (!parseRepo(trimmed)) {
          return 'Please use owner/repo format (e.g., facebook/react) or a full GitHub URL';
        }
        return true;
      },
    },
  ]);

  const parsed = parseRepo(repoInput.trim())!;
  const { owner, repo } = parsed;

  // Step 2: Issue selection
  console.log(chalk.dim(`  Fetching open issues from ${owner}/${repo}...`));
  const issues = fetchIssues(owner, repo);

  if (issues.length === 0) {
    console.log(chalk.yellow(`\n  No open issues found in ${owner}/${repo}.`));
    console.log(chalk.dim('  Make sure you have access to the repo and gh CLI is authenticated.'));
    return;
  }

  console.log(chalk.bold('\n  Select an issue:'));
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const labels = issue.labels?.map((l) => l.name).join(', ');
    const num = chalk.cyan(`  ${i + 1})`);
    const labelStr = labels ? chalk.dim(` [${labels}]`) : '';
    console.log(`${num} #${issue.number}: ${issue.title}${labelStr}`);
  }

  const { issueNum } = await inquirer.prompt([
    {
      type: 'input',
      name: 'issueNum',
      message: 'Select issue (number):',
      default: '1',
      validate: (input: string) => {
        const n = Number(input.trim());
        if (!Number.isNaN(n) && n >= 1 && n <= issues.length) return true;
        return `Enter a number between 1 and ${issues.length}`;
      },
    },
  ]);

  const selectedIssue = issues[Number(issueNum.trim()) - 1];
  console.log(chalk.green(`  Selected: #${selectedIssue.number} — ${selectedIssue.title}`));
  console.log();

  // Step 3: Tech stack (auto-detect + list + custom)
  const detectedStack = detectProjectStack();
  const stackChoices: Array<{ name: string; value: string }> = [];

  if (detectedStack) {
    stackChoices.push({
      name: `${detectedStack} (Detected)`,
      value: detectedStack,
    });
  }

  const defaultStacks = [
    'React + TypeScript + Tailwind CSS',
    'Next.js + TypeScript + Tailwind CSS',
    'Vue + TypeScript',
    'SvelteKit',
    'Node.js + TypeScript',
    'Python',
  ];

  for (const stack of defaultStacks) {
    if (detectedStack && stack === detectedStack) continue;
    stackChoices.push({ name: stack, value: stack });
  }

  stackChoices.push({
    name: 'Custom (type your own stack)',
    value: 'custom',
  });

  const { stackChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stackChoice',
      message: 'Tech stack?',
      choices: stackChoices,
      default: detectedStack || 'React + TypeScript + Tailwind CSS',
    },
  ]);

  let techStack = stackChoice;
  if (stackChoice === 'custom') {
    const { customStack } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customStack',
        message: 'Tech stack:',
        suffix: chalk.dim('\n  (e.g., "express + prisma + postgresql")\n  '),
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Please describe your tech stack',
      },
    ]);
    techStack = customStack.trim();
  }

  // Step 4: Model selection (printed menu + number input)
  console.log(chalk.bold('  Which model?'));
  for (let idx = 0; idx < modelChoices.length; idx++) {
    const c = modelChoices[idx];
    const num = chalk.cyan(`  ${idx + 1})`);
    console.log(`${num} ${c.name}`);
  }

  const { modelNum } = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelNum',
      message: 'Select model (number):',
      default: '1',
      validate: (input: string) => {
        const n = Number(input.trim());
        if (!Number.isNaN(n) && n >= 1 && n <= modelChoices.length) return true;
        return `Enter a number between 1 and ${modelChoices.length}`;
      },
    },
  ]);

  const selectedChoice = modelChoices[Number(modelNum.trim()) - 1];
  let model = selectedChoice.value;

  if (model === 'custom') {
    const { customModel } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customModel',
        message: 'Model ID:',
        suffix: chalk.dim('\n  (e.g., claude-opus-4-6, claude-sonnet-4-5-20250929)\n  '),
        validate: (input: string) => (input.trim().length > 0 ? true : 'Please enter a model ID'),
      },
    ]);
    model = customModel.trim();

    const validModelPattern = /^(claude-|gpt-|o[0-9]|gemini-)/;
    if (!validModelPattern.test(model)) {
      console.log(
        chalk.red(`  Invalid model ID: "${model}". Use a full model ID like claude-opus-4-6`)
      );
      return;
    }
  }

  console.log(chalk.green(`  Using: ${selectedChoice.name}`));
  console.log();

  // Build task with context
  const fullTask = `Using ${techStack}: Implement GitHub issue #${selectedIssue.number}: ${selectedIssue.title}`;

  // Delegate to run command with GitHub options pre-configured
  const runOptions: RunCommandOptions = {
    from: 'github',
    project: `${owner}/${repo}`,
    issue: selectedIssue.number,
    model,
    auto: true,
    commit: options.commit ?? false,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    agent: options.agent,
  };

  await runCommand(fullTask, runOptions);
}
