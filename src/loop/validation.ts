import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import { detectPackageManager, getRunCommand } from '../utils/package-manager.js';

export interface ValidationCommand {
  name: string;
  command: string;
  args: string[];
}

export interface ValidationResult {
  success: boolean;
  command: string;
  output: string;
  error?: string;
}

/**
 * Detect validation commands from AGENTS.md or package.json
 */
export function detectValidationCommands(cwd: string): ValidationCommand[] {
  const commands: ValidationCommand[] = [];

  // Check AGENTS.md for validation commands
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');

    // Look for test command (must be in backticks after bullet or colon)
    // Matches: "- **Test**: `npm test`" or "- Test: `bun test`" or "* test: `vitest`"
    const testMatch = content.match(/[-*]\s*\*?\*?test\*?\*?[:\s]+`([^`]+)`/i);
    if (testMatch) {
      const parts = testMatch[1].trim().split(/\s+/);
      commands.push({
        name: 'test',
        command: parts[0],
        args: parts.slice(1),
      });
    }

    // Look for lint command (must be in backticks after bullet or colon)
    const lintMatch = content.match(/[-*]\s*\*?\*?lint\*?\*?[:\s]+`([^`]+)`/i);
    if (lintMatch) {
      const parts = lintMatch[1].trim().split(/\s+/);
      commands.push({
        name: 'lint',
        command: parts[0],
        args: parts.slice(1),
      });
    }

    // Look for build command (must be in backticks after bullet or colon)
    const buildMatch = content.match(/[-*]\s*\*?\*?build\*?\*?[:\s]+`([^`]+)`/i);
    if (buildMatch) {
      const parts = buildMatch[1].trim().split(/\s+/);
      commands.push({
        name: 'build',
        command: parts[0],
        args: parts.slice(1),
      });
    }
  }

  // Fallback to package.json scripts
  if (commands.length === 0) {
    const packagePath = join(cwd, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const scripts = pkg.scripts || {};
        const pm = detectPackageManager(cwd);

        if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
          const cmd = getRunCommand(pm, 'test');
          commands.push({ name: 'test', ...cmd });
        }
        if (scripts.lint) {
          const cmd = getRunCommand(pm, 'lint');
          commands.push({ name: 'lint', ...cmd });
        }
        if (scripts.build) {
          const cmd = getRunCommand(pm, 'build');
          commands.push({ name: 'build', ...cmd });
        }
        if (scripts.typecheck) {
          const cmd = getRunCommand(pm, 'typecheck');
          commands.push({ name: 'typecheck', ...cmd });
        }
      } catch {
        // Invalid package.json
      }
    }
  }

  return commands;
}

/**
 * Detect lint-only commands for lightweight intermediate-iteration checks.
 * Much faster than build (5-15s vs 30-60s), good for catching syntax errors mid-loop.
 * Returns empty array if no lint command is available — caller should skip validation.
 */
export function detectLintCommands(cwd: string): ValidationCommand[] {
  const commands: ValidationCommand[] = [];

  // Check AGENTS.md for lint command
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');
    const lintMatch = content.match(/[-*]\s*\*?\*?lint\*?\*?[:\s]+`([^`]+)`/i);
    if (lintMatch) {
      const parts = lintMatch[1].trim().split(/\s+/);
      commands.push({ name: 'lint', command: parts[0], args: parts.slice(1) });
    }
  }

  // Fallback to package.json
  if (commands.length === 0) {
    const packagePath = join(cwd, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const scripts = pkg.scripts || {};
        const pm = detectPackageManager(cwd);

        if (scripts.lint) {
          const cmd = getRunCommand(pm, 'lint');
          commands.push({ name: 'lint', ...cmd });
        }
      } catch {
        // Invalid package.json
      }
    }
  }

  return commands;
}

/**
 * Run a lint validation command with a short timeout (lint is fast).
 */
export async function runLintValidation(
  cwd: string,
  command: ValidationCommand
): Promise<ValidationResult> {
  try {
    const result = await execa(command.command, command.args, {
      cwd,
      timeout: 60000, // 1 minute timeout (lint is fast)
      reject: false,
    });

    return {
      success: result.exitCode === 0,
      command: `${command.command} ${command.args.join(' ')}`,
      output: result.stdout,
      ...(result.exitCode !== 0 && { error: result.stderr || result.stdout }),
    };
  } catch (error) {
    return {
      success: false,
      command: `${command.command} ${command.args.join(' ')}`,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect build-only commands for always-on build validation.
 * Unlike detectValidationCommands(), this:
 * 1. Only returns build/typecheck commands (not test/lint)
 * 2. Has TypeScript fallback (npx tsc --noEmit) when no build script exists
 * 3. Is designed to be called per-iteration (re-detects if package.json appears mid-loop)
 */
export function detectBuildCommands(cwd: string): ValidationCommand[] {
  const commands: ValidationCommand[] = [];

  // Check AGENTS.md for build command
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');

    const buildMatch = content.match(/[-*]\s*\*?\*?build\*?\*?[:\s]+`([^`]+)`/i);
    if (buildMatch) {
      const parts = buildMatch[1].trim().split(/\s+/);
      commands.push({ name: 'build', command: parts[0], args: parts.slice(1) });
    }

    const typecheckMatch = content.match(/[-*]\s*\*?\*?typecheck\*?\*?[:\s]+`([^`]+)`/i);
    if (typecheckMatch) {
      const parts = typecheckMatch[1].trim().split(/\s+/);
      commands.push({ name: 'typecheck', command: parts[0], args: parts.slice(1) });
    }
  }

  // Fallback to package.json
  if (commands.length === 0) {
    const packagePath = join(cwd, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const scripts = pkg.scripts || {};

        if (scripts.build) {
          commands.push({ name: 'build', command: 'npm', args: ['run', 'build'] });
        }
        if (scripts.typecheck) {
          commands.push({ name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] });
        }
      } catch {
        // Invalid package.json
      }
    }
  }

  // TypeScript fallback: if no build/typecheck script but tsconfig.json exists
  if (commands.length === 0) {
    const tsconfigPath = join(cwd, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
      commands.push({ name: 'typecheck', command: 'npx', args: ['tsc', '--noEmit'] });
    }
  }

  return commands;
}

/**
 * Run a single build validation command with a shorter timeout.
 */
export async function runBuildValidation(
  cwd: string,
  command: ValidationCommand
): Promise<ValidationResult> {
  try {
    const result = await execa(command.command, command.args, {
      cwd,
      timeout: 120000, // 2 minute timeout (vs 5 min for full validation)
      reject: false,
    });

    return {
      success: result.exitCode === 0,
      command: `${command.command} ${command.args.join(' ')}`,
      output: result.stdout,
      ...(result.exitCode !== 0 && { error: result.stderr || result.stdout }),
    };
  } catch (error) {
    return {
      success: false,
      command: `${command.command} ${command.args.join(' ')}`,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run a single validation command
 */
export async function runValidation(
  cwd: string,
  command: ValidationCommand
): Promise<ValidationResult> {
  try {
    const result = await execa(command.command, command.args, {
      cwd,
      timeout: 300000, // 5 minute timeout
      reject: false,
    });

    if (result.exitCode === 0) {
      return {
        success: true,
        command: `${command.command} ${command.args.join(' ')}`,
        output: result.stdout,
      };
    }

    return {
      success: false,
      command: `${command.command} ${command.args.join(' ')}`,
      output: result.stdout,
      error: result.stderr || result.stdout,
    };
  } catch (error) {
    return {
      success: false,
      command: `${command.command} ${command.args.join(' ')}`,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run all validation commands.
 * Runs every command regardless of individual failures — this gives the agent
 * a complete picture of all issues, enabling multi-fix iterations.
 */
export async function runAllValidations(
  cwd: string,
  commands: ValidationCommand[]
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const command of commands) {
    const result = await runValidation(cwd, command);
    results.push(result);
  }

  return results;
}

/**
 * Format validation errors for feedback to the agent
 */
export function formatValidationFeedback(results: ValidationResult[]): string {
  const failedResults = results.filter((r) => !r.success);

  if (failedResults.length === 0) {
    return '';
  }

  const feedback = ['## Validation Failed\n'];

  for (const result of failedResults) {
    feedback.push(`### ${result.command}`);
    feedback.push('```');
    feedback.push(result.error || result.output);
    feedback.push('```\n');
  }

  feedback.push('Please fix the above issues before continuing.');

  return feedback.join('\n');
}
