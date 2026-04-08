/**
 * ralph-starter openspec — Interactive OpenSpec wizard
 *
 * Guides the user through working with OpenSpec specs:
 * 1. Detect or create openspec/ directory
 * 2. Browse existing changes or create a new one
 * 3. Select a change to build
 * 4. Validate and delegate to run command
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { validateSpec } from '../loop/spec-validator.js';
import { type RunCommandOptions, runCommand } from './run.js';

export type OpenSpecWizardOptions = {
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
};

/** Detect the openspec/ directory in the current project */
function findOpenSpecDir(): string | null {
  const dir = resolve(process.cwd(), 'openspec');
  if (existsSync(dir) && statSync(dir).isDirectory()) {
    return dir;
  }
  return null;
}

/** Get all active changes (non-archived, non-hidden directories) */
function getActiveChanges(openspecDir: string): string[] {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) return [];

  return readdirSync(changesDir)
    .filter((name) => {
      if (name === 'archive' || name.startsWith('.')) return false;
      return statSync(join(changesDir, name)).isDirectory();
    })
    .sort();
}

/** Get info about a change for display */
function getChangeInfo(openspecDir: string, name: string): { files: string[]; score: number } {
  const changePath = join(openspecDir, 'changes', name);
  const files: string[] = [];
  const parts: string[] = [];

  for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
    const filePath = join(changePath, file);
    if (existsSync(filePath)) {
      files.push(file);
      parts.push(readFileSync(filePath, 'utf-8'));
    }
  }

  const specsDir = join(changePath, 'specs');
  if (existsSync(specsDir)) {
    const areas = readdirSync(specsDir).filter((d) => statSync(join(specsDir, d)).isDirectory());
    for (const area of areas) {
      const specPath = join(specsDir, area, 'spec.md');
      if (existsSync(specPath)) {
        files.push(`specs/${area}`);
        parts.push(readFileSync(specPath, 'utf-8'));
      }
    }
  }

  const result = validateSpec(parts.join('\n\n'));
  return { files, score: result.score };
}

/** Score badge for display */
function scoreBadge(score: number): string {
  if (score >= 70) return chalk.green(`${score}/100`);
  if (score >= 40) return chalk.yellow(`${score}/100`);
  return chalk.red(`${score}/100`);
}

/** Scaffold a new OpenSpec change directory */
function scaffoldChange(openspecDir: string, changeName: string): string {
  const changePath = join(openspecDir, 'changes', changeName);
  const specsDir = join(changePath, 'specs');

  mkdirSync(changePath, { recursive: true });
  mkdirSync(specsDir, { recursive: true });

  writeFileSync(
    join(changePath, 'proposal.md'),
    `# ${changeName}

## Rationale

<!-- Why is this change needed? What problem does it solve? -->

## Scope

<!-- What is included in this change? What is explicitly out of scope? -->

## Success Criteria

<!-- How do we know this change is complete and correct? -->
`,
    'utf-8'
  );

  writeFileSync(
    join(changePath, 'design.md'),
    `# ${changeName} — Design

## Technical Approach

<!-- How will this be implemented? What architecture decisions are made? -->

## Data Model

<!-- Any new data structures, database changes, or API contracts? -->

## Dependencies

<!-- What existing code/services does this depend on? -->
`,
    'utf-8'
  );

  writeFileSync(
    join(changePath, 'tasks.md'),
    `# ${changeName} — Tasks

## Implementation Checklist

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria

- [ ] Given/When/Then scenario 1
- [ ] Given/When/Then scenario 2
`,
    'utf-8'
  );

  return changePath;
}

/** Scaffold the openspec/ root directory */
function scaffoldOpenSpec(): string {
  const openspecDir = resolve(process.cwd(), 'openspec');
  const changesDir = join(openspecDir, 'changes');
  const archiveDir = join(changesDir, 'archive');
  const specsDir = join(openspecDir, 'specs');

  mkdirSync(archiveDir, { recursive: true });
  mkdirSync(specsDir, { recursive: true });

  if (!existsSync(join(openspecDir, 'config.yaml'))) {
    writeFileSync(
      join(openspecDir, 'config.yaml'),
      `# OpenSpec Configuration
# See: https://ralphstarter.ai/docs/sources/openspec

version: "1.0"
`,
      'utf-8'
    );
  }

  return openspecDir;
}

export async function openspecCommand(options: OpenSpecWizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('  OpenSpec'));
  console.log(chalk.dim('  Build from structured specs interactively'));
  console.log();

  // Step 1: Detect or create openspec/ directory
  let openspecDir = findOpenSpecDir();

  if (!openspecDir) {
    const { shouldCreate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCreate',
        message: 'No openspec/ directory found. Create one?',
        default: true,
      },
    ]);

    if (!shouldCreate) {
      console.log(
        chalk.dim('  Run ralph-starter openspec in a project with an openspec/ directory.')
      );
      return;
    }

    openspecDir = scaffoldOpenSpec();
    console.log(chalk.green('  Created openspec/ directory'));
    console.log();
  }

  // Step 2: List changes and choose action
  const changes = getActiveChanges(openspecDir);

  const CREATE_NEW = '__create_new__';
  const choices: Array<{ name: string; value: string }> = [];

  if (changes.length > 0) {
    for (const name of changes) {
      const info = getChangeInfo(openspecDir, name);
      const fileList = info.files.length > 0 ? chalk.dim(` (${info.files.join(', ')})`) : '';
      choices.push({
        name: `${name}${fileList} ${scoreBadge(info.score)}`,
        value: name,
      });
    }
  }

  choices.push({
    name: chalk.cyan('+ Create a new change'),
    value: CREATE_NEW,
  });

  const { selectedChange } = await inquirer.prompt([
    {
      type: 'select',
      name: 'selectedChange',
      message: changes.length > 0 ? 'Select a change to build:' : 'No changes found. Create one?',
      choices,
    },
  ]);

  // Step 3: Handle new change creation
  let changeName: string;

  if (selectedChange === CREATE_NEW) {
    const { newName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newName',
        message: 'Change name:',
        suffix: chalk.dim('\n  (e.g., add-auth, fix-payments, redesign-dashboard)\n  '),
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) return 'Please enter a change name';
          if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(trimmed) && !/^[a-z0-9]$/.test(trimmed)) {
            return 'Use lowercase letters, numbers, and hyphens (e.g., add-auth)';
          }
          if (openspecDir && existsSync(join(openspecDir, 'changes', trimmed))) {
            return `Change "${trimmed}" already exists`;
          }
          return true;
        },
      },
    ]);

    changeName = newName.trim();
    const changePath = scaffoldChange(openspecDir, changeName);

    console.log();
    console.log(chalk.green(`  Created change: ${changeName}`));
    console.log(chalk.dim(`  ${changePath}/`));
    console.log(chalk.dim('    proposal.md  — rationale and scope'));
    console.log(chalk.dim('    design.md    — technical approach'));
    console.log(chalk.dim('    tasks.md     — implementation checklist'));
    console.log(chalk.dim('    specs/       — detailed specs'));
    console.log();

    const { editFirst } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'editFirst',
        message: 'Edit specs before running? (recommended for new changes)',
        default: true,
      },
    ]);

    if (editFirst) {
      console.log();
      console.log(chalk.cyan('  Edit your specs, then run:'));
      console.log(chalk.bold(`  ralph-starter openspec`));
      console.log(
        chalk.dim(`  or: ralph-starter run --from openspec:${changeName} --spec-validate`)
      );
      console.log();
      return;
    }
  } else {
    changeName = selectedChange;
  }

  // Step 4: Show validation preview
  const info = getChangeInfo(openspecDir, changeName);
  console.log();
  console.log(chalk.dim(`  Change: ${changeName}`));
  console.log(chalk.dim(`  Files:  ${info.files.join(', ') || 'none'}`));
  console.log(chalk.dim(`  Score:  ${scoreBadge(info.score)}`));

  if (info.score < 40) {
    console.log();
    console.log(chalk.yellow('  Warning: Spec score is low. Consider adding more detail to:'));
    if (!info.files.includes('proposal.md'))
      console.log(chalk.dim('    - proposal.md (rationale)'));
    if (!info.files.includes('design.md'))
      console.log(chalk.dim('    - design.md (technical approach)'));
    if (!info.files.includes('tasks.md')) console.log(chalk.dim('    - tasks.md (checklist)'));

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway?',
        default: false,
      },
    ]);

    if (!proceed) {
      console.log(chalk.dim('  Edit your specs, then run ralph-starter openspec again.'));
      return;
    }
  }

  // Step 5: Run
  console.log();
  console.log(chalk.green(`  Starting build for ${changeName}...`));
  console.log();

  const runOpts: RunCommandOptions = {
    from: `openspec:${changeName}`,
    auto: true,
    commit: options.commit ?? false,
    push: options.push,
    pr: options.pr,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    agent: options.agent,
  };

  await runCommand(changeName, runOpts);
}
