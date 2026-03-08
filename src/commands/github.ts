/**
 * ralph-starter github — Interactive GitHub issues wizard
 *
 * Guides the user through selecting GitHub issues to work on:
 * 1. Authenticate (gh CLI or token)
 * 2. Browse repos + issues or paste a URL
 * 3. Select issues (multi-select)
 * 4. Delegate to run command
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { askBrowseOrUrl, askForUrl, ensureCredentials } from '../integrations/wizards/shared.js';
import { type RunCommandOptions, runCommand } from './run.js';

export interface GitHubWizardOptions {
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
}

interface GitHubRepo {
  name: string;
  owner: { login: string };
  description: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  labels: Array<{ name: string }>;
}

interface GitHubLabel {
  name: string;
}

/** Check if gh CLI is available and authenticated */
async function isGhCliAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('gh', ['auth', 'status']);
    return true;
  } catch {
    return false;
  }
}

/** Fetch user's repos via gh CLI */
async function fetchReposViaCli(limit = 30): Promise<GitHubRepo[]> {
  const { execa } = await import('execa');
  const result = await execa('gh', [
    'repo',
    'list',
    '--json',
    'name,owner,description',
    '--limit',
    String(limit),
    '--sort',
    'updated',
  ]);
  return JSON.parse(result.stdout);
}

/** Fetch open issues for a repo via gh CLI */
async function fetchIssuesViaCli(
  owner: string,
  repo: string,
  label?: string,
  limit = 30
): Promise<GitHubIssue[]> {
  const { execa } = await import('execa');
  const args = [
    'issue',
    'list',
    '-R',
    `${owner}/${repo}`,
    '--json',
    'number,title,labels',
    '--limit',
    String(limit),
    '--state',
    'open',
  ];
  if (label) {
    args.push('--label', label);
  }
  const result = await execa('gh', args);
  return JSON.parse(result.stdout);
}

/** Fetch labels for a repo via gh CLI */
async function fetchLabelsViaCli(owner: string, repo: string): Promise<GitHubLabel[]> {
  const { execa } = await import('execa');
  const result = await execa('gh', [
    'label',
    'list',
    '-R',
    `${owner}/${repo}`,
    '--json',
    'name',
    '--limit',
    '50',
  ]);
  return JSON.parse(result.stdout);
}

/** Parse a GitHub URL into owner/repo and optional issue number */
function parseGitHubUrl(url: string): { owner: string; repo: string; issue?: number } | null {
  // Match: github.com/owner/repo/issues/123
  const issueMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (issueMatch) {
    return {
      owner: issueMatch[1],
      repo: issueMatch[2].replace(/\.git$/, ''),
      issue: parseInt(issueMatch[3], 10),
    };
  }

  // Match: github.com/owner/repo
  const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (repoMatch) {
    return {
      owner: repoMatch[1],
      repo: repoMatch[2].replace(/\.git$/, '').replace(/\/$/, ''),
    };
  }

  return null;
}

export async function githubCommand(options: GitHubWizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('  GitHub Issues'));
  console.log(chalk.dim('  Build from GitHub issues interactively'));
  console.log();

  // Step 1: Ensure credentials
  await ensureCredentials('github', 'GitHub', {
    credKey: 'token',
    consoleUrl: 'https://github.com/settings/tokens',
    envVar: 'GITHUB_TOKEN',
    checkCliAuth: isGhCliAvailable,
  });

  // Step 2: Browse or URL?
  const mode = await askBrowseOrUrl('GitHub');

  if (mode === 'url') {
    const url = await askForUrl('GitHub', /github\.com/);
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      console.log(
        chalk.red('  Could not parse GitHub URL. Expected format: github.com/owner/repo')
      );
      return;
    }

    const runOpts: RunCommandOptions = {
      from: 'github',
      project: `${parsed.owner}/${parsed.repo}`,
      issue: parsed.issue,
      auto: true,
      commit: options.commit ?? false,
      push: options.push,
      pr: options.pr,
      validate: options.validate ?? true,
      maxIterations: options.maxIterations,
      agent: options.agent,
    };

    await runCommand(undefined, runOpts);
    return;
  }

  // Browse mode
  // Step 3: Fetch and select repository
  console.log(chalk.dim('  Fetching your repositories...'));
  let repos: GitHubRepo[];
  try {
    repos = await fetchReposViaCli();
  } catch (err) {
    console.log(chalk.red('  Failed to fetch repositories. Check your authentication.'));
    console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
    return;
  }

  if (repos.length === 0) {
    console.log(chalk.yellow('  No repositories found.'));
    return;
  }

  const { selectedRepo } = await inquirer.prompt([
    {
      type: 'select',
      name: 'selectedRepo',
      message: 'Select a repository:',
      choices: repos.map((r) => ({
        name: `${r.owner.login}/${r.name}${r.description ? chalk.dim(` — ${r.description.slice(0, 60)}`) : ''}`,
        value: `${r.owner.login}/${r.name}`,
      })),
    },
  ]);

  const [owner, repo] = selectedRepo.split('/');

  // Step 4: Optional label filter
  let selectedLabel: string | undefined;
  try {
    const labels = await fetchLabelsViaCli(owner, repo);
    if (labels.length > 0) {
      const { labelChoice } = await inquirer.prompt([
        {
          type: 'select',
          name: 'labelChoice',
          message: 'Filter by label?',
          choices: [
            { name: 'All issues (no filter)', value: '__none__' },
            ...labels.map((l) => ({ name: l.name, value: l.name })),
          ],
        },
      ]);
      if (labelChoice !== '__none__') {
        selectedLabel = labelChoice;
      }
    }
  } catch {
    // Labels fetch failed, skip filter
  }

  // Step 5: Fetch and select issues
  console.log(chalk.dim(`  Fetching open issues for ${owner}/${repo}...`));
  let issues: GitHubIssue[];
  try {
    issues = await fetchIssuesViaCli(owner, repo, selectedLabel);
  } catch (err) {
    console.log(chalk.red('  Failed to fetch issues.'));
    console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
    return;
  }

  if (issues.length === 0) {
    console.log(
      chalk.yellow(
        `  No open issues found${selectedLabel ? ` with label "${selectedLabel}"` : ''}.`
      )
    );
    return;
  }

  const { selectedIssues } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIssues',
      message: 'Select issues to work on:',
      choices: issues.map((issue) => {
        const labelTags =
          issue.labels.length > 0
            ? ` ${chalk.dim(`[${issue.labels.map((l) => l.name).join(', ')}]`)}`
            : '';
        return {
          name: `#${issue.number} — ${issue.title}${labelTags}`,
          value: issue.number,
        };
      }),
      validate: (input: number[]) => (input.length > 0 ? true : 'Please select at least one issue'),
    },
  ]);

  // Step 6: Run for each selected issue
  console.log();
  console.log(
    chalk.green(
      `  Starting build for ${selectedIssues.length} issue${selectedIssues.length > 1 ? 's' : ''}...`
    )
  );
  console.log();

  for (const issueNumber of selectedIssues) {
    const runOpts: RunCommandOptions = {
      from: 'github',
      project: `${owner}/${repo}`,
      issue: issueNumber,
      label: selectedLabel,
      auto: true,
      commit: options.commit ?? false,
      push: options.push,
      pr: options.pr,
      validate: options.validate ?? true,
      maxIterations: options.maxIterations,
      agent: options.agent,
    };

    await runCommand(undefined, runOpts);
  }
}
