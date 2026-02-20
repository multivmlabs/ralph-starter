/**
 * Task Command
 *
 * Unified task management across GitHub and Linear.
 * Issues stay where they are — ralph-starter detects the platform
 * from the ID format and routes operations accordingly.
 */

import chalk from 'chalk';

import {
  type IntegrationOptions,
  isWritableIntegration,
  type TaskReference,
  type WritableIntegration,
} from '../integrations/base.js';

type TaskSource = 'github' | 'linear' | 'all';

interface TaskCommandOptions {
  source?: TaskSource;
  project?: string;
  label?: string;
  status?: string;
  limit?: string;
  title?: string;
  body?: string;
  priority?: string;
  comment?: string;
  assignee?: string;
}

/**
 * Detect source from task identifier format:
 * - "#123" or bare number → GitHub
 * - "RAL-42" (TEAM-number) → Linear
 */
function detectSource(id: string): TaskSource {
  // Bare number or #number → GitHub
  if (/^#?\d+$/.test(id)) return 'github';
  // TEAM-number pattern → Linear
  if (/^[A-Z]+-\d+$/i.test(id)) return 'linear';
  // UUID-like → Linear
  if (id.includes('-') && id.length > 10) return 'linear';
  return 'all';
}

/**
 * Normalize a task ID (strip # prefix for GitHub)
 */
function normalizeId(id: string): string {
  return id.replace(/^#/, '');
}

/**
 * Get writable integrations for the requested source(s)
 */
async function getIntegrations(source: TaskSource): Promise<WritableIntegration[]> {
  const integrations: WritableIntegration[] = [];

  if (source === 'github' || source === 'all') {
    const { GitHubIntegration } = await import('../integrations/github/source.js');
    const gh = new GitHubIntegration();
    if (isWritableIntegration(gh) && (await gh.isAvailable())) {
      integrations.push(gh);
    }
  }

  if (source === 'linear' || source === 'all') {
    const { LinearIntegration } = await import('../integrations/linear/source.js');
    const linear = new LinearIntegration();
    if (isWritableIntegration(linear) && (await linear.isAvailable())) {
      integrations.push(linear);
    }
  }

  return integrations;
}

/**
 * Map priority string (P0-P3) to number (1-4)
 */
function parsePriority(p?: string): number | undefined {
  if (!p) return undefined;
  const map: Record<string, number> = { P0: 1, P1: 2, P2: 3, P3: 4 };
  return map[p.toUpperCase()];
}

/**
 * Map priority number to display string
 */
function priorityLabel(p?: number): string {
  if (!p) return '';
  const map: Record<number, string> = { 1: 'P0', 2: 'P1', 3: 'P2', 4: 'P3' };
  return map[p] || '';
}

/**
 * Print tasks as a table
 */
function printTaskTable(tasks: TaskReference[]): void {
  if (tasks.length === 0) {
    console.log(chalk.yellow('\n  No tasks found.\n'));
    return;
  }

  console.log();
  const header = `  ${'ID'.padEnd(14)} ${'Source'.padEnd(8)} ${'Status'.padEnd(14)} ${'Priority'.padEnd(8)} Title`;
  console.log(chalk.bold(header));
  console.log(chalk.dim(`  ${'─'.repeat(80)}`));

  for (const task of tasks) {
    const sourceColor = task.source === 'github' ? chalk.cyan : chalk.magenta;
    const line = `  ${task.identifier.padEnd(14)} ${sourceColor(task.source.padEnd(8))} ${task.status.padEnd(14)} ${priorityLabel(task.priority).padEnd(8)} ${task.title}`;
    console.log(line);
  }

  console.log(chalk.dim(`\n  ${tasks.length} task(s) total\n`));
}

// ============================================
// Command handlers
// ============================================

async function handleList(options: TaskCommandOptions): Promise<void> {
  const source: TaskSource = options.source || 'all';
  const integrations = await getIntegrations(source);

  if (integrations.length === 0) {
    console.log(chalk.red('\n  No integrations available. Configure GitHub or Linear first.\n'));
    console.log('  Run: ralph-starter auth github');
    console.log('  Run: ralph-starter config set linear.apiKey <key>\n');
    return;
  }

  const allTasks: TaskReference[] = [];
  const intOpts: IntegrationOptions = {
    project: options.project,
    label: options.label,
    status: options.status,
    limit: options.limit ? parseInt(options.limit, 10) : 50,
  };

  for (const integration of integrations) {
    try {
      const tasks = await integration.listTasks(intOpts);
      allTasks.push(...tasks);
    } catch (err) {
      console.log(
        chalk.yellow(
          `  Warning: Could not fetch from ${integration.name}: ${(err as Error).message}`
        )
      );
    }
  }

  // Sort by priority (lower = higher priority), then by source
  allTasks.sort((a, b) => (a.priority || 99) - (b.priority || 99));

  printTaskTable(allTasks);
}

async function handleCreate(options: TaskCommandOptions): Promise<void> {
  if (!options.title) {
    console.log(chalk.red('\n  --title is required for creating a task.\n'));
    return;
  }

  const source: TaskSource = options.source || 'github';
  if (source === 'all') {
    console.log(chalk.red('\n  Specify --source github or --source linear for creating tasks.\n'));
    return;
  }

  const integrations = await getIntegrations(source);
  if (integrations.length === 0) {
    console.log(chalk.red(`\n  ${source} integration not available. Configure it first.\n`));
    return;
  }

  const integration = integrations[0];
  const task = await integration.createTask(
    {
      title: options.title,
      description: options.body,
      labels: options.label ? options.label.split(',') : undefined,
      priority: parsePriority(options.priority),
      assignee: options.assignee,
      project: options.project,
    },
    { project: options.project }
  );

  console.log(chalk.green(`\n  Created: ${task.identifier} — ${task.title}`));
  console.log(chalk.dim(`  ${task.url}\n`));
}

async function handleUpdate(id: string, options: TaskCommandOptions): Promise<void> {
  const source = options.source || detectSource(id);
  if (source === 'all') {
    console.log(
      chalk.red('\n  Could not detect source from ID. Use --source github or --source linear.\n')
    );
    return;
  }

  const integrations = await getIntegrations(source as TaskSource);
  if (integrations.length === 0) {
    console.log(chalk.red(`\n  ${source} integration not available.\n`));
    return;
  }

  const integration = integrations[0];
  const task = await integration.updateTask(
    normalizeId(id),
    {
      status: options.status,
      comment: options.comment,
      priority: parsePriority(options.priority),
      assignee: options.assignee,
    },
    { project: options.project }
  );

  console.log(chalk.green(`\n  Updated: ${task.identifier} — ${task.status}`));
  console.log(chalk.dim(`  ${task.url}\n`));
}

async function handleClose(id: string, options: TaskCommandOptions): Promise<void> {
  const source = options.source || detectSource(id);
  if (source === 'all') {
    console.log(
      chalk.red('\n  Could not detect source from ID. Use --source github or --source linear.\n')
    );
    return;
  }

  const integrations = await getIntegrations(source as TaskSource);
  if (integrations.length === 0) {
    console.log(chalk.red(`\n  ${source} integration not available.\n`));
    return;
  }

  const integration = integrations[0];
  await integration.closeTask(normalizeId(id), options.comment, { project: options.project });

  console.log(chalk.green(`\n  Closed: ${id}`));
  if (options.comment) {
    console.log(chalk.dim(`  Comment: ${options.comment}`));
  }
  console.log();
}

async function handleComment(
  id: string,
  message: string,
  options: TaskCommandOptions
): Promise<void> {
  const source = options.source || detectSource(id);
  if (source === 'all') {
    console.log(
      chalk.red('\n  Could not detect source from ID. Use --source github or --source linear.\n')
    );
    return;
  }

  const integrations = await getIntegrations(source as TaskSource);
  if (integrations.length === 0) {
    console.log(chalk.red(`\n  ${source} integration not available.\n`));
    return;
  }

  const integration = integrations[0];
  await integration.addComment(normalizeId(id), message, { project: options.project });

  console.log(chalk.green(`\n  Comment added to ${id}\n`));
}

/**
 * Main task command dispatcher
 */
export async function taskCommand(
  action: string | undefined,
  args: string[],
  options: TaskCommandOptions
): Promise<void> {
  try {
    switch (action) {
      case 'list':
      case 'ls':
        await handleList(options);
        break;

      case 'create':
      case 'new':
        await handleCreate(options);
        break;

      case 'update':
        if (!args[0]) {
          console.log(chalk.red('\n  Usage: ralph-starter task update <id> --status <status>\n'));
          return;
        }
        await handleUpdate(args[0], options);
        break;

      case 'close':
      case 'done':
        if (!args[0]) {
          console.log(chalk.red('\n  Usage: ralph-starter task close <id> [--comment "..."]\n'));
          return;
        }
        await handleClose(args[0], options);
        break;

      case 'comment':
        if (!args[0] || !args[1]) {
          console.log(chalk.red('\n  Usage: ralph-starter task comment <id> "message"\n'));
          return;
        }
        await handleComment(args[0], args.slice(1).join(' '), options);
        break;

      default:
        console.log(`
  ${chalk.bold('ralph-starter task')} — Manage tasks across GitHub and Linear

  ${chalk.bold('Usage:')}
    ralph-starter task list [--source github|linear] [--project <name>]
    ralph-starter task create --title "..." [--source github|linear] [--priority P0-P3]
    ralph-starter task update <id> --status <status>
    ralph-starter task close <id> [--comment "..."]
    ralph-starter task comment <id> "message"

  ${chalk.bold('ID Detection:')}
    #123 or 123    → GitHub issue
    RAL-42         → Linear issue (detected from TEAM-number format)

  ${chalk.bold('Options:')}
    --source       Filter by source: github, linear, or all (default: all)
    --project      Project filter (owner/repo for GitHub, team name for Linear)
    --label        Filter by label
    --status       Filter by status or set status on update
    --limit        Max tasks to fetch (default: 50)
    --title        Task title (for create)
    --body         Task description (for create)
    --priority     Priority: P0, P1, P2, P3 (for create/update)
    --assignee     Assign to team member (GitHub username or Linear display name)
    --comment      Comment text (for close/update)
`);
        break;
    }
  } catch (err) {
    console.log(chalk.red(`\n  Error: ${(err as Error).message}\n`));
  }
}
