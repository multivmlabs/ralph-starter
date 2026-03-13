/**
 * Multi-Agent Swarm Mode
 *
 * Runs the same task with multiple agents in parallel using git worktrees.
 * Supports three strategies:
 * - race: First successful agent wins
 * - consensus: All agents run, LLM judges best result
 * - pipeline: Chain agents sequentially (build → review → test)
 */

import chalk from 'chalk';
import {
  createPullRequest,
  getDefaultBranch,
  gitCommit,
  gitPush,
  hasUncommittedChanges,
} from '../automation/git.js';
import { cleanupAllWorktrees, createWorktree, removeWorktree } from '../automation/worktree.js';
import type { Agent } from './agents.js';
import { detectAvailableAgents } from './agents.js';
import { type LoopOptions, type LoopResult, runLoop } from './executor.js';

export type SwarmStrategy = 'race' | 'consensus' | 'pipeline';

export type SwarmConfig = {
  task: string;
  cwd: string;
  agents?: Agent[];
  strategy: SwarmStrategy;
  headless?: boolean;
  enableSkills?: boolean;
  auto?: boolean;
  validate?: boolean;
  maxIterations?: number;
  pr?: boolean;
  push?: boolean;
  commit?: boolean;
  onProgress?: (message: string) => void;
};

export type SwarmAgentResult = {
  agent: Agent;
  result: LoopResult;
  worktreePath: string;
  branch: string;
  success: boolean;
  error?: string;
};

export type SwarmResult = {
  strategy: SwarmStrategy;
  agents: Agent[];
  results: SwarmAgentResult[];
  winner?: SwarmAgentResult;
  totalCost: number;
  prUrl?: string;
};

const EMPTY_RESULT: LoopResult = {
  success: false,
  iterations: 0,
  commits: [],
  stats: undefined,
};

/**
 * Run a swarm of agents on the same task.
 */
export async function runSwarm(config: SwarmConfig): Promise<SwarmResult> {
  const {
    task,
    cwd,
    strategy,
    headless = false,
    enableSkills,
    auto = true,
    validate = true,
    maxIterations = 15,
    pr = false,
    push = false,
    commit = true,
    onProgress,
  } = config;

  const agents = config.agents ?? (await getSwarmAgents());

  if (agents.length === 0) {
    throw new Error('No agents available for swarm execution');
  }

  if (agents.length === 1 && strategy !== 'pipeline') {
    onProgress?.('Only one agent available — running in single-agent mode');
  }

  onProgress?.(
    `Swarm: ${strategy} mode with ${agents.length} agents: ${agents.map((a) => a.name).join(', ')}`
  );

  await cleanupAllWorktrees(cwd);

  let swarmResult: SwarmResult;

  switch (strategy) {
    case 'race':
      swarmResult = await runRaceStrategy(agents, task, cwd, {
        auto,
        validate,
        maxIterations,
        headless,
        enableSkills,
        onProgress,
      });
      break;
    case 'consensus':
      swarmResult = await runConsensusStrategy(agents, task, cwd, {
        auto,
        validate,
        maxIterations,
        headless,
        enableSkills,
        onProgress,
      });
      break;
    case 'pipeline':
      swarmResult = await runPipelineStrategy(agents, task, cwd, {
        auto,
        validate,
        maxIterations,
        headless,
        enableSkills,
        onProgress,
      });
      break;
  }

  // Handle winning result: commit, push, PR
  if (swarmResult.winner && commit) {
    const winner = swarmResult.winner;

    if (await hasUncommittedChanges(winner.worktreePath)) {
      await gitCommit(winner.worktreePath, `feat: ${task.split('\n')[0].slice(0, 60)}`);
    }

    if (push) {
      await gitPush(winner.worktreePath, winner.branch);

      if (pr) {
        const defaultBranch = await getDefaultBranch(cwd);
        const prUrl = await createPullRequest(winner.worktreePath, {
          title: `feat: ${task.split('\n')[0].slice(0, 60)}`,
          body: formatSwarmPrBody(swarmResult),
          base: defaultBranch,
        });
        swarmResult.prUrl = prUrl;
      }
    }
  }

  // Cleanup worktrees (except winner if PR was created)
  for (const agentResult of swarmResult.results) {
    if (agentResult === swarmResult.winner && swarmResult.prUrl) {
      continue;
    }
    try {
      await removeWorktree(cwd, agentResult.worktreePath, false);
    } catch {
      // Best effort cleanup
    }
  }

  return swarmResult;
}

async function getSwarmAgents(): Promise<Agent[]> {
  const allAgents = await detectAvailableAgents();
  return allAgents.filter((a) => a.available);
}

type StrategyOptions = {
  auto: boolean;
  validate: boolean;
  maxIterations: number;
  headless: boolean;
  enableSkills?: boolean;
  onProgress?: (message: string) => void;
};

function makeLoopOptions(
  task: string,
  worktreePath: string,
  agent: Agent,
  opts: StrategyOptions
): LoopOptions {
  return {
    task,
    cwd: worktreePath,
    agent,
    auto: opts.auto,
    validate: opts.validate,
    maxIterations: opts.maxIterations,
    commit: false,
    push: false,
    pr: false,
    trackProgress: true,
    trackCost: true,
    headless: opts.headless,
    enableSkills: opts.enableSkills,
  };
}

function getCost(result: LoopResult): number {
  return result.stats?.costStats?.totalCost?.totalCost ?? 0;
}

/**
 * Race strategy: run all agents in parallel, first success wins.
 */
async function runRaceStrategy(
  agents: Agent[],
  task: string,
  cwd: string,
  opts: StrategyOptions
): Promise<SwarmResult> {
  const defaultBranch = await getDefaultBranch(cwd);
  const results: SwarmAgentResult[] = [];
  let winner: SwarmAgentResult | undefined;

  const promises = agents.map(async (agent, index) => {
    const branch = `swarm/race-${agent.type}-${Date.now()}`;
    let worktreePath: string;

    try {
      worktreePath = await createWorktree(cwd, branch, defaultBranch);
    } catch (error) {
      const agentResult: SwarmAgentResult = {
        agent,
        result: EMPTY_RESULT,
        worktreePath: '',
        branch,
        success: false,
        error: `Failed to create worktree: ${error instanceof Error ? error.message : 'unknown'}`,
      };
      results[index] = agentResult;
      return agentResult;
    }

    opts.onProgress?.(`${agent.name}: starting in worktree`);

    try {
      const result = await runLoop(makeLoopOptions(task, worktreePath, agent, opts));

      const agentResult: SwarmAgentResult = {
        agent,
        result,
        worktreePath,
        branch,
        success: result.success,
      };

      results[index] = agentResult;

      if (result.success && !winner) {
        winner = agentResult;
        opts.onProgress?.(`${agent.name}: ${chalk.green('WON THE RACE')}`);
      } else {
        opts.onProgress?.(`${agent.name}: ${result.success ? 'completed' : 'failed'}`);
      }

      return agentResult;
    } catch (error) {
      const agentResult: SwarmAgentResult = {
        agent,
        result: EMPTY_RESULT,
        worktreePath,
        branch,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      results[index] = agentResult;
      return agentResult;
    }
  });

  await Promise.allSettled(promises);

  const totalCost = results.reduce((sum, r) => sum + (r ? getCost(r.result) : 0), 0);

  return { strategy: 'race', agents, results: results.filter(Boolean), winner, totalCost };
}

/**
 * Consensus strategy: run all agents, compare outputs, pick best.
 */
async function runConsensusStrategy(
  agents: Agent[],
  task: string,
  cwd: string,
  opts: StrategyOptions
): Promise<SwarmResult> {
  const defaultBranch = await getDefaultBranch(cwd);
  const results: SwarmAgentResult[] = [];

  const promises = agents.map(async (agent) => {
    const branch = `swarm/consensus-${agent.type}-${Date.now()}`;
    let worktreePath: string;

    try {
      worktreePath = await createWorktree(cwd, branch, defaultBranch);
    } catch (error) {
      return {
        agent,
        result: EMPTY_RESULT,
        worktreePath: '',
        branch,
        success: false,
        error: `Failed to create worktree: ${error instanceof Error ? error.message : 'unknown'}`,
      } satisfies SwarmAgentResult;
    }

    opts.onProgress?.(`${agent.name}: starting in worktree`);

    try {
      const result = await runLoop(makeLoopOptions(task, worktreePath, agent, opts));
      opts.onProgress?.(`${agent.name}: ${result.success ? 'completed' : 'failed'}`);

      return {
        agent,
        result,
        worktreePath,
        branch,
        success: result.success,
      } satisfies SwarmAgentResult;
    } catch (error) {
      return {
        agent,
        result: EMPTY_RESULT,
        worktreePath,
        branch,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } satisfies SwarmAgentResult;
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      results.push(s.value);
    }
  }

  // Pick winner: prefer successful results with fewer iterations
  const successful = results.filter((r) => r.success);
  let winner: SwarmAgentResult | undefined;

  if (successful.length > 0) {
    winner = successful.sort((a, b) => a.result.iterations - b.result.iterations)[0];
    opts.onProgress?.(`Consensus winner: ${winner.agent.name}`);
  }

  const totalCost = results.reduce((sum, r) => sum + getCost(r.result), 0);

  return { strategy: 'consensus', agents, results, winner, totalCost };
}

/**
 * Pipeline strategy: chain agents sequentially (agent A builds → agent B reviews/fixes).
 */
async function runPipelineStrategy(
  agents: Agent[],
  task: string,
  cwd: string,
  opts: StrategyOptions
): Promise<SwarmResult> {
  const defaultBranch = await getDefaultBranch(cwd);
  const results: SwarmAgentResult[] = [];
  const branch = `swarm/pipeline-${Date.now()}`;

  let worktreePath: string;
  try {
    worktreePath = await createWorktree(cwd, branch, defaultBranch);
  } catch (error) {
    throw new Error(
      `Failed to create pipeline worktree: ${error instanceof Error ? error.message : 'unknown'}`
    );
  }

  let lastSuccess = false;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const isFirst = i === 0;
    const isLast = i === agents.length - 1;

    let stageTask: string;
    if (isFirst) {
      stageTask = `${task}\n\nYou are the FIRST agent in a pipeline. Implement the task above.`;
    } else if (isLast) {
      stageTask = `Review and polish the implementation done by previous agents.\n\nOriginal task: ${task}\n\nFix any issues, improve code quality, and ensure all tests pass.`;
    } else {
      stageTask = `Continue the implementation started by the previous agent.\n\nOriginal task: ${task}\n\nReview what was done, fix issues, and continue implementation.`;
    }

    opts.onProgress?.(`Pipeline stage ${i + 1}/${agents.length}: ${agent.name}`);

    try {
      if (!isFirst && (await hasUncommittedChanges(worktreePath))) {
        await gitCommit(worktreePath, `chore: pipeline stage ${i} (${agents[i - 1].name})`);
      }

      const stageOpts = { ...opts, maxIterations: Math.ceil(opts.maxIterations / agents.length) };
      const result = await runLoop(makeLoopOptions(stageTask, worktreePath, agent, stageOpts));

      lastSuccess = result.success;
      results.push({
        agent,
        result,
        worktreePath,
        branch,
        success: lastSuccess,
      });

      opts.onProgress?.(`${agent.name}: ${lastSuccess ? 'completed stage' : 'failed stage'}`);
    } catch (error) {
      results.push({
        agent,
        result: EMPTY_RESULT,
        worktreePath,
        branch,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const totalCost = results.reduce((sum, r) => sum + getCost(r.result), 0);
  const winner = lastSuccess ? results[results.length - 1] : undefined;

  return { strategy: 'pipeline', agents, results, winner, totalCost };
}

function formatSwarmPrBody(result: SwarmResult): string {
  const lines: string[] = [];

  lines.push('## Swarm Execution Summary');
  lines.push('');
  lines.push(`**Strategy:** ${result.strategy}`);
  lines.push(`**Agents:** ${result.agents.map((a) => a.name).join(', ')}`);
  lines.push(`**Total estimated cost:** $${result.totalCost.toFixed(4)}`);
  lines.push('');

  if (result.winner) {
    lines.push(`**Winner:** ${result.winner.agent.name}`);
    lines.push(`- Iterations: ${result.winner.result.iterations}`);
    lines.push('');
  }

  lines.push('### Agent Results');
  lines.push('');
  lines.push('| Agent | Status | Iterations | Cost |');
  lines.push('|-------|--------|------------|------|');

  for (const r of result.results) {
    const status = r.success ? 'Success' : 'Failed';
    const cost = getCost(r.result);
    lines.push(`| ${r.agent.name} | ${status} | ${r.result.iterations} | $${cost.toFixed(4)} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(
    '*Generated by [ralph-starter](https://github.com/multivmlabs/ralph-starter) swarm mode*'
  );

  return lines.join('\n');
}
