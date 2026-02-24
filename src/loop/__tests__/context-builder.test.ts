import { describe, expect, it } from 'vitest';
import {
  buildIterationContext,
  buildTrimmedPlanContext,
  type ContextBuildOptions,
  compressValidationFeedback,
} from '../context-builder.js';
import type { PlanTask, TaskCount } from '../task-counter.js';

/** Helper to create minimal ContextBuildOptions */
function makeOpts(overrides: Partial<ContextBuildOptions> = {}): ContextBuildOptions {
  return {
    fullTask: 'Build a landing page',
    taskWithSkills: 'Build a landing page\n\n## Skills\n- frontend-design',
    currentTask: null,
    taskInfo: { total: 0, completed: 0, pending: 0, tasks: [] },
    iteration: 1,
    maxIterations: 10,
    ...overrides,
  };
}

const sampleTask: PlanTask = {
  name: 'Implement hero section',
  completed: false,
  index: 2,
  subtasks: [
    { name: 'Create header component', completed: false },
    { name: 'Add CTA button', completed: false },
  ],
};

const sampleTaskInfo: TaskCount = { total: 5, completed: 2, pending: 3, tasks: [sampleTask] };

describe('context-builder', () => {
  describe('buildIterationContext', () => {
    it('should include preamble with iteration info', () => {
      const result = buildIterationContext(makeOpts({ iteration: 3, maxIterations: 20 }));
      expect(result.prompt).toContain('iteration 3/20');
    });

    it('should include Tailwind v4 @theme inline guidance in preamble', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('@theme inline');
      expect(result.prompt).toContain('@import "tailwindcss"');
      expect(result.prompt).toContain('@tailwindcss/vite');
    });

    it('should include Vite-specific Tailwind guidance', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('@tailwindcss/vite');
      expect(result.prompt).toContain('@tailwindcss/postcss');
    });

    it('should include tw-animate-css guidance', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('tw-animate-css');
      expect(result.prompt).toContain('NOT `tailwindcss-animate`');
    });

    it('should include full task on iteration 1 with structured tasks', () => {
      const result = buildIterationContext(
        makeOpts({
          currentTask: sampleTask,
          taskInfo: sampleTaskInfo,
          iteration: 1,
        })
      );
      expect(result.prompt).toContain('Build a landing page');
      expect(result.prompt).toContain('Implement hero section');
      expect(result.prompt).toContain('Create header component');
      expect(result.prompt).toContain('Add CTA button');
      expect(result.wasTrimmed).toBe(false);
    });

    it('should use abbreviated spec summary on iterations 2-3', () => {
      const result = buildIterationContext(
        makeOpts({
          currentTask: sampleTask,
          taskInfo: sampleTaskInfo,
          iteration: 2,
          specSummary: 'Hero section with blue background and white text',
        })
      );
      expect(result.prompt).toContain('Spec Summary');
      expect(result.prompt).toContain('Hero section with blue background');
      expect(result.wasTrimmed).toBe(true);
    });

    it('should use minimal context on iteration 4+', () => {
      const result = buildIterationContext(
        makeOpts({
          currentTask: sampleTask,
          taskInfo: sampleTaskInfo,
          iteration: 5,
          specSummary: 'Hero section with blue background and white text',
        })
      );
      expect(result.prompt).toContain('Spec key points');
      expect(result.wasTrimmed).toBe(true);
      // Should NOT contain full task content on iteration 5
      expect(result.debugInfo).toContain('mode=minimal');
    });

    it('should replace plan rules with fix-mode text when skipPlanInstructions is true', () => {
      const result = buildIterationContext(
        makeOpts({
          skipPlanInstructions: true,
        })
      );
      expect(result.prompt).toContain('fix/review pass');
      expect(result.prompt).not.toContain('Study IMPLEMENTATION_PLAN.md');
    });

    it('should include plan rules by default', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('IMPLEMENTATION_PLAN.md');
      expect(result.prompt).toContain('Study specs/ directory');
    });

    it('should include design quality guidelines', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('Design quality');
      expect(result.prompt).toContain('design specification, follow it EXACTLY');
    });

    it('should include JSX gotcha', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.prompt).toContain('JSX: Never put unescaped quotes');
    });

    it('should include validation feedback when provided', () => {
      const result = buildIterationContext(
        makeOpts({
          validationFeedback: '### lint\nError: missing semicolon on line 42',
        })
      );
      expect(result.prompt).toContain('missing semicolon');
    });

    it('should include iteration log on iteration 2+', () => {
      const result = buildIterationContext(
        makeOpts({
          iteration: 3,
          currentTask: sampleTask,
          taskInfo: sampleTaskInfo,
          iterationLog: 'Iter 1: Created project scaffold\nIter 2: Added hero section',
        })
      );
      expect(result.prompt).toContain('Previous Iterations');
      expect(result.prompt).toContain('Created project scaffold');
    });

    it('should not include iteration log on iteration 1', () => {
      const result = buildIterationContext(
        makeOpts({
          iteration: 1,
          currentTask: sampleTask,
          taskInfo: sampleTaskInfo,
          iterationLog: 'Should not appear',
        })
      );
      expect(result.prompt).not.toContain('Should not appear');
    });

    it('should return estimated tokens', () => {
      const result = buildIterationContext(makeOpts());
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });
  });

  describe('compressValidationFeedback', () => {
    it('should return empty string for empty feedback', () => {
      expect(compressValidationFeedback('')).toBe('');
    });

    it('should return feedback unchanged if under maxChars', () => {
      const short = 'Error on line 5';
      expect(compressValidationFeedback(short)).toBe(short);
    });

    it('should truncate long feedback to maxChars', () => {
      const long = `### lint\n${'x'.repeat(3000)}`;
      const result = compressValidationFeedback(long, 500);
      expect(result.length).toBeLessThan(600); // some overhead for headers
    });

    it('should preserve section headers', () => {
      const feedback = `### lint\nError: foo\n### test\nError: bar\n### build\nError: baz`;
      const result = compressValidationFeedback(feedback, 200);
      expect(result).toContain('### lint');
    });

    it('should add omission message for skipped sections when budget is tight', () => {
      // Content must fit within first section (under maxChars - 50) to push currentLength
      // past maxChars - 100, triggering omission on the next ### header
      const feedback = `### lint\n${'x'.repeat(120)}\n### test\n${'y'.repeat(120)}\n### build\n${'z'.repeat(120)}`;
      const result = compressValidationFeedback(feedback, 250);
      expect(result).toContain('### lint');
      expect(result).toContain('more failing section(s) omitted');
    });

    it('should strip ANSI escape codes', () => {
      const withAnsi = '\x1b[31mError\x1b[0m: something failed';
      const result = compressValidationFeedback(withAnsi);
      expect(result).not.toContain('\x1b[');
      expect(result).toContain('Error: something failed');
    });
  });

  describe('buildTrimmedPlanContext', () => {
    it('should include current task info', () => {
      const result = buildTrimmedPlanContext(sampleTask, sampleTaskInfo);
      expect(result).toContain('Implement hero section');
      expect(result).toContain('3/5');
    });

    it('should include subtask list', () => {
      const result = buildTrimmedPlanContext(sampleTask, sampleTaskInfo);
      expect(result).toContain('Create header component');
      expect(result).toContain('Add CTA button');
    });

    it('should show completed and pending counts', () => {
      const result = buildTrimmedPlanContext(sampleTask, {
        total: 10,
        completed: 4,
        pending: 6,
        tasks: [sampleTask],
      });
      expect(result).toContain('4 task(s) already completed');
      expect(result).toContain('5 more task(s) remaining');
    });
  });
});
