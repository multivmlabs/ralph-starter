/**
 * ralph-starter linear — Interactive Linear issues wizard
 *
 * Guides the user through selecting Linear issues to work on:
 * 1. Authenticate (Linear CLI or API key)
 * 2. Browse teams + issues or paste a URL
 * 3. Select an issue
 * 4. Delegate to run command
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { askBrowseOrUrl, askForUrl, ensureCredentials } from '../integrations/wizards/shared.js';
import { getSourceCredentials } from '../sources/config.js';
import { type RunCommandOptions, runCommand } from './run.js';

export type LinearWizardOptions = {
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
};

const LINEAR_API_URL = 'https://api.linear.app/graphql';

type LinearTeam = {
  id: string;
  name: string;
  key: string;
};

type LinearProject = {
  id: string;
  name: string;
  state: string;
};

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priorityLabel: string | null;
  state: { name: string } | null;
};

/** Check if Linear CLI is available and authenticated */
async function isLinearCliAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    const result = await execa('linear', ['whoami'], { reject: false });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/** Get the Linear API key from CLI or config */
async function getLinearApiKey(): Promise<string | null> {
  // Try CLI first
  try {
    const { execa } = await import('execa');
    const result = await execa('linear', ['config', 'get', 'apiKey'], { reject: false });
    if (result.exitCode === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  } catch {
    // CLI not available
  }

  // Try environment variable
  if (process.env.LINEAR_API_KEY) {
    return process.env.LINEAR_API_KEY;
  }

  // Try config file
  const creds = getSourceCredentials('linear');
  return creds?.apiKey || creds?.token || null;
}

/** Execute a Linear GraphQL query */
async function linearQuery(
  apiKey: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Linear API key. Run: ralph-starter config set linear.apiKey <key>');
    }
    throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    data: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  };

  if (data.errors) {
    throw new Error(`Linear API error: ${data.errors[0].message}`);
  }

  return data.data;
}

/** Fetch all teams in the workspace */
async function fetchTeams(apiKey: string): Promise<LinearTeam[]> {
  const data = await linearQuery(
    apiKey,
    `
    query GetTeams {
      teams { nodes { id name key } }
    }
  `
  );
  return (data.teams as { nodes: LinearTeam[] }).nodes;
}

/** Fetch active projects for a team */
async function fetchProjects(apiKey: string, teamId: string): Promise<LinearProject[]> {
  const data = await linearQuery(
    apiKey,
    `
    query GetProjects($teamId: String!) {
      team(id: $teamId) {
        projects { nodes { id name state } }
      }
    }
  `,
    { teamId }
  );
  const projects = (data.team as { projects: { nodes: LinearProject[] } }).projects.nodes;
  // Filter to active projects (not completed/canceled)
  return projects.filter(
    (p) => !['completed', 'canceled'].includes(p.state?.toLowerCase?.() ?? '')
  );
}

/** Fetch non-completed issues for a team, optionally filtered by project */
async function fetchIssues(
  apiKey: string,
  teamKey: string,
  projectId?: string,
  limit = 30
): Promise<LinearIssue[]> {
  const filter: Record<string, unknown> = {
    team: { key: { eq: teamKey } },
    completedAt: { null: true },
  };

  if (projectId) {
    filter.project = { id: { eq: projectId } };
  }

  const data = await linearQuery(
    apiKey,
    `
    query GetIssues($filter: IssueFilter, $first: Int) {
      issues(filter: $filter, first: $first, orderBy: updatedAt) {
        nodes {
          id
          identifier
          title
          url
          priorityLabel
          state { name }
        }
      }
    }
  `,
    { filter, first: limit }
  );

  return (data.issues as { nodes: LinearIssue[] }).nodes;
}

/** Parse a Linear URL into an issue identifier (e.g., TEAM-123) */
function parseLinearUrl(url: string): { identifier: string } | null {
  // Match: https://linear.app/workspace/issue/TEAM-123 or linear.app/issue/TEAM-123
  const issueMatch = url.match(/^https?:\/\/linear\.app\/[^/]*\/issue\/([A-Z]+-\d+)/i);
  if (issueMatch) {
    return { identifier: issueMatch[1].toUpperCase() };
  }

  // Match: https://linear.app/TEAM-123 (short URL)
  const shortMatch = url.match(/^https?:\/\/linear\.app\/([A-Z]+-\d+)/i);
  if (shortMatch) {
    return { identifier: shortMatch[1].toUpperCase() };
  }

  return null;
}

/** Priority badge for display */
function priorityBadge(label: string | null): string {
  if (!label) return '';
  const badges: Record<string, string> = {
    Urgent: chalk.red('[!!!]'),
    High: chalk.yellow('[!!]'),
    Medium: chalk.blue('[!]'),
    Low: chalk.dim('[·]'),
  };
  return badges[label] || '';
}

export async function linearCommand(options: LinearWizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('  Linear Issues'));
  console.log(chalk.dim('  Build from Linear issues interactively'));
  console.log();

  // Step 1: Ensure credentials
  const credResult = await ensureCredentials('linear', 'Linear', {
    credKey: 'apiKey',
    consoleUrl: 'https://linear.app/settings/api',
    envVar: 'LINEAR_API_KEY',
    checkCliAuth: isLinearCliAvailable,
  });

  // Get the actual API key for GraphQL calls
  let apiKey: string | null;
  if (credResult === '__cli_auth__') {
    apiKey = await getLinearApiKey();
  } else {
    apiKey = credResult;
  }

  if (!apiKey) {
    console.log(chalk.red('  Could not obtain Linear API key.'));
    console.log(chalk.dim('  Run: ralph-starter config set linear.apiKey <key>'));
    return;
  }

  // Step 2: Browse or URL?
  const mode = await askBrowseOrUrl('Linear');

  if (mode === 'url') {
    const url = await askForUrl('Linear', /^https?:\/\/linear\.app\//);
    const parsed = parseLinearUrl(url);
    if (!parsed) {
      console.log(
        chalk.red('  Could not parse Linear URL. Expected format: linear.app/.../issue/TEAM-123')
      );
      return;
    }

    // Extract team key from identifier (e.g., "ENG" from "ENG-123")
    const teamKey = parsed.identifier.split('-')[0];

    const runOpts: RunCommandOptions = {
      from: 'linear',
      project: teamKey,
      auto: true,
      commit: options.commit ?? false,
      push: options.push,
      pr: options.pr,
      validate: options.validate ?? true,
      maxIterations: options.maxIterations,
      agent: options.agent,
    };

    // Pass the identifier as the task so the source can find the specific issue
    await runCommand(parsed.identifier, runOpts);
    return;
  }

  // Browse mode
  // Step 3: Fetch and select a team
  console.log(chalk.dim('  Fetching your teams...'));
  let teams: LinearTeam[];
  try {
    teams = await fetchTeams(apiKey);
  } catch (err) {
    console.log(chalk.red('  Failed to fetch teams. Check your API key.'));
    console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
    return;
  }

  if (teams.length === 0) {
    console.log(chalk.yellow('  No teams found in your workspace.'));
    return;
  }

  let selectedTeam: LinearTeam;
  if (teams.length === 1) {
    selectedTeam = teams[0];
    console.log(chalk.dim(`  Team: ${selectedTeam.name} (${selectedTeam.key})`));
  } else {
    const { teamId } = await inquirer.prompt([
      {
        type: 'select',
        name: 'teamId',
        message: 'Select a team:',
        choices: teams.map((t) => ({
          name: `${t.name} ${chalk.dim(`(${t.key})`)}`,
          value: t.id,
        })),
      },
    ]);
    selectedTeam = teams.find((t) => t.id === teamId)!;
  }

  // Step 4: What to work on?
  const { workMode } = await inquirer.prompt([
    {
      type: 'select',
      name: 'workMode',
      message: 'What do you want to work on?',
      choices: [
        { name: 'Browse project issues', value: 'project' },
        { name: 'Browse all team issues', value: 'team' },
        { name: 'Enter a specific issue ID', value: 'specific' },
      ],
    },
  ]);

  if (workMode === 'specific') {
    const { issueId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'issueId',
        message: `Issue ID (e.g., ${selectedTeam.key}-123):`,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) return 'Please enter an issue ID';
          if (!/^[A-Z]+-\d+$/i.test(trimmed)) {
            return `Expected format: ${selectedTeam.key}-123`;
          }
          return true;
        },
      },
    ]);

    const identifier = issueId.trim().toUpperCase();
    const teamKey = identifier.split('-')[0];

    const runOpts: RunCommandOptions = {
      from: 'linear',
      project: teamKey,
      auto: true,
      commit: options.commit ?? false,
      push: options.push,
      pr: options.pr,
      validate: options.validate ?? true,
      maxIterations: options.maxIterations,
      agent: options.agent,
    };

    await runCommand(identifier, runOpts);
    return;
  }

  // Fetch issues — either from a specific project or all team issues
  let projectId: string | undefined;

  if (workMode === 'project') {
    // Step 4a: Select a project
    console.log(chalk.dim('  Fetching projects...'));
    let projects: LinearProject[];
    try {
      projects = await fetchProjects(apiKey, selectedTeam.id);
    } catch (err) {
      console.log(chalk.red('  Failed to fetch projects.'));
      console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    if (projects.length === 0) {
      console.log(chalk.yellow('  No active projects found. Showing all team issues instead.'));
    } else {
      const { selectedProjectId } = await inquirer.prompt([
        {
          type: 'select',
          name: 'selectedProjectId',
          message: 'Select a project:',
          choices: projects.map((p) => ({
            name: p.name,
            value: p.id,
          })),
        },
      ]);
      projectId = selectedProjectId;
    }
  }

  // Step 5: Fetch and select issues
  console.log(chalk.dim(`  Fetching issues for ${selectedTeam.name}...`));
  let issues: LinearIssue[];
  try {
    issues = await fetchIssues(apiKey, selectedTeam.key, projectId);
  } catch (err) {
    console.log(chalk.red('  Failed to fetch issues.'));
    console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
    return;
  }

  if (issues.length === 0) {
    console.log(chalk.yellow('  No open issues found.'));
    return;
  }

  const { selectedIssue } = await inquirer.prompt([
    {
      type: 'select',
      name: 'selectedIssue',
      message: 'Select an issue:',
      choices: issues.map((issue) => {
        const badge = priorityBadge(issue.priorityLabel);
        const status = issue.state ? chalk.dim(` (${issue.state.name})`) : '';
        return {
          name: `${issue.identifier} — ${issue.title}${status} ${badge}`,
          value: issue.identifier,
        };
      }),
    },
  ]);

  // Step 6: Run for the selected issue
  console.log();
  console.log(chalk.green(`  Starting build for ${selectedIssue}...`));
  console.log();

  const runOpts: RunCommandOptions = {
    from: 'linear',
    project: selectedTeam.key,
    auto: true,
    commit: options.commit ?? false,
    push: options.push,
    pr: options.pr,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    agent: options.agent,
  };

  await runCommand(selectedIssue, runOpts);
}
