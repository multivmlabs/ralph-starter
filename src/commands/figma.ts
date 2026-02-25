/**
 * ralph-starter figma — Interactive Figma-to-code wizard
 *
 * Guides the user through 4 steps:
 * 1. Figma design URL
 * 2. Task description
 * 3. Tech stack selection (auto-detect + list + custom)
 * 4. Model selection (smart per-agent dropdown)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { isFigmaUrl } from '../integrations/figma/utils/url-parser.js';
import { detectAvailableAgents } from '../loop/agents.js';
import { showWelcome } from '../wizard/ui.js';
import { type RunCommandOptions, runCommand } from './run.js';

interface FigmaWizardOptions {
  mode?: string;
  framework?: string;
  commit?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
}

/** Detect the frontend framework from the current project's package.json */
function detectProjectStack(): string | null {
  const pkgPath = join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (allDeps.next) return 'Next.js + TypeScript + Tailwind CSS';
    if (allDeps.astro) return 'Astro';
    if (allDeps.nuxt) return 'Nuxt + Vue + TypeScript';
    if (allDeps.svelte || allDeps['@sveltejs/kit']) return 'SvelteKit';
    if (allDeps.vue) return 'Vue + TypeScript';
    if (allDeps.react) {
      const hasTailwind = !!allDeps.tailwindcss;
      return hasTailwind ? 'React + TypeScript + Tailwind CSS' : 'React + TypeScript';
    }
    return null;
  } catch {
    return null;
  }
}

/** Map tech stack choice to figma-framework option */
function stackToFramework(stack: string): RunCommandOptions['figmaFramework'] | undefined {
  const lower = stack.toLowerCase();
  if (lower.includes('next')) return 'nextjs';
  if (lower.includes('nuxt')) return 'nuxt';
  if (lower.includes('svelte')) return 'svelte';
  if (lower.includes('astro')) return 'astro';
  if (lower.includes('vue')) return 'vue';
  if (lower.includes('react')) return 'react';
  if (lower.includes('html') || lower.includes('vanilla')) return 'html';
  return undefined;
}

/** Build model choices based on detected agents */
async function buildModelChoices(): Promise<Array<{ name: string; value: string; short: string }>> {
  const agents = await detectAvailableAgents();
  const hasClaude = agents.some((a) => a.type === 'claude-code' && a.available);
  const hasCodex = agents.some((a) => a.type === 'codex' && a.available);

  const choices: Array<{ name: string; value: string; short: string }> = [];

  if (hasClaude) {
    choices.push(
      {
        name: 'Claude Opus 4.6 (maximum quality) (Recommended)',
        value: 'claude-opus-4-6',
        short: 'Opus 4.6',
      },
      {
        name: 'Claude Sonnet 4.5 (fast + cost-effective)',
        value: 'claude-sonnet-4-5-20250929',
        short: 'Sonnet 4.5',
      }
    );
  }

  if (hasCodex) {
    choices.push(
      { name: 'o3 (OpenAI)', value: 'o3', short: 'o3' },
      { name: 'o4-mini (OpenAI)', value: 'o4-mini', short: 'o4-mini' }
    );
  }

  // Fallback if no agent detected — still show common models
  if (choices.length === 0) {
    choices.push(
      {
        name: 'Claude Opus 4.6 (Recommended)',
        value: 'claude-opus-4-6',
        short: 'Opus 4.6',
      },
      {
        name: 'Claude Sonnet 4.5',
        value: 'claude-sonnet-4-5-20250929',
        short: 'Sonnet 4.5',
      }
    );
  }

  choices.push({
    name: 'Custom model ID',
    value: 'custom',
    short: 'Custom',
  });

  return choices;
}

export async function figmaCommand(options: FigmaWizardOptions): Promise<void> {
  showWelcome();

  console.log(chalk.cyan.bold('  Figma to Code'));
  console.log(chalk.dim('  Design to code in one command'));
  console.log();

  // Step 1: Figma URL
  const { figmaUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'figmaUrl',
      message: 'Figma design URL:',
      suffix: chalk.dim('\n  (paste the full Figma file or frame URL)\n  '),
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Please provide a Figma URL';
        if (!isFigmaUrl(trimmed) && !/^[a-zA-Z0-9]{22,}$/.test(trimmed)) {
          return 'Please provide a valid Figma URL (e.g., https://figma.com/design/ABC123/Name)';
        }
        return true;
      },
    },
  ]);

  // Step 2: Task description
  const { task } = await inquirer.prompt([
    {
      type: 'input',
      name: 'task',
      message: 'What would you like to build?',
      suffix: chalk.dim(
        '\n  (e.g., "build a responsive landing page", "implement the dashboard UI")\n  '
      ),
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Please describe what you want to build',
    },
  ]);

  // Step 3: Tech stack (auto-detect + list + custom)
  const detectedStack = detectProjectStack();
  const stackChoices: Array<{ name: string; value: string }> = [];

  if (detectedStack) {
    stackChoices.push({
      name: `${detectedStack} (Detected)`,
      value: detectedStack,
    });
  }

  const defaultStacks = [
    'React + TypeScript + Tailwind CSS',
    'Next.js + TypeScript + Tailwind CSS',
    'Vue + TypeScript',
    'SvelteKit',
    'HTML + CSS',
  ];

  for (const stack of defaultStacks) {
    // Skip if already added as detected
    if (detectedStack && stack === detectedStack) continue;
    stackChoices.push({ name: stack, value: stack });
  }

  stackChoices.push({
    name: 'Custom (type your own stack)',
    value: 'custom',
  });

  const { stackChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stackChoice',
      message: 'Tech stack?',
      choices: stackChoices,
      default: detectedStack || 'React + TypeScript + Tailwind CSS',
    },
  ]);

  let techStack = stackChoice;
  if (stackChoice === 'custom') {
    const { customStack } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customStack',
        message: 'Tech stack:',
        suffix: chalk.dim('\n  (e.g., "astro.js + vue", "svelte + tailwind + drizzle")\n  '),
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Please describe your tech stack',
      },
    ]);
    techStack = customStack.trim();
  }

  // Step 4: Model selection (smart per-agent)
  const modelChoices = await buildModelChoices();

  const { modelChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'modelChoice',
      message: 'Which model?',
      choices: modelChoices,
    },
  ]);

  let model = modelChoice;
  if (modelChoice === 'custom') {
    const { customModel } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customModel',
        message: 'Model ID:',
        suffix: chalk.dim('\n  (e.g., claude-opus-4-6, claude-sonnet-4-5-20250929)\n  '),
        validate: (input: string) => (input.trim().length > 0 ? true : 'Please enter a model ID'),
      },
    ]);
    model = customModel.trim();
  }

  console.log();

  // Build task with tech stack context
  const fullTask = `Using ${techStack}: ${task.trim()}`;

  // Delegate to run command with Figma options pre-configured
  const runOptions: RunCommandOptions = {
    from: 'figma',
    project: figmaUrl.trim(),
    figmaMode: (options.mode as RunCommandOptions['figmaMode']) || 'spec',
    figmaFramework: options.framework
      ? (options.framework as RunCommandOptions['figmaFramework'])
      : stackToFramework(techStack),
    model,
    auto: true,
    commit: options.commit ?? false,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    agent: options.agent,
  };

  await runCommand(fullTask, runOptions);
}
