/**
 * Harvest Command - Knowledge Extraction and Archiving
 *
 * Extracts learnings from activity.md, updates AGENTS.md with patterns,
 * and archives completed tasks.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { type Agent, detectBestAgent, runAgent } from '../loop/agents.js';
import { detectStepFromOutput } from '../loop/step-detector.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';

export interface HarvestCommandOptions {
  /** Run in automated mode (skip permissions) */
  auto?: boolean;
  /** Skip activity.md extraction */
  skipActivity?: boolean;
  /** Skip AGENTS.md updates */
  skipAgents?: boolean;
  /** Skip task archiving */
  skipArchive?: boolean;
  /** Archive directory */
  archiveDir?: string;
  /** Verbose output */
  verbose?: boolean;
  /** Dry run - show what would be done without making changes */
  dryRun?: boolean;
}

interface ActivityEntry {
  iteration: number;
  timestamp: string;
  status: 'completed' | 'failed' | 'validation_failed' | 'blocked' | 'started';
  summary?: string;
  duration?: string;
  cost?: string;
  validationResults?: { command: string; success: boolean }[];
}

interface HarvestResult {
  learnings: string[];
  patterns: string[];
  failures: string[];
  totalIterations: number;
  successfulIterations: number;
  failedIterations: number;
  totalCost?: string;
}

/**
 * Parse activity.md to extract entries
 */
function parseActivityFile(content: string): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const iterationRegex = /### Iteration (\d+) - ([\d\-T:.Z]+)/g;
  const statusRegex =
    /\*\*Status:\*\* (✅ Completed|❌ Failed|⚠️ Validation Failed|🚫 Blocked|🔄 Started)/;
  const summaryRegex = /\*\*Summary:\*\* (.+)/;
  const durationRegex = /\*\*Duration:\*\* (.+)/;
  const costRegex = /\*\*Cost:\*\* (.+)/;
  const validationRegex = /- (✅|❌) (.+)/g;

  // Split by iteration headers
  const sections = content.split(/(?=### Iteration \d+)/);

  for (const section of sections) {
    const iterMatch = /### Iteration (\d+) - ([\d\-T:.Z]+)/.exec(section);
    if (!iterMatch) continue;

    const entry: ActivityEntry = {
      iteration: parseInt(iterMatch[1], 10),
      timestamp: iterMatch[2],
      status: 'started',
    };

    // Parse status
    const statusMatch = statusRegex.exec(section);
    if (statusMatch) {
      const statusText = statusMatch[1];
      if (statusText.includes('Completed')) entry.status = 'completed';
      else if (statusText.includes('Failed')) entry.status = 'failed';
      else if (statusText.includes('Validation Failed')) entry.status = 'validation_failed';
      else if (statusText.includes('Blocked')) entry.status = 'blocked';
      else entry.status = 'started';
    }

    // Parse summary
    const summaryMatch = summaryRegex.exec(section);
    if (summaryMatch) {
      entry.summary = summaryMatch[1];
    }

    // Parse duration
    const durationMatch = durationRegex.exec(section);
    if (durationMatch) {
      entry.duration = durationMatch[1];
    }

    // Parse cost
    const costMatch = costRegex.exec(section);
    if (costMatch) {
      entry.cost = costMatch[1];
    }

    // Parse validation results
    const validationMatches = section.match(validationRegex);
    if (validationMatches) {
      entry.validationResults = validationMatches.map((v) => {
        const parts = v.match(/- (✅|❌) (.+)/);
        return {
          command: parts?.[2] || v,
          success: v.includes('✅'),
        };
      });
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Analyze activity entries and extract learnings
 */
function analyzeActivity(entries: ActivityEntry[]): HarvestResult {
  const learnings: string[] = [];
  const patterns: string[] = [];
  const failures: string[] = [];

  let successfulIterations = 0;
  let failedIterations = 0;
  let totalCost = 0;

  for (const entry of entries) {
    if (entry.status === 'completed') {
      successfulIterations++;
      if (entry.summary && !entry.summary.includes('{')) {
        learnings.push(entry.summary);
      }
    } else if (entry.status === 'failed' || entry.status === 'validation_failed') {
      failedIterations++;
      if (entry.summary) {
        failures.push(entry.summary);
      }
      // Extract validation failures
      if (entry.validationResults) {
        for (const vr of entry.validationResults) {
          if (!vr.success) {
            failures.push(`Validation failed: ${vr.command}`);
          }
        }
      }
    }

    // Parse cost
    if (entry.cost) {
      const costMatch = entry.cost.match(/\$?([\d.]+)/);
      if (costMatch) {
        totalCost += parseFloat(costMatch[1]);
      }
    }
  }

  // Deduplicate
  const uniqueLearnings = [...new Set(learnings)];
  const uniqueFailures = [...new Set(failures)];

  // Identify patterns from failures
  const failurePatterns = new Map<string, number>();
  for (const failure of uniqueFailures) {
    // Normalize failure message
    const normalized = failure.toLowerCase();
    if (normalized.includes('test')) {
      failurePatterns.set('Test failures', (failurePatterns.get('Test failures') || 0) + 1);
    }
    if (normalized.includes('lint')) {
      failurePatterns.set('Lint errors', (failurePatterns.get('Lint errors') || 0) + 1);
    }
    if (normalized.includes('build')) {
      failurePatterns.set('Build failures', (failurePatterns.get('Build failures') || 0) + 1);
    }
    if (normalized.includes('circuit breaker')) {
      failurePatterns.set(
        'Circuit breaker trips',
        (failurePatterns.get('Circuit breaker trips') || 0) + 1
      );
    }
  }

  for (const [pattern, count] of failurePatterns.entries()) {
    patterns.push(`${pattern}: ${count} occurrence(s)`);
  }

  return {
    learnings: uniqueLearnings,
    patterns,
    failures: uniqueFailures,
    totalIterations: entries.length,
    successfulIterations,
    failedIterations,
    totalCost: totalCost > 0 ? `$${totalCost.toFixed(2)}` : undefined,
  };
}

/**
 * Extract learnings using AI agent
 */
async function extractLearningsWithAgent(
  agent: Agent,
  activityContent: string,
  cwd: string,
  options: HarvestCommandOptions
): Promise<{ success: boolean; learnings: string }> {
  const progress = new ProgressRenderer();
  progress.start('Extracting learnings with AI...');

  const prompt = `Analyze the following activity log from an AI coding loop and extract key learnings.

Activity Log:
${activityContent}

Your task:
1. Identify patterns in successful iterations
2. Identify common failure modes
3. Extract actionable insights for improving future runs
4. Suggest improvements to AGENTS.md or workflow

Format your response as a markdown document with these sections:
- ## Key Learnings (bullet points of what worked well)
- ## Failure Patterns (common issues and their causes)
- ## Recommendations (specific actionable improvements)

Be concise and focus on actionable insights.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 5,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Extracting: ${step}`);
      }
    },
  });

  if (result.exitCode === 0) {
    progress.stop('Learnings extracted');
    return { success: true, learnings: result.output };
  } else {
    progress.fail('Failed to extract learnings');
    return { success: false, learnings: '' };
  }
}

/**
 * Update AGENTS.md with new patterns
 */
async function updateAgentsFile(
  agent: Agent,
  currentAgents: string,
  harvestResult: HarvestResult,
  cwd: string,
  options: HarvestCommandOptions
): Promise<{ success: boolean; updated: string }> {
  const progress = new ProgressRenderer();
  progress.start('Updating AGENTS.md with patterns...');

  const prompt = `Update the AGENTS.md file with learnings from recent coding sessions.

Current AGENTS.md:
${currentAgents}

Recent Session Analysis:
- Total iterations: ${harvestResult.totalIterations}
- Successful: ${harvestResult.successfulIterations}
- Failed: ${harvestResult.failedIterations}
${harvestResult.totalCost ? `- Total cost: ${harvestResult.totalCost}` : ''}

Failure Patterns:
${harvestResult.patterns.length > 0 ? harvestResult.patterns.join('\n') : 'None identified'}

Learnings:
${harvestResult.learnings.slice(0, 10).join('\n')}

Your task:
1. Add any new patterns to the "Code Patterns" section if they aren't already there
2. Add any new validation commands if needed
3. Update "Task Completion" criteria if new insights were discovered
4. Keep the file concise and focused

Save the updated content to AGENTS.md. Only make changes that add value based on the learnings.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 5,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Updating: ${step}`);
      }
    },
  });

  if (result.exitCode === 0) {
    progress.stop('AGENTS.md updated');
    return { success: true, updated: result.output };
  } else {
    progress.fail('Failed to update AGENTS.md');
    return { success: false, updated: '' };
  }
}

/**
 * Archive completed task activity
 */
function archiveActivity(cwd: string, archiveDir: string, dryRun: boolean): string | null {
  const activityPath = join(cwd, '.ralph', 'activity.md');

  if (!existsSync(activityPath)) {
    return null;
  }

  const content = readFileSync(activityPath, 'utf-8');

  // Create archive directory if needed
  const archivePath = join(cwd, archiveDir);
  if (!dryRun && !existsSync(archivePath)) {
    mkdirSync(archivePath, { recursive: true });
  }

  // Generate archive filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const archiveFile = join(archivePath, `activity-${timestamp}.md`);

  if (!dryRun) {
    writeFileSync(archiveFile, content, 'utf-8');
  }

  return archiveFile;
}

/**
 * Main harvest command
 */
export async function harvestCommand(options: HarvestCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.cyan.bold('ralph-starter harvest'));
  console.log(chalk.dim('Knowledge extraction and archiving'));
  console.log();

  if (options.dryRun) {
    console.log(chalk.yellow('  Dry run mode - no changes will be made'));
    console.log();
  }

  // Check for activity file
  const activityPath = join(cwd, '.ralph', 'activity.md');
  const agentsPath = join(cwd, 'AGENTS.md');

  if (!existsSync(activityPath)) {
    console.log(chalk.yellow('  No activity.md found in .ralph/ directory.'));
    console.log(chalk.dim('  Run some tasks first with: ralph-starter run'));
    console.log();
    return;
  }

  // Read and parse activity
  const activityContent = readFileSync(activityPath, 'utf-8');
  const entries = parseActivityFile(activityContent);

  console.log(chalk.bold('Activity Summary:'));
  console.log(chalk.dim(`  Found ${entries.length} iteration(s) in activity log`));
  console.log();

  if (entries.length === 0) {
    console.log(chalk.yellow('  No iterations found to harvest.'));
    return;
  }

  // Analyze activity
  const harvestResult = analyzeActivity(entries);

  // Display analysis
  console.log(chalk.bold('Analysis:'));
  console.log(chalk.green(`  ✓ Successful iterations: ${harvestResult.successfulIterations}`));
  console.log(chalk.red(`  ✗ Failed iterations: ${harvestResult.failedIterations}`));
  if (harvestResult.totalCost) {
    console.log(chalk.dim(`  💰 Total cost: ${harvestResult.totalCost}`));
  }
  console.log();

  if (harvestResult.patterns.length > 0) {
    console.log(chalk.bold('Identified Patterns:'));
    for (const pattern of harvestResult.patterns) {
      console.log(chalk.dim(`  - ${pattern}`));
    }
    console.log();
  }

  // Detect agent for AI-powered extraction
  let agent: Agent | null = null;
  if (!options.skipActivity || !options.skipAgents) {
    const detectProgress = new ProgressRenderer();
    detectProgress.start('Detecting coding agent...');
    agent = await detectBestAgent();

    if (!agent) {
      detectProgress.fail('No coding agent found');
      console.log(
        chalk.dim('  AI-powered extraction requires Claude Code, Cursor, Codex, or OpenCode.')
      );
      console.log(chalk.dim('  Falling back to basic analysis only.'));
      console.log();
    } else {
      detectProgress.stop(`Using ${agent.name}`);
      console.log();
    }
  }

  // Phase 1: Extract learnings with AI
  if (!options.skipActivity && agent && !options.dryRun) {
    console.log(chalk.bold('Phase 1: Extracting Learnings'));
    const extraction = await extractLearningsWithAgent(agent, activityContent, cwd, options);

    if (extraction.success && extraction.learnings) {
      // Save learnings to file
      const learningsDir = join(cwd, '.ralph', 'learnings');
      if (!existsSync(learningsDir)) {
        mkdirSync(learningsDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const learningsFile = join(learningsDir, `learnings-${timestamp}.md`);
      writeFileSync(
        learningsFile,
        `# Learnings - ${new Date().toISOString()}\n\n${extraction.learnings}`,
        'utf-8'
      );
      console.log(chalk.green(`  Saved to: ${learningsFile}`));
    }
    console.log();
  } else if (options.skipActivity) {
    console.log(chalk.dim('  Skipping activity extraction (--skip-activity)'));
    console.log();
  }

  // Phase 2: Update AGENTS.md
  if (!options.skipAgents && agent && existsSync(agentsPath) && !options.dryRun) {
    console.log(chalk.bold('Phase 2: Updating AGENTS.md'));
    const agentsContent = readFileSync(agentsPath, 'utf-8');
    await updateAgentsFile(agent, agentsContent, harvestResult, cwd, options);
    console.log();
  } else if (options.skipAgents) {
    console.log(chalk.dim('  Skipping AGENTS.md update (--skip-agents)'));
    console.log();
  } else if (!existsSync(agentsPath)) {
    console.log(chalk.dim('  No AGENTS.md found - skipping update'));
    console.log();
  }

  // Phase 3: Archive activity
  if (!options.skipArchive) {
    console.log(chalk.bold('Phase 3: Archiving Activity'));
    const archiveDir = options.archiveDir || '.ralph/archive';
    const archivedFile = archiveActivity(cwd, archiveDir, options.dryRun || false);

    if (archivedFile) {
      if (options.dryRun) {
        console.log(chalk.dim(`  Would archive to: ${archivedFile}`));
      } else {
        console.log(chalk.green(`  Archived to: ${archivedFile}`));
      }
    } else {
      console.log(chalk.yellow('  No activity file to archive'));
    }
    console.log();
  } else {
    console.log(chalk.dim('  Skipping archiving (--skip-archive)'));
    console.log();
  }

  // Summary
  console.log(chalk.green.bold('Harvest complete!'));
  console.log();
  console.log(chalk.yellow('Next steps:'));
  console.log(chalk.dim('  1. Review the extracted learnings in .ralph/learnings/'));
  console.log(chalk.dim('  2. Check AGENTS.md for any updates'));
  console.log(chalk.dim('  3. Consider clearing activity.md for a fresh start'));
  console.log();
}
