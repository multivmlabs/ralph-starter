/**
 * Visual Verification Command
 *
 * Runs Playwright MCP visual tests for a project.
 * Can be used standalone or integrated with the coding loop.
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  hasVisualTests,
  isVisualValidationAvailable,
  type PlaywrightOptions,
  runVisualValidation,
  verifyUrl,
} from '../loop/visual-validation.js';

export interface VerifyOptions {
  /** Base URL for visual tests */
  baseUrl?: string;
  /** Browser to use */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** Run headless */
  headless?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Single URL to verify (quick mode) */
  url?: string;
  /** Show detailed output */
  verbose?: boolean;
}

/**
 * Run visual verification command
 */
export async function verifyCommand(options: VerifyOptions = {}): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.bold('  Visual Verification'));
  console.log();

  // Check if Playwright MCP is available
  const spinner = ora('Checking Playwright MCP availability...').start();

  const available = await isVisualValidationAvailable();
  if (!available) {
    spinner.fail('Playwright MCP not available');
    console.log();
    console.log(chalk.yellow('  To install Playwright MCP:'));
    console.log(chalk.gray('  npm install -g @playwright/mcp'));
    console.log();
    console.log(chalk.yellow('  Or run via npx:'));
    console.log(chalk.gray('  npx @playwright/mcp'));
    console.log();
    process.exit(1);
  }

  spinner.succeed('Playwright MCP available');

  // Quick URL verification mode
  if (options.url) {
    await runQuickVerify(options.url, options);
    return;
  }

  // Check for visual tests configuration
  if (!hasVisualTests(cwd)) {
    console.log();
    console.log(chalk.yellow('  No visual tests configured.'));
    console.log();
    console.log(chalk.dim('  Create .ralph/visual-tests.json with:'));
    console.log(
      chalk.gray(`
  {
    "tests": [
      {
        "name": "Home page",
        "url": "http://localhost:3000",
        "selectors": ["nav", "main"]
      }
    ]
  }
`)
    );
    console.log(chalk.dim('  Or add a ## Visual Tests section to AGENTS.md'));
    console.log();
    return;
  }

  // Run visual validation
  const runSpinner = ora('Running visual tests...').start();

  const playwrightOptions: PlaywrightOptions = {
    baseUrl: options.baseUrl,
    browser: options.browser,
    headless: options.headless !== false,
    timeout: options.timeout,
  };

  const result = await runVisualValidation(cwd, playwrightOptions);

  if (result.success) {
    runSpinner.succeed(`Visual tests passed (${result.passed}/${result.testCount})`);
  } else {
    runSpinner.fail(`Visual tests failed (${result.failed}/${result.testCount} failed)`);
  }

  console.log();

  // Show results
  if (options.verbose || !result.success) {
    for (const test of result.results) {
      const icon = test.success ? chalk.green('✓') : chalk.red('✗');
      const duration = chalk.gray(`(${test.duration}ms)`);
      console.log(`  ${icon} ${test.name} ${duration}`);

      if (!test.success && test.error) {
        console.log(chalk.red(`    Error: ${test.error}`));
      }

      if (test.assertions && options.verbose) {
        console.log(
          chalk.gray(`    Assertions: ${test.assertions.passed}/${test.assertions.details.length}`)
        );
      }
    }
    console.log();
  }

  // Show summary
  console.log(chalk.dim(`  Duration: ${result.duration}ms`));
  console.log();

  if (!result.success) {
    process.exit(1);
  }
}

/**
 * Quick verification of a single URL
 */
async function runQuickVerify(url: string, options: VerifyOptions): Promise<void> {
  const spinner = ora(`Verifying ${url}...`).start();

  const playwrightOptions: PlaywrightOptions = {
    baseUrl: options.baseUrl,
    browser: options.browser,
    headless: options.headless !== false,
    timeout: options.timeout,
  };

  try {
    const result = await verifyUrl(url, playwrightOptions);

    if (result.success) {
      spinner.succeed(`Page loaded successfully (${result.duration}ms)`);
      console.log();
      console.log(chalk.green('  ✓ URL is accessible'));
      console.log(chalk.green('  ✓ No JavaScript errors'));
    } else {
      spinner.fail('Verification failed');
      console.log();
      if (result.error) {
        console.log(chalk.red(`  Error: ${result.error}`));
      }
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Verification failed');
    console.log();
    console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }

  console.log();
}

export default verifyCommand;
