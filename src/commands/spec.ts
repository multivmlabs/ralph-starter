/**
 * Spec Command - 5-Phase Specification Generation
 *
 * Generates comprehensive specifications through 5 phases:
 * 1. Research - Feasibility analysis
 * 2. Requirements - User stories
 * 3. Design - Architecture
 * 4. Tasks - Implementation breakdown
 * 5. Review - Final validation (optional)
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { type Agent, detectBestAgent, runAgent } from '../loop/agents.js';
import { detectStepFromOutput } from '../loop/step-detector.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';

export interface SpecCommandOptions {
  /** Run in automated mode (skip permissions) */
  auto?: boolean;
  /** Idea or feature description */
  idea?: string;
  /** Skip research phase */
  skipResearch?: boolean;
  /** Skip requirements phase */
  skipRequirements?: boolean;
  /** Skip design phase */
  skipDesign?: boolean;
  /** Skip tasks phase */
  skipTasks?: boolean;
  /** Output directory for specs */
  outputDir?: string;
  /** Verbose output */
  verbose?: boolean;
}

interface PhaseResult {
  success: boolean;
  output: string;
  filePath?: string;
}

/**
 * Phase 1: Research Phase - Feasibility Analysis
 */
async function runResearchPhase(
  agent: Agent,
  idea: string,
  cwd: string,
  specsDir: string,
  options: SpecCommandOptions
): Promise<PhaseResult> {
  const progress = new ProgressRenderer();
  progress.start('Phase 1: Research - Analyzing feasibility...');

  const prompt = `You are analyzing the feasibility of implementing the following feature/idea:

${idea}

Your task is to research and analyze:
1. Technical feasibility - Can this be built with current technologies?
2. Existing solutions - Are there similar implementations we can learn from?
3. Dependencies - What libraries/tools would be needed?
4. Risks and challenges - What could go wrong?
5. Time estimation - Rough complexity estimate (small/medium/large)

Create a research report and save it to: ${specsDir}/01-research.md

Format the report as markdown with clear sections for each analysis area.
Be thorough but concise. Focus on actionable insights.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 8,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Research: ${step}`);
      }
    },
  });

  const filePath = join(specsDir, '01-research.md');
  if (result.exitCode === 0) {
    progress.stop('Research phase complete');
    return { success: true, output: result.output, filePath };
  } else {
    progress.fail('Research phase failed');
    return { success: false, output: result.output };
  }
}

/**
 * Phase 2: Requirements Phase - User Stories
 */
async function runRequirementsPhase(
  agent: Agent,
  idea: string,
  cwd: string,
  specsDir: string,
  options: SpecCommandOptions
): Promise<PhaseResult> {
  const progress = new ProgressRenderer();
  progress.start('Phase 2: Requirements - Writing user stories...');

  // Read research if available
  const researchPath = join(specsDir, '01-research.md');
  const researchContent = existsSync(researchPath) ? readFileSync(researchPath, 'utf-8') : '';

  const prompt = `You are writing requirements for the following feature/idea:

${idea}

${researchContent ? `Previous research:\n${researchContent}\n` : ''}

Your task is to define requirements:
1. User Stories - Who needs this and why? (As a X, I want Y, so that Z)
2. Acceptance Criteria - How do we know it's done?
3. Functional Requirements - What must it do?
4. Non-Functional Requirements - Performance, security, accessibility
5. Out of Scope - What are we NOT building?

Create a requirements document and save it to: ${specsDir}/02-requirements.md

Format as markdown with clear sections. Use bullet points for lists.
Be specific and measurable where possible.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 8,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Requirements: ${step}`);
      }
    },
  });

  const filePath = join(specsDir, '02-requirements.md');
  if (result.exitCode === 0) {
    progress.stop('Requirements phase complete');
    return { success: true, output: result.output, filePath };
  } else {
    progress.fail('Requirements phase failed');
    return { success: false, output: result.output };
  }
}

/**
 * Phase 3: Design Phase - Architecture
 */
async function runDesignPhase(
  agent: Agent,
  idea: string,
  cwd: string,
  specsDir: string,
  options: SpecCommandOptions
): Promise<PhaseResult> {
  const progress = new ProgressRenderer();
  progress.start('Phase 3: Design - Creating architecture...');

  // Read previous phases if available
  const researchPath = join(specsDir, '01-research.md');
  const requirementsPath = join(specsDir, '02-requirements.md');
  const researchContent = existsSync(researchPath) ? readFileSync(researchPath, 'utf-8') : '';
  const requirementsContent = existsSync(requirementsPath)
    ? readFileSync(requirementsPath, 'utf-8')
    : '';

  const prompt = `You are designing the architecture for the following feature/idea:

${idea}

${researchContent ? `Research findings:\n${researchContent}\n` : ''}
${requirementsContent ? `Requirements:\n${requirementsContent}\n` : ''}

Your task is to design the solution:
1. High-Level Architecture - System components and their relationships
2. Data Model - Key entities and their properties
3. API Design - Endpoints/interfaces (if applicable)
4. File Structure - Where code will live in the project
5. Technology Choices - Libraries, frameworks, patterns to use
6. Integration Points - How it connects with existing code

Create an architecture document and save it to: ${specsDir}/03-design.md

Format as markdown. Include diagrams as ASCII art or mermaid if helpful.
Focus on clarity and maintainability.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 10,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Design: ${step}`);
      }
    },
  });

  const filePath = join(specsDir, '03-design.md');
  if (result.exitCode === 0) {
    progress.stop('Design phase complete');
    return { success: true, output: result.output, filePath };
  } else {
    progress.fail('Design phase failed');
    return { success: false, output: result.output };
  }
}

/**
 * Phase 4: Tasks Phase - Implementation Breakdown
 */
async function runTasksPhase(
  agent: Agent,
  idea: string,
  cwd: string,
  specsDir: string,
  options: SpecCommandOptions
): Promise<PhaseResult> {
  const progress = new ProgressRenderer();
  progress.start('Phase 4: Tasks - Breaking down implementation...');

  // Read all previous phases if available
  const researchPath = join(specsDir, '01-research.md');
  const requirementsPath = join(specsDir, '02-requirements.md');
  const designPath = join(specsDir, '03-design.md');
  const researchContent = existsSync(researchPath) ? readFileSync(researchPath, 'utf-8') : '';
  const requirementsContent = existsSync(requirementsPath)
    ? readFileSync(requirementsPath, 'utf-8')
    : '';
  const designContent = existsSync(designPath) ? readFileSync(designPath, 'utf-8') : '';

  const prompt = `You are breaking down the implementation tasks for the following feature/idea:

${idea}

${researchContent ? `Research findings:\n${researchContent}\n` : ''}
${requirementsContent ? `Requirements:\n${requirementsContent}\n` : ''}
${designContent ? `Architecture:\n${designContent}\n` : ''}

Your task is to create an implementation plan:
1. Task List - Numbered list of specific, actionable tasks
2. Dependencies - Which tasks depend on others
3. Priority Order - Suggested implementation sequence
4. Estimated Effort - T-shirt size (XS/S/M/L/XL) for each task
5. Testing Strategy - How each task will be verified

Create a tasks document and save it to: ${specsDir}/04-tasks.md

Rules for tasks:
- Each task should be completable in one coding session
- Tasks should be atomic and focused
- Include file paths where changes will be made
- Mark tasks that can be parallelized

Also update IMPLEMENTATION_PLAN.md (if it exists) with the new tasks.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 12,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Tasks: ${step}`);
      }
    },
  });

  const filePath = join(specsDir, '04-tasks.md');
  if (result.exitCode === 0) {
    progress.stop('Tasks phase complete');
    return { success: true, output: result.output, filePath };
  } else {
    progress.fail('Tasks phase failed');
    return { success: false, output: result.output };
  }
}

/**
 * Main spec command
 */
export async function specCommand(options: SpecCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.cyan.bold('ralph-starter spec'));
  console.log(chalk.dim('5-Phase Specification Generation'));
  console.log();

  // Get the idea/feature description
  const idea = options.idea;
  if (!idea) {
    // Try to read from stdin or prompt
    console.log(chalk.yellow('No idea/feature provided.'));
    console.log(chalk.dim('Usage: ralph-starter spec --idea "Your feature description"'));
    console.log();
    console.log(chalk.dim('Example:'));
    console.log(chalk.dim('  ralph-starter spec --idea "Add dark mode toggle to settings page"'));
    return;
  }

  // Setup specs directory
  const specsDir = options.outputDir || join(cwd, 'specs');
  if (!existsSync(specsDir)) {
    mkdirSync(specsDir, { recursive: true });
    console.log(chalk.dim(`Created specs directory: ${specsDir}`));
  }

  // Detect agent
  const detectProgress = new ProgressRenderer();
  detectProgress.start('Detecting coding agent...');
  const agent = await detectBestAgent();

  if (!agent) {
    detectProgress.fail('No coding agent found');
    console.log(chalk.dim('Install Claude Code, Cursor, Codex, or OpenCode.'));
    return;
  }

  detectProgress.stop(`Using ${agent.name}`);
  console.log();

  // Display idea
  console.log(chalk.bold('Feature/Idea:'));
  console.log(chalk.white(`  ${idea}`));
  console.log();

  // Track results
  const results: { phase: string; result: PhaseResult }[] = [];

  // Phase 1: Research
  if (!options.skipResearch) {
    console.log(chalk.bold('Starting 5-phase specification generation...'));
    console.log();
    const result = await runResearchPhase(agent, idea, cwd, specsDir, options);
    results.push({ phase: 'Research', result });
    if (!result.success) {
      console.log(chalk.red('Research phase failed. Stopping.'));
      return;
    }
    console.log();
  }

  // Phase 2: Requirements
  if (!options.skipRequirements) {
    const result = await runRequirementsPhase(agent, idea, cwd, specsDir, options);
    results.push({ phase: 'Requirements', result });
    if (!result.success) {
      console.log(chalk.red('Requirements phase failed. Stopping.'));
      return;
    }
    console.log();
  }

  // Phase 3: Design
  if (!options.skipDesign) {
    const result = await runDesignPhase(agent, idea, cwd, specsDir, options);
    results.push({ phase: 'Design', result });
    if (!result.success) {
      console.log(chalk.red('Design phase failed. Stopping.'));
      return;
    }
    console.log();
  }

  // Phase 4: Tasks
  if (!options.skipTasks) {
    const result = await runTasksPhase(agent, idea, cwd, specsDir, options);
    results.push({ phase: 'Tasks', result });
    if (!result.success) {
      console.log(chalk.red('Tasks phase failed. Stopping.'));
      return;
    }
    console.log();
  }

  // Summary
  console.log(chalk.green.bold('Specification generation complete!'));
  console.log();
  console.log(chalk.bold('Generated files:'));
  for (const { phase, result } of results) {
    if (result.filePath && existsSync(result.filePath)) {
      console.log(chalk.green(`  ${phase}: ${result.filePath}`));
    }
  }
  console.log();
  console.log(chalk.yellow('Next steps:'));
  console.log(chalk.dim('  1. Review the generated specs in the specs/ folder'));
  console.log(chalk.dim('  2. Adjust as needed'));
  console.log(chalk.dim('  3. Run: ralph-starter plan   # to update IMPLEMENTATION_PLAN.md'));
  console.log(chalk.dim('  4. Run: ralph-starter run    # to execute the plan'));
  console.log();
}

/**
 * Generate a summary of all specs
 */
export async function generateSpecSummary(specsDir: string): Promise<string> {
  const files = ['01-research.md', '02-requirements.md', '03-design.md', '04-tasks.md'];
  const summaryParts: string[] = [];

  for (const file of files) {
    const filePath = join(specsDir, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      // Extract first heading and first paragraph as summary
      const lines = content.split('\n');
      const heading = lines.find((l) => l.startsWith('#'));
      const firstPara = lines
        .filter((l) => l.trim() && !l.startsWith('#'))
        .slice(0, 3)
        .join(' ');
      summaryParts.push(`**${file}**: ${heading || file}\n${firstPara.slice(0, 200)}...`);
    }
  }

  return summaryParts.join('\n\n');
}
