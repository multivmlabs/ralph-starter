import { describe, expect, it, vi } from 'vitest';
import type { Agent } from '../agents.js';
import type { SwarmConfig, SwarmStrategy } from '../swarm.js';

// Mock the dependencies
vi.mock('../agents.js', () => ({
  detectAvailableAgents: vi.fn().mockResolvedValue([
    { type: 'claude-code', name: 'Claude Code', command: 'claude', available: true },
    { type: 'codex', name: 'Codex CLI', command: 'codex', available: true },
  ]),
}));

vi.mock('../../automation/worktree.js', () => ({
  cleanupAllWorktrees: vi.fn().mockResolvedValue(0),
  createWorktree: vi.fn().mockResolvedValue('/tmp/worktree-test'),
  removeWorktree: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../automation/git.js', () => ({
  getDefaultBranch: vi.fn().mockResolvedValue('main'),
  getCurrentBranch: vi.fn().mockResolvedValue('main'),
  hasUncommittedChanges: vi.fn().mockResolvedValue(false),
  gitCommit: vi.fn().mockResolvedValue(undefined),
  gitPush: vi.fn().mockResolvedValue(undefined),
  createPullRequest: vi.fn().mockResolvedValue('https://github.com/test/pr/1'),
}));

vi.mock('../executor.js', () => ({
  runLoop: vi.fn().mockResolvedValue({
    success: true,
    iterations: 5,
    commits: ['commit-1'],
    stats: {
      totalDuration: 30000,
      avgIterationDuration: 6000,
      validationFailures: 0,
      costStats: {
        totalCost: { inputCost: 0.01, outputCost: 0.02, totalCost: 0.03 },
        totalTokens: { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        iterations: [],
      },
    },
  }),
}));

describe('swarm', () => {
  it('should export SwarmStrategy type values', () => {
    const strategies: SwarmStrategy[] = ['race', 'consensus', 'pipeline'];
    expect(strategies).toHaveLength(3);
  });

  it('should define SwarmConfig type correctly', () => {
    const config: SwarmConfig = {
      task: 'Build a feature',
      cwd: '/tmp/test',
      strategy: 'race',
      auto: true,
      validate: true,
      maxIterations: 10,
    };
    expect(config.strategy).toBe('race');
    expect(config.task).toBe('Build a feature');
  });

  it('should run swarm in race mode', async () => {
    const { runSwarm } = await import('../swarm.js');
    const progressMessages: string[] = [];

    const result = await runSwarm({
      task: 'Add dark mode',
      cwd: '/tmp/test-repo',
      strategy: 'race',
      auto: true,
      validate: false,
      maxIterations: 5,
      onProgress: (msg) => progressMessages.push(msg),
    });

    expect(result.strategy).toBe('race');
    expect(result.agents.length).toBe(2);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThanOrEqual(0);
    // At least one agent should have succeeded
    expect(result.winner).toBeDefined();
  });

  it('should run swarm in consensus mode', async () => {
    const { runSwarm } = await import('../swarm.js');

    const result = await runSwarm({
      task: 'Add dark mode',
      cwd: '/tmp/test-repo',
      strategy: 'consensus',
      auto: true,
      validate: false,
      maxIterations: 5,
    });

    expect(result.strategy).toBe('consensus');
    expect(result.results.length).toBe(2);
    expect(result.winner).toBeDefined();
  });

  it('should run swarm in pipeline mode', async () => {
    const { runSwarm } = await import('../swarm.js');

    const result = await runSwarm({
      task: 'Add dark mode',
      cwd: '/tmp/test-repo',
      strategy: 'pipeline',
      auto: true,
      validate: false,
      maxIterations: 10,
    });

    expect(result.strategy).toBe('pipeline');
    expect(result.results.length).toBe(2); // Both agents run sequentially
    expect(result.winner).toBeDefined();
  });

  it('should use provided agents instead of auto-detecting', async () => {
    const { runSwarm } = await import('../swarm.js');
    const customAgents: Agent[] = [
      { type: 'claude-code', name: 'Claude Code', command: 'claude', available: true },
    ];

    const result = await runSwarm({
      task: 'Single agent task',
      cwd: '/tmp/test-repo',
      strategy: 'race',
      agents: customAgents,
      auto: true,
      validate: false,
      maxIterations: 5,
    });

    expect(result.agents.length).toBe(1);
    expect(result.agents[0].type).toBe('claude-code');
  });

  it('should throw when no agents available', async () => {
    const { runSwarm } = await import('../swarm.js');

    await expect(
      runSwarm({
        task: 'No agents',
        cwd: '/tmp/test-repo',
        strategy: 'race',
        agents: [],
        auto: true,
      })
    ).rejects.toThrow('No agents available');
  });

  it('should aggregate costs across all agents', async () => {
    const { runSwarm } = await import('../swarm.js');

    const result = await runSwarm({
      task: 'Cost tracking test',
      cwd: '/tmp/test-repo',
      strategy: 'consensus',
      auto: true,
      validate: false,
      maxIterations: 5,
    });

    // 2 agents × $0.03 each = $0.06
    expect(result.totalCost).toBeCloseTo(0.06, 1);
  });
});
