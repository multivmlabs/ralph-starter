import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { type Agent, detectAvailableAgents, detectBestAgent } from '../loop/agents.js';
import { runLoop } from '../loop/executor.js';
import {
  detectBuildCommands,
  detectValidationCommands,
  formatValidationFeedback,
  runAllValidations,
  type ValidationCommand,
} from '../loop/validation.js';
import { autoInstallSkillsFromTask } from '../skills/auto-install.js';

interface FixOptions {
  agent?: string;
  commit?: boolean;
  maxIterations?: string;
  outputDir?: string;
  scan?: boolean;
}

/**
 * Parse the last validation failure from .ralph/activity.md.
 * Returns the names of commands that failed (e.g., ["npm run build"]).
 */
function parseLastFailedValidations(cwd: string): string[] {
  const activityPath = join(cwd, '.ralph', 'activity.md');
  if (!existsSync(activityPath)) return [];

  const content = readFileSync(activityPath, 'utf-8');
  // Split into iteration blocks and find the last one with a validation failure
  const blocks = content.split(/^### Iteration/m);
  const lastFailed = blocks.reverse().find((b) => b.includes('Validation Failed'));
  if (!lastFailed) return [];

  const failedNames: string[] = [];
  for (const match of lastFailed.matchAll(/- ❌\s+(.+)/g)) {
    failedNames.push(match[1].trim());
  }
  return failedNames;
}

export async function fixCommand(customTask: string | undefined, options: FixOptions) {
  const cwd = options.outputDir || process.cwd();

  // --- Step 1: Determine which commands to run ---
  let commands: ValidationCommand[] | undefined;
  let mode: 'activity' | 'scan' | 'custom' = 'scan';
  let feedback = '';

  if (customTask) {
    // Custom task provided — still run build to check for errors, but don't bail if clean
    mode = 'custom';
    commands = detectBuildCommands(cwd);
  } else if (!options.scan) {
    const failedNames = parseLastFailedValidations(cwd);
    if (failedNames.length > 0) {
      mode = 'activity';
      const allCommands = detectValidationCommands(cwd);
      commands = allCommands.filter((c) => failedNames.some((name) => name.includes(c.name)));
      if (commands.length === 0) commands = detectBuildCommands(cwd);
    }
  }

  if (!commands || commands.length === 0) {
    if (mode !== 'custom') mode = 'scan';
    commands = detectValidationCommands(cwd);
    if (commands.length === 0) commands = detectBuildCommands(cwd);
  }

  // Run validations if we have commands
  if (commands.length > 0) {
    const spinner = ora(
      mode === 'custom'
        ? 'Checking project health...'
        : `Scanning project (${mode === 'activity' ? 'from last run' : 'full scan'})...`
    ).start();

    const results = await runAllValidations(cwd, commands);
    const failures = results.filter((r) => !r.success);

    if (failures.length === 0 && !customTask) {
      spinner.succeed(chalk.green('All checks passed — nothing to fix!'));
      return;
    }

    if (failures.length > 0) {
      spinner.fail(chalk.red(`Found ${failures.length} issue(s):`));
      for (const f of failures) {
        const errorText = f.error || f.output || '';
        const errorCount = (errorText.match(/error/gi) || []).length;
        console.log(chalk.red(`  ✗ ${f.command}${errorCount ? ` (${errorCount} errors)` : ''}`));
      }
      feedback = formatValidationFeedback(results);
    } else {
      spinner.succeed(chalk.green('Build passing'));
    }
    console.log();
  } else if (!customTask) {
    console.log(chalk.yellow('No build/lint/test commands detected in this project.'));
    return;
  }

  // --- Step 3: Detect agent ---
  let agent: Agent | null = null;

  if (options.agent) {
    const agents = await detectAvailableAgents();
    const found = agents.find(
      (a) => a.type === options.agent || a.name.toLowerCase() === options.agent?.toLowerCase()
    );
    if (!found) {
      console.log(chalk.red(`Agent not found: ${options.agent}`));
      return;
    }
    if (!found.available) {
      console.log(chalk.red(`Agent not available: ${found.name}`));
      return;
    }
    agent = found;
  } else {
    agent = await detectBestAgent();
  }

  if (!agent) {
    console.log(
      chalk.red(
        'No coding agent detected. Install Claude Code, Cursor, or another supported agent.'
      )
    );
    return;
  }

  console.log(chalk.cyan(`Using ${agent.name} to fix issues...\n`));

  // --- Step 4: Build task and run fix loop ---
  let fixTask: string;
  if (customTask) {
    fixTask = feedback
      ? `${customTask}\n\nAlso fix any build/validation errors found during the scan.`
      : customTask;
  } else if (mode === 'activity') {
    fixTask =
      'Fix the build/validation errors in this project. Study the error output below, identify the root cause, and implement the minimal fix. Do not refactor or make unnecessary changes.';
  } else {
    fixTask =
      'Fix all project issues found by the scan below. Prioritize: build errors first, then type errors, then lint violations, then test failures. Make minimal, focused fixes.';
  }

  // For design/visual tasks, add instructions to visually verify with screenshots
  const DESIGN_KEYWORDS = [
    'css',
    'style',
    'styling',
    'padding',
    'margin',
    'spacing',
    'color',
    'colour',
    'background',
    'theme',
    'font',
    'typography',
    'border',
    'shadow',
    'layout',
    'responsive',
    'animation',
    'design',
    'ui',
    'ux',
    'brighter',
    'darker',
    'visual',
  ];
  const isDesignTask =
    customTask && DESIGN_KEYWORDS.some((kw) => customTask.toLowerCase().includes(kw));
  if (isDesignTask) {
    fixTask += `\n\nVisual verification (IMPORTANT):
This is a visual/design task. After making your CSS and styling changes, you MUST visually verify the result:
1. Start a local dev server briefly (exception to the "no dev server" rule for visual checks)
2. Use the /web-design-reviewer skill to take browser screenshots at desktop and mobile viewports
3. Review the screenshots and fix any visual issues you spot (spacing, colors, alignment, contrast)
4. Stop the dev server when done verifying`;
  }

  // Install relevant skills so the agent has design/quality context
  await autoInstallSkillsFromTask(fixTask, cwd);

  const maxIter = options.maxIterations ? Number.parseInt(options.maxIterations, 10) : 3;

  const result = await runLoop({
    task: fixTask,
    cwd,
    agent,
    maxIterations: maxIter,
    auto: true,
    commit: options.commit,
    initialValidationFeedback: feedback || undefined,
    trackProgress: true,
    checkFileCompletion: false,
    validate: mode === 'scan',
  });

  // --- Step 5: Verify fix by re-running validations ---
  // The loop's exit reason may be max_iterations even if the build now passes.
  // For the fix command, success = "do the checks pass now?", not "did the agent say done?"
  let fixed = result.success;

  if (!fixed && commands.length > 0) {
    const verifySpinner = ora('Verifying fix...').start();
    const verifyResults = await runAllValidations(cwd, commands);
    const stillFailing = verifyResults.filter((r) => !r.success);

    if (stillFailing.length === 0) {
      verifySpinner.succeed(chalk.green('All checks passing now!'));
      fixed = true;
    } else {
      verifySpinner.fail(chalk.red(`${stillFailing.length} issue(s) still failing`));
      for (const f of stillFailing) {
        console.log(chalk.red(`  ✗ ${f.command}`));
      }
    }
  }

  // --- Step 6: Report ---
  console.log();
  if (fixed) {
    console.log(chalk.green('All issues fixed!'));
  } else {
    console.log(chalk.red('Could not fix all issues automatically.'));
    console.log(chalk.dim('  Run again or fix remaining issues manually.'));
  }
}
