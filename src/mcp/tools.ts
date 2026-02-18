import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import core functions (these will be created/extracted)
import { type InitCoreResult, initCore } from './core/init.js';
import { type PlanCoreResult, planCore } from './core/plan.js';
import { type RunCoreResult, runCore } from './core/run.js';

/**
 * Tool definitions for ralph-starter MCP server
 */

const toolSchemas = {
  ralph_init: z.object({
    path: z.string().describe('Project path to initialize'),
    name: z.string().optional().describe('Project name'),
  }),

  ralph_plan: z.object({
    path: z.string().describe('Project path'),
    auto: z.boolean().optional().describe('Run in automated mode'),
  }),

  ralph_run: z.object({
    path: z.string().describe('Project path'),
    task: z.string().optional().describe('Task to execute'),
    auto: z.boolean().optional().describe('Run in automated mode'),
    commit: z.boolean().optional().describe('Auto-commit changes'),
    validate: z.boolean().optional().describe('Run validation after changes'),
    from: z.string().optional().describe('Source to fetch spec from'),
    project: z.string().optional().describe('Project filter for source'),
    label: z.string().optional().describe('Label filter for source'),
  }),

  ralph_status: z.object({
    path: z.string().describe('Project path'),
  }),

  ralph_validate: z.object({
    path: z.string().describe('Project path'),
  }),

  ralph_list_presets: z.object({
    category: z
      .string()
      .optional()
      .describe('Filter by category (development, debugging, review, documentation, specialized)'),
  }),

  ralph_task: z.object({
    action: z.enum(['list', 'create', 'update', 'close', 'comment']).describe('Task action'),
    source: z
      .enum(['github', 'linear', 'all'])
      .optional()
      .describe('Source platform (default: all for list, required for create)'),
    project: z
      .string()
      .optional()
      .describe('Project filter (owner/repo for GitHub, team name for Linear)'),
    id: z
      .string()
      .optional()
      .describe('Task ID for update/close/comment (#123 for GitHub, RAL-42 for Linear)'),
    title: z.string().optional().describe('Task title (for create)'),
    description: z.string().optional().describe('Task description (for create)'),
    status: z.string().optional().describe('Status filter or new status (for list/update)'),
    comment: z.string().optional().describe('Comment text (for close/comment)'),
    labels: z.array(z.string()).optional().describe('Labels (for create)'),
    priority: z.string().optional().describe('Priority: P0, P1, P2, P3'),
    assignee: z
      .string()
      .optional()
      .describe('Assignee (GitHub username or Linear display name, for create/update)'),
    label: z.string().optional().describe('Label filter (for list)'),
    limit: z.number().optional().describe('Max tasks to fetch (default: 50)'),
  }),

  ralph_fetch_spec: z.object({
    path: z.string().min(1).describe('Project directory path'),
    source: z
      .enum(['github', 'linear', 'notion', 'figma'])
      .describe('Integration source to fetch from'),
    identifier: z
      .string()
      .describe(
        'Source identifier: GitHub repo/issue URL, Linear project name, Notion page URL, or Figma file URL'
      ),
    mode: z
      .string()
      .optional()
      .describe('Figma-specific mode: spec, tokens, components, content, assets'),
    project: z.string().optional().describe('Project or team filter (for Linear/GitHub)'),
    label: z.string().optional().describe('Label filter (for GitHub/Linear issues)'),
  }),
};

/**
 * Get all available tools
 */
export function getTools(): Tool[] {
  return [
    {
      name: 'ralph_init',
      description:
        'Initialize Ralph Playbook in a project directory. Creates the scaffolding files needed for autonomous coding: AGENTS.md (agent config), PROMPT_plan.md and PROMPT_build.md (workflow prompts), specs/ directory, and IMPLEMENTATION_PLAN.md. Auto-detects project type (Node.js, Python, Rust, Go) and configures validation commands.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the project directory to initialize',
          },
          name: {
            type: 'string',
            description: 'Project name (defaults to directory name)',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_plan',
      description:
        'Create an implementation plan from specification files. Analyzes the specs/ directory using an AI coding agent and generates a structured IMPLEMENTATION_PLAN.md with checkboxed tasks. The plan breaks down the spec into actionable development tasks.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project directory path containing specs/ folder',
          },
          auto: {
            type: 'boolean',
            description: 'Run in automated mode without interactive prompts',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_run',
      description:
        'Execute an autonomous AI coding loop that iterates until task completion. The agent reads specs, writes code, runs validation (tests/lint/build), and auto-commits. Supports Claude Code, Cursor, Codex, OpenCode, Copilot, Gemini CLI, Amp, and Openclaw agents. Can fetch tasks from GitHub issues, Linear tickets, Notion pages, or Figma designs. Use workflow presets (see ralph_list_presets) to configure behavior.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project directory path',
          },
          task: {
            type: 'string',
            description:
              'Task description to execute. Optional if using Ralph Playbook (reads from IMPLEMENTATION_PLAN.md)',
          },
          auto: {
            type: 'boolean',
            description: 'Run in automated mode — processes all tasks without interactive prompts',
          },
          commit: {
            type: 'boolean',
            description: 'Auto-commit changes after each completed task',
          },
          validate: {
            type: 'boolean',
            description: 'Run validation commands (tests, lint, build) after each iteration',
          },
          from: {
            type: 'string',
            description:
              'Source integration to fetch spec from: file, url, github, linear, notion, figma',
          },
          project: {
            type: 'string',
            description: 'Project/repo name filter for GitHub or Linear integrations',
          },
          label: {
            type: 'string',
            description: 'Label filter to select specific issues from GitHub or Linear',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_status',
      description:
        'Check Ralph Playbook status for a project. Returns available playbook files, implementation plan progress (completed/total tasks), and spec files. Useful for understanding where a project stands before continuing work.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project directory path to check',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_validate',
      description:
        'Run all detected validation commands (tests, linting, build) for a project. Auto-detects validation commands from package.json scripts, Makefile targets, and common patterns. Returns pass/fail status with output for each command.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project directory path to validate',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_list_presets',
      description:
        'List all available workflow presets for ralph-starter. Presets configure the coding loop behavior: iteration limits, validation, auto-commit, and specialized prompts. Categories include Development (feature, TDD, refactor), Debugging (debug, incident-response), Review (code review, PR review, adversarial), Documentation, and Specialized (API design, migration, performance).',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description:
              'Filter by category: development, debugging, review, documentation, specialized. Returns all if omitted.',
          },
        },
      },
    },
    {
      name: 'ralph_task',
      description:
        'Manage tasks across GitHub and Linear. List tasks from both platforms, create new issues, update status, close tasks, and add comments. Detects the platform from the task ID format: #123 for GitHub, RAL-42 for Linear.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Task action: list, create, update, close, comment',
            enum: ['list', 'create', 'update', 'close', 'comment'],
          },
          source: {
            type: 'string',
            description: 'Source platform: github, linear, or all (default: all for list)',
            enum: ['github', 'linear', 'all'],
          },
          project: {
            type: 'string',
            description: 'Project filter (owner/repo for GitHub, team name for Linear)',
          },
          id: {
            type: 'string',
            description: 'Task ID for update/close/comment (#123 for GitHub, RAL-42 for Linear)',
          },
          title: { type: 'string', description: 'Task title (for create)' },
          description: { type: 'string', description: 'Task description (for create)' },
          status: { type: 'string', description: 'Status filter or new status' },
          comment: { type: 'string', description: 'Comment text' },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Labels (for create)',
          },
          priority: { type: 'string', description: 'Priority: P0, P1, P2, P3' },
          assignee: {
            type: 'string',
            description: 'Assignee (GitHub username or Linear display name)',
          },
          label: { type: 'string', description: 'Label filter (for list)' },
          limit: { type: 'number', description: 'Max tasks (default: 50)' },
        },
        required: ['action'],
      },
    },
    {
      name: 'ralph_fetch_spec',
      description:
        'Fetch a specification from an external integration without running the coding loop. Returns the raw spec content as markdown. Supports GitHub (issues, PRs), Linear (tickets by project/team), Notion (pages, databases), and Figma (design specs, tokens, components, content, assets). Use this to preview what will be built before committing to a full run.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project directory path (used as working directory)',
          },
          source: {
            type: 'string',
            description: 'Integration source: github, linear, notion, or figma',
            enum: ['github', 'linear', 'notion', 'figma'],
          },
          identifier: {
            type: 'string',
            description:
              'Source identifier — GitHub: repo URL or "owner/repo#123", Linear: project name, Notion: page URL, Figma: file URL',
          },
          mode: {
            type: 'string',
            description:
              'Figma-specific extraction mode: spec (design specs), tokens (design tokens), components (component code), content (text extraction), assets (icons/images)',
          },
          project: {
            type: 'string',
            description: 'Project or team name filter (for Linear and GitHub)',
          },
          label: {
            type: 'string',
            description: 'Label filter for issue selection (for GitHub and Linear)',
          },
        },
        required: ['path', 'source', 'identifier'],
      },
    },
  ];
}

/**
 * Handle a tool call
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    switch (name) {
      case 'ralph_init':
        return await handleInit(args);

      case 'ralph_plan':
        return await handlePlan(args);

      case 'ralph_run':
        return await handleRun(args);

      case 'ralph_status':
        return await handleStatus(args);

      case 'ralph_validate':
        return await handleValidate(args);

      case 'ralph_list_presets':
        return await handleListPresets(args);

      case 'ralph_fetch_spec':
        return await handleFetchSpec(args);

      case 'ralph_task':
        return await handleTask(args);

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${(error as Error).message}`,
        },
      ],
    };
  }
}

async function handleInit(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_init.parse(args);

  const result = await initCore({
    path: parsed.path,
    name: parsed.name,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatInitResult(result),
      },
    ],
  };
}

async function handlePlan(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_plan.parse(args);

  const result = await planCore({
    path: parsed.path,
    auto: parsed.auto,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatPlanResult(result),
      },
    ],
  };
}

async function handleRun(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_run.parse(args);

  const result = await runCore({
    path: parsed.path,
    task: parsed.task,
    auto: parsed.auto,
    commit: parsed.commit,
    validate: parsed.validate,
    from: parsed.from,
    project: parsed.project,
    label: parsed.label,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatRunResult(result),
      },
    ],
  };
}

async function handleStatus(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_status.parse(args);
  const path = parsed.path;

  // Check for Ralph Playbook files
  const files = {
    'AGENTS.md': existsSync(join(path, 'AGENTS.md')),
    'PROMPT_plan.md': existsSync(join(path, 'PROMPT_plan.md')),
    'PROMPT_build.md': existsSync(join(path, 'PROMPT_build.md')),
    'IMPLEMENTATION_PLAN.md': existsSync(join(path, 'IMPLEMENTATION_PLAN.md')),
    'specs/': existsSync(join(path, 'specs')),
  };

  const hasPlaybook = files['AGENTS.md'] && files['IMPLEMENTATION_PLAN.md'];

  // Read implementation plan if exists
  let planProgress = '';
  if (files['IMPLEMENTATION_PLAN.md']) {
    const planContent = readFileSync(join(path, 'IMPLEMENTATION_PLAN.md'), 'utf-8');
    const completedTasks = (planContent.match(/- \[x\]/gi) || []).length;
    const totalTasks = (planContent.match(/- \[[ x]\]/gi) || []).length;
    planProgress = `${completedTasks}/${totalTasks} tasks completed`;
  }

  // List specs if directory exists
  let specs: string[] = [];
  if (files['specs/']) {
    specs = readdirSync(join(path, 'specs')).filter((f) => f.endsWith('.md'));
  }

  const status = {
    hasPlaybook,
    files,
    planProgress,
    specs,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(status, null, 2),
      },
    ],
  };
}

async function handleValidate(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_validate.parse(args);

  // Import validation functions
  const { detectValidationCommands, runAllValidations } = await import('../loop/validation.js');

  const commands = detectValidationCommands(parsed.path);
  const results = await runAllValidations(parsed.path, commands);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ commands, results }, null, 2),
      },
    ],
  };
}

async function handleListPresets(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_list_presets.parse(args ?? {});

  const { getPresetsByCategory } = await import('../presets/index.js');

  const allCategories = getPresetsByCategory();
  const filterCategory = parsed.category?.toLowerCase();

  const result: Record<
    string,
    Array<{
      name: string;
      description: string;
      maxIterations: number;
      validate: boolean;
      commit: boolean;
    }>
  > = {};

  for (const [category, presets] of Object.entries(allCategories)) {
    if (filterCategory && category.toLowerCase() !== filterCategory) {
      continue;
    }
    result[category] = presets.map((p) => ({
      name: p.name,
      description: p.description,
      maxIterations: p.maxIterations,
      validate: p.validate,
      commit: p.commit,
    }));
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleFetchSpec(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_fetch_spec.parse(args);

  const { fetchFromIntegration } = await import('../integrations/index.js');

  const options: Record<string, unknown> = { path: parsed.path };
  if (parsed.mode) options.mode = parsed.mode;
  if (parsed.project) options.project = parsed.project;
  if (parsed.label) options.label = parsed.label;

  const result = await fetchFromIntegration(parsed.source, parsed.identifier, options);

  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      },
    ],
  };
}

function formatInitResult(result: InitCoreResult): string {
  if (result.success) {
    return `Successfully initialized Ralph Playbook at ${result.path}\n\nFiles created:\n${result.filesCreated.map((f) => `- ${f}`).join('\n')}`;
  }
  return `Failed to initialize: ${result.error}`;
}

function formatPlanResult(result: PlanCoreResult): string {
  if (result.success) {
    return `Implementation plan created at ${result.planPath}\n\nTasks: ${result.taskCount}`;
  }
  return `Failed to create plan: ${result.error}`;
}

function formatRunResult(result: RunCoreResult): string {
  if (result.success) {
    let text = `Loop completed successfully!\n\nIterations: ${result.iterations}`;
    if (result.commits.length > 0) {
      text += `\nCommits: ${result.commits.length}`;
    }
    return text;
  }
  return `Loop failed: ${result.error}`;
}

async function handleTask(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_task.parse(args);

  const { isWritableIntegration } = await import('../integrations/base.js');

  // Helper to get integrations for a source
  async function getIntegrations(source: string) {
    const integrations = [];
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

  const priorityMap: Record<string, number> = { P0: 1, P1: 2, P2: 3, P3: 4 };

  switch (parsed.action) {
    case 'list': {
      const source = parsed.source || 'all';
      const integrations = await getIntegrations(source);
      const allTasks = [];
      for (const integration of integrations) {
        const tasks = await integration.listTasks({
          project: parsed.project,
          label: parsed.label,
          status: parsed.status,
          limit: parsed.limit || 50,
        });
        allTasks.push(...tasks);
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(allTasks, null, 2) }],
      };
    }

    case 'create': {
      if (!parsed.title) throw new Error('title is required for create');
      const source = parsed.source || 'github';
      if (source === 'all') throw new Error('Specify source (github or linear) for create');
      const integrations = await getIntegrations(source);
      if (integrations.length === 0) throw new Error(`${source} not available`);
      const task = await integrations[0].createTask(
        {
          title: parsed.title,
          description: parsed.description,
          labels: parsed.labels,
          priority: parsed.priority ? priorityMap[parsed.priority.toUpperCase()] : undefined,
          assignee: parsed.assignee,
          project: parsed.project,
        },
        { project: parsed.project }
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    }

    case 'update': {
      if (!parsed.id) throw new Error('id is required for update');
      const source = parsed.source || (/^#?\d+$/.test(parsed.id) ? 'github' : 'linear');
      const integrations = await getIntegrations(source);
      if (integrations.length === 0) throw new Error(`${source} not available`);
      const task = await integrations[0].updateTask(
        parsed.id.replace(/^#/, ''),
        {
          status: parsed.status,
          comment: parsed.comment,
          priority: parsed.priority ? priorityMap[parsed.priority.toUpperCase()] : undefined,
          assignee: parsed.assignee,
        },
        { project: parsed.project }
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    }

    case 'close': {
      if (!parsed.id) throw new Error('id is required for close');
      const source = parsed.source || (/^#?\d+$/.test(parsed.id) ? 'github' : 'linear');
      const integrations = await getIntegrations(source);
      if (integrations.length === 0) throw new Error(`${source} not available`);
      await integrations[0].closeTask(parsed.id.replace(/^#/, ''), parsed.comment, {
        project: parsed.project,
      });
      return {
        content: [{ type: 'text', text: `Closed ${parsed.id}` }],
      };
    }

    case 'comment': {
      if (!parsed.id || !parsed.comment) throw new Error('id and comment are required');
      const source = parsed.source || (/^#?\d+$/.test(parsed.id) ? 'github' : 'linear');
      const integrations = await getIntegrations(source);
      if (integrations.length === 0) throw new Error(`${source} not available`);
      await integrations[0].addComment(parsed.id.replace(/^#/, ''), parsed.comment, {
        project: parsed.project,
      });
      return {
        content: [{ type: 'text', text: `Comment added to ${parsed.id}` }],
      };
    }

    default:
      throw new Error(`Unknown task action: ${parsed.action}`);
  }
}
