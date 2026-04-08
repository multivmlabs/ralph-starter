/**
 * Spec Command
 *
 * CLI interface for spec-driven development operations:
 * validate, list, and summarize specs from any detected source.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { formatValidationResult, validateSpec } from '../loop/spec-validator.js';

type SpecCommandAction = 'validate' | 'list' | 'summary';

interface SpecCommandOptions {
  path?: string;
}

export async function specCommand(
  action: SpecCommandAction,
  options: SpecCommandOptions
): Promise<void> {
  const cwd = process.cwd();

  switch (action) {
    case 'validate':
      return specValidate(cwd, options);
    case 'list':
      return specList(cwd);
    case 'summary':
      return specSummary(cwd);
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.dim('Available actions: validate, list, summary'));
  }
}

/**
 * Detect which spec format is present in the project.
 */
function detectSpecFormat(cwd: string): 'openspec' | 'speckit' | 'raw' | null {
  if (existsSync(join(cwd, 'openspec', 'changes'))) return 'openspec';
  if (existsSync(join(cwd, 'openspec', 'specs'))) return 'openspec';
  if (existsSync(join(cwd, 'specs', 'constitution.md'))) return 'speckit';
  if (existsSync(join(cwd, 'specs'))) return 'raw';
  return null;
}

/**
 * Validate specs in the project.
 */
async function specValidate(cwd: string, options: SpecCommandOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('Spec Validation'));
  console.log();

  const specDir = options.path ? join(cwd, options.path) : null;
  const format = detectSpecFormat(cwd);

  if (specDir && existsSync(specDir)) {
    const stat = statSync(specDir);
    if (stat.isFile()) {
      // Validate a specific file
      const content = readFileSync(specDir, 'utf-8');
      const result = validateSpec(content);
      console.log(chalk.dim(`File: ${options.path}`));
      console.log(formatValidationResult(result));
      return;
    }
    if (stat.isDirectory()) {
      // Validate a specific directory (e.g., an OpenSpec change)
      const parts: string[] = [];
      for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
        const fp = join(specDir, file);
        if (existsSync(fp)) parts.push(readFileSync(fp, 'utf-8'));
      }
      // Also read specs/*/spec.md
      const specsSubDir = join(specDir, 'specs');
      if (existsSync(specsSubDir)) {
        for (const area of readdirSync(specsSubDir)) {
          const specPath = join(specsSubDir, area, 'spec.md');
          if (existsSync(specPath)) parts.push(readFileSync(specPath, 'utf-8'));
        }
      }
      // Fallback: read all .md files in the directory
      if (parts.length === 0) {
        for (const file of readdirSync(specDir).filter((f) => f.endsWith('.md'))) {
          parts.push(readFileSync(join(specDir, file), 'utf-8'));
        }
      }
      if (parts.length === 0) {
        console.log(chalk.yellow(`No spec files found in ${options.path}`));
        return;
      }
      const result = validateSpec(parts.join('\n\n'));
      console.log(chalk.dim(`Directory: ${options.path}`));
      console.log(formatValidationResult(result));
      return;
    }
  }

  if (format === 'openspec') {
    validateOpenSpec(cwd);
  } else if (format === 'speckit') {
    validateSpecKit(cwd);
  } else if (format === 'raw') {
    validateRawSpecs(cwd);
  } else {
    console.log(chalk.yellow('No specs found.'));
    console.log(chalk.dim('Create specs in openspec/ or specs/ directory.'));
    console.log();
    console.log(chalk.dim('Supported formats:'));
    console.log(chalk.dim('  - OpenSpec: openspec/changes/<name>/proposal.md'));
    console.log(chalk.dim('  - Spec-Kit: specs/constitution.md'));
    console.log(chalk.dim('  - Raw: specs/*.md'));
  }
}

function validateOpenSpec(cwd: string): void {
  const changesDir = join(cwd, 'openspec', 'changes');
  if (!existsSync(changesDir)) {
    console.log(chalk.yellow('No openspec/changes/ directory found.'));
    return;
  }

  const changes = readdirSync(changesDir).filter(
    (name) =>
      name !== 'archive' && !name.startsWith('.') && statSync(join(changesDir, name)).isDirectory()
  );

  if (changes.length === 0) {
    console.log(chalk.yellow('No changes found in openspec/changes/'));
    return;
  }

  console.log(
    chalk.dim(`Format: OpenSpec (${changes.length} change${changes.length > 1 ? 's' : ''})`)
  );
  console.log();

  let allValid = true;
  for (const name of changes) {
    const changePath = join(changesDir, name);
    const parts: string[] = [];

    for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
      const filePath = join(changePath, file);
      if (existsSync(filePath)) {
        parts.push(readFileSync(filePath, 'utf-8'));
      }
    }

    // Read specs
    const specsDir = join(changePath, 'specs');
    if (existsSync(specsDir)) {
      for (const area of readdirSync(specsDir)) {
        const specPath = join(specsDir, area, 'spec.md');
        if (existsSync(specPath)) {
          parts.push(readFileSync(specPath, 'utf-8'));
        }
      }
    }

    const combined = parts.join('\n\n');
    const result = validateSpec(combined);

    console.log(
      `  ${result.valid ? chalk.green('PASS') : chalk.red('FAIL')} ${chalk.bold(name)} (${result.score}/100)`
    );
    for (const w of result.warnings.filter((w) => w.level !== 'info')) {
      console.log(chalk.dim(`       ${w.message}`));
    }

    if (!result.valid) allValid = false;
  }

  console.log();
  if (allValid) {
    console.log(chalk.green('All specs pass validation.'));
  } else {
    console.log(chalk.yellow('Some specs need improvement. See warnings above.'));
  }
}

function validateSpecKit(cwd: string): void {
  const specsDir = join(cwd, 'specs');
  console.log(chalk.dim('Format: Spec-Kit'));
  console.log();

  const files = ['constitution.md', 'specification.md', 'plan.md', 'tasks.md'];
  const parts: string[] = [];

  for (const file of files) {
    const filePath = join(specsDir, file);
    if (existsSync(filePath)) {
      parts.push(readFileSync(filePath, 'utf-8'));
      console.log(`  ${chalk.green('found')} ${file}`);
    } else {
      console.log(`  ${chalk.yellow('missing')} ${file}`);
    }
  }

  console.log();
  if (parts.length > 0) {
    const result = validateSpec(parts.join('\n\n'));
    console.log(formatValidationResult(result));
  }
}

function validateRawSpecs(cwd: string): void {
  const specsDir = join(cwd, 'specs');
  const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));

  console.log(
    chalk.dim(`Format: Raw markdown (${files.length} file${files.length > 1 ? 's' : ''})`)
  );
  console.log();

  for (const file of files) {
    const content = readFileSync(join(specsDir, file), 'utf-8');
    const result = validateSpec(content);
    console.log(
      `  ${result.valid ? chalk.green('PASS') : chalk.red('FAIL')} ${chalk.bold(file)} (${result.score}/100)`
    );
  }
}

/**
 * List available specs from any detected source.
 */
async function specList(cwd: string): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('Available Specs'));
  console.log();

  const format = detectSpecFormat(cwd);

  if (format === 'openspec') {
    const changesDir = join(cwd, 'openspec', 'changes');
    if (existsSync(changesDir)) {
      const changes = readdirSync(changesDir).filter(
        (name) =>
          name !== 'archive' &&
          !name.startsWith('.') &&
          statSync(join(changesDir, name)).isDirectory()
      );
      console.log(chalk.dim('Format: OpenSpec'));
      console.log();
      for (const name of changes) {
        const changePath = join(changesDir, name);
        const files = ['proposal.md', 'design.md', 'tasks.md'].filter((f) =>
          existsSync(join(changePath, f))
        );
        console.log(`  ${chalk.bold(name)} (${files.join(', ')})`);
      }
      if (changes.length === 0) {
        console.log(chalk.dim('  No active changes.'));
      }
    }

    const globalSpecs = join(cwd, 'openspec', 'specs');
    if (existsSync(globalSpecs)) {
      const specs = readdirSync(globalSpecs).filter((d) =>
        statSync(join(globalSpecs, d)).isDirectory()
      );
      if (specs.length > 0) {
        console.log();
        console.log(chalk.dim('Global specs:'));
        for (const spec of specs) {
          console.log(`  ${chalk.bold(spec)}`);
        }
      }
    }
  } else if (format === 'speckit' || format === 'raw') {
    const specsDir = join(cwd, 'specs');
    const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
    console.log(chalk.dim(`Format: ${format === 'speckit' ? 'Spec-Kit' : 'Raw markdown'}`));
    console.log();
    for (const file of files) {
      console.log(`  ${chalk.bold(file)}`);
    }
  } else {
    console.log(chalk.yellow('No specs found.'));
    console.log(chalk.dim('Create specs in openspec/ or specs/ directory.'));
  }

  console.log();
}

/**
 * Show spec completeness summary.
 */
async function specSummary(cwd: string): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('Spec Summary'));
  console.log();

  const format = detectSpecFormat(cwd);

  if (!format) {
    console.log(chalk.yellow('No specs found.'));
    return;
  }

  console.log(
    `  Format:  ${format === 'openspec' ? 'OpenSpec' : format === 'speckit' ? 'Spec-Kit' : 'Raw markdown'}`
  );

  if (format === 'openspec') {
    const changesDir = join(cwd, 'openspec', 'changes');
    const changes = existsSync(changesDir)
      ? readdirSync(changesDir).filter(
          (name) =>
            name !== 'archive' &&
            !name.startsWith('.') &&
            statSync(join(changesDir, name)).isDirectory()
        )
      : [];

    const archiveDir = join(cwd, 'openspec', 'changes', 'archive');
    const archived = existsSync(archiveDir)
      ? readdirSync(archiveDir).filter((d) => statSync(join(archiveDir, d)).isDirectory()).length
      : 0;

    const globalSpecs = join(cwd, 'openspec', 'specs');
    const globalCount = existsSync(globalSpecs)
      ? readdirSync(globalSpecs).filter((d) => statSync(join(globalSpecs, d)).isDirectory()).length
      : 0;

    console.log(`  Changes: ${changes.length} active, ${archived} archived`);
    console.log(`  Specs:   ${globalCount} global`);

    if (changes.length > 0) {
      let totalScore = 0;
      for (const name of changes) {
        const changePath = join(changesDir, name);
        const parts: string[] = [];
        for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
          const fp = join(changePath, file);
          if (existsSync(fp)) parts.push(readFileSync(fp, 'utf-8'));
        }
        // Also read specs/*/spec.md (matching validateOpenSpec behavior)
        const specsSubDir = join(changePath, 'specs');
        if (existsSync(specsSubDir)) {
          for (const area of readdirSync(specsSubDir)) {
            const specPath = join(specsSubDir, area, 'spec.md');
            if (existsSync(specPath)) parts.push(readFileSync(specPath, 'utf-8'));
          }
        }
        const result = validateSpec(parts.join('\n\n'));
        totalScore += result.score;
      }
      const avg = Math.round(totalScore / changes.length);
      console.log(`  Average: ${avg}/100 completeness`);
    }
  } else {
    const specsDir = join(cwd, 'specs');
    const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
    console.log(`  Files:   ${files.length}`);
  }

  console.log();
}
