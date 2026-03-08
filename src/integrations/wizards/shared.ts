/**
 * Shared wizard utilities for integration wizards (GitHub, Linear, Notion).
 *
 * Provides credential prompting, browse-or-URL selection, and URL input
 * that are reused across all integration wizards.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { getSourceCredentials, setSourceCredential } from '../../sources/config.js';

export type CredentialOptions = {
  /** The key name in the credentials store (e.g., 'token', 'apiKey') */
  credKey: string;
  /** URL where the user can create/find their credential */
  consoleUrl: string;
  /** Environment variable name (e.g., 'GITHUB_TOKEN') */
  envVar: string;
  /** Optional: check CLI auth before prompting (returns true if authenticated) */
  checkCliAuth?: () => Promise<boolean>;
};

/**
 * Ensure credentials exist for a source. If missing, prompt the user to enter them.
 * Returns the credential value.
 */
export async function ensureCredentials(
  sourceName: string,
  displayName: string,
  opts: CredentialOptions
): Promise<string> {
  // Check CLI auth first (e.g., gh auth status)
  if (opts.checkCliAuth) {
    try {
      const cliAuthed = await opts.checkCliAuth();
      if (cliAuthed) return '__cli_auth__';
    } catch {
      // CLI not available, fall through to token check
    }
  }

  // Check existing credentials (env var or config file)
  const existing = getSourceCredentials(sourceName);
  const existingValue = existing?.[opts.credKey] || existing?.token || existing?.apiKey;
  if (existingValue) return existingValue;

  // No credentials found — prompt user
  console.log();
  console.log(chalk.yellow(`  No ${displayName} credentials found.`));
  console.log(chalk.dim(`  Get your token/key at: ${opts.consoleUrl}`));
  console.log(chalk.dim(`  Or set env var: export ${opts.envVar}=<your-key>`));
  console.log();

  const { credential } = await inquirer.prompt([
    {
      type: 'password',
      name: 'credential',
      message: `${displayName} API key/token:`,
      mask: '*',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Please enter your API key or token',
    },
  ]);

  const trimmed = credential.trim();
  setSourceCredential(sourceName, opts.credKey, trimmed);
  console.log(chalk.green(`  Saved to ~/.ralph-starter/sources.json`));
  console.log();

  return trimmed;
}

/**
 * Ask the user whether they want to browse interactively or paste a URL.
 */
export async function askBrowseOrUrl(displayName: string): Promise<'browse' | 'url'> {
  const { choice } = await inquirer.prompt([
    {
      type: 'select',
      name: 'choice',
      message: `How do you want to select from ${displayName}?`,
      choices: [
        { name: `Browse my ${displayName} interactively`, value: 'browse' },
        { name: 'Paste a URL', value: 'url' },
      ],
    },
  ]);

  return choice;
}

/**
 * Prompt the user to paste a URL, with domain validation.
 */
export async function askForUrl(displayName: string, domainPattern: RegExp): Promise<string> {
  const { url } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: `${displayName} URL:`,
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Please enter a URL';
        if (!domainPattern.test(trimmed)) {
          return `Please enter a valid ${displayName} URL`;
        }
        return true;
      },
    },
  ]);

  return url.trim();
}
