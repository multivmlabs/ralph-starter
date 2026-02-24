import { describe, expect, it } from 'vitest';
import type { BatchTask } from '../batch-fetcher.js';
import { buildCommitMessage, buildPrBody, type TaskResult } from '../task-executor.js';

function makeTask(overrides: Partial<BatchTask> = {}): BatchTask {
  return {
    id: '42',
    title: 'Add user authentication',
    description: 'Implement login and signup flows',
    source: 'github',
    url: 'https://github.com/org/repo/issues/42',
    labels: [],
    ...overrides,
  };
}

describe('task-executor', () => {
  describe('buildCommitMessage', () => {
    it('should default to feat: prefix', () => {
      const msg = buildCommitMessage(makeTask());
      expect(msg).toMatch(/^feat: /);
    });

    it('should detect fix type from bug label', () => {
      const msg = buildCommitMessage(makeTask({ labels: ['bug'] }));
      expect(msg).toMatch(/^fix: /);
    });

    it('should detect fix type from title containing "fix"', () => {
      const msg = buildCommitMessage(makeTask({ title: 'Fix broken login flow' }));
      expect(msg).toMatch(/^fix: /);
    });

    it('should detect docs type from docs label', () => {
      const msg = buildCommitMessage(makeTask({ labels: ['docs'] }));
      expect(msg).toMatch(/^docs: /);
    });

    it('should detect refactor type from title', () => {
      const msg = buildCommitMessage(makeTask({ title: 'Refactor auth module' }));
      expect(msg).toMatch(/^refactor: /);
    });

    it('should detect test type from test label', () => {
      const msg = buildCommitMessage(makeTask({ labels: ['test'] }));
      expect(msg).toMatch(/^test: /);
    });

    it('should detect chore type from chore label', () => {
      const msg = buildCommitMessage(makeTask({ labels: ['chore'] }));
      expect(msg).toMatch(/^chore: /);
    });

    it('should strip [feat] bracket prefix from title', () => {
      const msg = buildCommitMessage(makeTask({ title: '[feat] Add dark mode' }));
      expect(msg).toContain('Add dark mode');
      expect(msg).not.toContain('[feat]');
    });

    it('should strip feat: colon prefix from title', () => {
      const msg = buildCommitMessage(makeTask({ title: 'feat: Add dark mode' }));
      expect(msg).toContain('Add dark mode');
      // Should not have double "feat: feat:"
      expect(msg).not.toMatch(/feat:.*feat:/);
    });

    it('should strip all conventional commit bracket prefixes', () => {
      const prefixes = [
        'feat',
        'fix',
        'docs',
        'refactor',
        'test',
        'chore',
        'style',
        'ci',
        'perf',
        'build',
      ];
      for (const prefix of prefixes) {
        const msg = buildCommitMessage(makeTask({ title: `[${prefix}] Do something` }));
        expect(msg).toContain('Do something');
        expect(msg).not.toContain(`[${prefix}]`);
      }
    });

    it('should strip all conventional commit colon prefixes', () => {
      const prefixes = [
        'feat',
        'fix',
        'chore',
        'docs',
        'refactor',
        'test',
        'style',
        'ci',
        'perf',
        'build',
      ];
      for (const prefix of prefixes) {
        const msg = buildCommitMessage(makeTask({ title: `${prefix}: Do something` }));
        expect(msg).toContain('Do something');
      }
    });

    it('should include Closes reference with source and id', () => {
      const msg = buildCommitMessage(makeTask({ source: 'github', id: '99' }));
      expect(msg).toContain('Closes github#99');
    });

    it('should include auto mode attribution', () => {
      const msg = buildCommitMessage(makeTask());
      expect(msg).toContain('ralph-starter auto mode');
    });
  });

  describe('buildPrBody', () => {
    const result: TaskResult = {
      task: makeTask(),
      success: true,
      iterations: 8,
      cost: 0.42,
      branch: 'feat/auth-42',
    };

    it('should include task URL', () => {
      const body = buildPrBody(makeTask(), result, 'main');
      expect(body).toContain('https://github.com/org/repo/issues/42');
    });

    it('should include task description', () => {
      const body = buildPrBody(makeTask(), result, 'main');
      expect(body).toContain('Implement login and signup flows');
    });

    it('should truncate long descriptions to 500 chars', () => {
      const longTask = makeTask({ description: 'x'.repeat(600) });
      const body = buildPrBody(longTask, result, 'main');
      expect(body).toContain('...');
    });

    it('should include execution details', () => {
      const body = buildPrBody(makeTask(), result, 'main');
      expect(body).toContain('Iterations: 8');
      expect(body).toContain('Base branch: `main`');
      expect(body).toContain('$0.42');
    });

    it('should include ralph-starter attribution', () => {
      const body = buildPrBody(makeTask(), result, 'main');
      expect(body).toContain('ralph-starter');
    });
  });
});
