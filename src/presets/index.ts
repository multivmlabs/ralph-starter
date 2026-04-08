/**
 * Workflow Presets for Ralph Loop
 * Pre-configured settings for common development scenarios
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PresetConfig {
  name: string;
  description: string;
  maxIterations: number;
  validate: boolean;
  commit: boolean;
  completionPromise?: string;
  promptPrefix?: string;
  rateLimit?: number; // calls per hour
  circuitBreaker?: {
    maxConsecutiveFailures: number;
    maxSameErrorCount: number;
  };
}

export const PRESETS: Record<string, PresetConfig> = {
  // Development presets
  feature: {
    name: 'feature',
    description: 'Standard feature implementation with validation and commits',
    maxIterations: 30,
    validate: true,
    commit: true,
    completionPromise: 'FEATURE_COMPLETE',
    circuitBreaker: {
      maxConsecutiveFailures: 3,
      maxSameErrorCount: 5,
    },
  },

  'feature-minimal': {
    name: 'feature-minimal',
    description: 'Quick feature implementation without validation',
    maxIterations: 20,
    validate: false,
    commit: true,
  },

  'tdd-red-green': {
    name: 'tdd-red-green',
    description: 'Test-driven development: write failing test, then implement',
    maxIterations: 50,
    validate: true,
    commit: true,
    promptPrefix:
      'Follow strict TDD: 1) Write a failing test first, 2) Run tests to confirm failure, 3) Implement minimum code to pass, 4) Refactor if needed. Commit after each green test.',
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxSameErrorCount: 3,
    },
  },

  'spec-driven': {
    name: 'spec-driven',
    description: 'Implementation driven by specification files',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Read the specification files in specs/ directory. Implement according to the requirements. Mark tasks complete in IMPLEMENTATION_PLAN.md as you finish them.',
    completionPromise: '<promise>COMPLETE</promise>',
  },

  refactor: {
    name: 'refactor',
    description: 'Safe refactoring with continuous test validation',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Refactor the code while maintaining all tests passing. Make small, incremental changes. Commit after each successful refactoring step.',
    circuitBreaker: {
      maxConsecutiveFailures: 2,
      maxSameErrorCount: 3,
    },
  },

  // Debugging presets
  debug: {
    name: 'debug',
    description: 'Debugging session without auto-commits',
    maxIterations: 20,
    validate: false,
    commit: false,
    promptPrefix:
      'Debug the issue step by step. Add logging, analyze outputs, identify root cause. Document findings.',
  },

  'incident-response': {
    name: 'incident-response',
    description: 'Quick fix for production incidents',
    maxIterations: 15,
    validate: true,
    commit: true,
    promptPrefix:
      'This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution.',
    circuitBreaker: {
      maxConsecutiveFailures: 2,
      maxSameErrorCount: 2,
    },
  },

  'code-archaeology': {
    name: 'code-archaeology',
    description: 'Investigate and document legacy code',
    maxIterations: 30,
    validate: false,
    commit: false,
    promptPrefix:
      'Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful.',
  },

  // Review presets
  review: {
    name: 'review',
    description: 'Code review and suggestions',
    maxIterations: 10,
    validate: true,
    commit: false,
    promptPrefix:
      'Review the code for: bugs, security issues, performance problems, code quality. Suggest improvements but do not implement.',
  },

  'pr-review': {
    name: 'pr-review',
    description: 'Pull request review',
    maxIterations: 10,
    validate: true,
    commit: false,
    promptPrefix:
      'Review the changes in this PR. Check for: correctness, test coverage, documentation, breaking changes. Provide actionable feedback.',
  },

  'adversarial-review': {
    name: 'adversarial-review',
    description: 'Security-focused adversarial review',
    maxIterations: 15,
    validate: false,
    commit: false,
    promptPrefix:
      'Perform an adversarial security review. Look for: injection vulnerabilities, authentication bypasses, authorization issues, data leaks, OWASP Top 10.',
  },

  // Documentation presets
  docs: {
    name: 'docs',
    description: 'Generate documentation',
    maxIterations: 20,
    validate: false,
    commit: true,
    promptPrefix:
      'Generate comprehensive documentation. Include: API docs, usage examples, architecture overview. Use clear language.',
  },

  'documentation-first': {
    name: 'documentation-first',
    description: 'Write docs before implementation',
    maxIterations: 30,
    validate: false,
    commit: true,
    promptPrefix:
      'Write documentation first, then implement. Document: purpose, API, usage examples, edge cases. Implementation must match documentation.',
  },

  // Specialized presets
  'api-design': {
    name: 'api-design',
    description: 'API design and implementation',
    maxIterations: 35,
    validate: true,
    commit: true,
    promptPrefix:
      'Design and implement the API following REST best practices. Include: proper HTTP methods, status codes, error handling, validation, documentation.',
  },

  'migration-safety': {
    name: 'migration-safety',
    description: 'Safe database/data migrations',
    maxIterations: 25,
    validate: true,
    commit: true,
    promptPrefix:
      'Create safe migrations. Ensure: reversibility, no data loss, backward compatibility, proper testing. Create rollback scripts.',
    circuitBreaker: {
      maxConsecutiveFailures: 1,
      maxSameErrorCount: 2,
    },
  },

  'performance-optimization': {
    name: 'performance-optimization',
    description: 'Performance analysis and optimization',
    maxIterations: 30,
    validate: true,
    commit: true,
    promptPrefix:
      'Analyze and optimize performance. Profile first, identify bottlenecks, make targeted improvements. Document performance gains.',
  },

  'scientific-method': {
    name: 'scientific-method',
    description: 'Hypothesis-driven development',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Follow the scientific method: 1) Observe the problem, 2) Form a hypothesis, 3) Design an experiment (test), 4) Implement and test, 5) Analyze results, 6) Iterate.',
  },

  research: {
    name: 'research',
    description: 'Research and exploration',
    maxIterations: 25,
    validate: false,
    commit: false,
    promptPrefix:
      'Research the topic thoroughly. Explore options, compare alternatives, document findings. Create a summary report.',
  },

  'gap-analysis': {
    name: 'gap-analysis',
    description: 'Compare spec to implementation',
    maxIterations: 20,
    validate: true,
    commit: false,
    promptPrefix:
      'Compare the specification to the current implementation. Identify gaps, missing features, and discrepancies. Create a prioritized TODO list.',
  },
};

/**
 * Load custom presets from .ralph/presets/*.json in the given directory.
 * Each JSON file should match the PresetConfig shape (name is derived from filename if missing).
 */
export function loadCustomPresets(cwd: string): Record<string, PresetConfig> {
  const presetsDir = join(cwd, '.ralph', 'presets');
  if (!existsSync(presetsDir)) {
    return {};
  }

  const custom: Record<string, PresetConfig> = {};

  let files: string[];
  try {
    files = readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
  } catch {
    return {};
  }

  for (const file of files) {
    try {
      const content = readFileSync(join(presetsDir, file), 'utf-8');
      const parsed = JSON.parse(content) as Partial<PresetConfig>;

      // Derive name from filename if not specified
      const name = parsed.name || file.replace(/\.json$/, '');

      // Validate required fields
      if (
        typeof parsed.maxIterations !== 'number' ||
        typeof parsed.validate !== 'boolean' ||
        typeof parsed.commit !== 'boolean'
      ) {
        continue;
      }

      custom[name] = {
        name,
        description: parsed.description || 'Custom preset',
        maxIterations: parsed.maxIterations,
        validate: parsed.validate,
        commit: parsed.commit,
        ...(parsed.completionPromise && { completionPromise: parsed.completionPromise }),
        ...(parsed.promptPrefix && { promptPrefix: parsed.promptPrefix }),
        ...(parsed.rateLimit && { rateLimit: parsed.rateLimit }),
        ...(parsed.circuitBreaker && { circuitBreaker: parsed.circuitBreaker }),
      };
    } catch {
      // Skip invalid JSON files
    }
  }

  return custom;
}

/**
 * Get a preset by name. Checks custom presets (from cwd) first, then built-in presets.
 */
export function getPreset(name: string, cwd?: string): PresetConfig | undefined {
  if (cwd) {
    const custom = loadCustomPresets(cwd);
    if (custom[name]) {
      return custom[name];
    }
  }
  return PRESETS[name];
}

/**
 * Get all available preset names (built-in + custom from cwd).
 */
export function getPresetNames(cwd?: string): string[] {
  const builtIn = Object.keys(PRESETS);
  if (!cwd) {
    return builtIn;
  }
  const custom = Object.keys(loadCustomPresets(cwd));
  // Custom presets after built-in, deduplicated
  return [...new Set([...builtIn, ...custom])];
}

/**
 * Get presets grouped by category
 */
export function getPresetsByCategory(cwd?: string): Record<string, PresetConfig[]> {
  const categories: Record<string, PresetConfig[]> = {
    Development: [
      PRESETS.feature,
      PRESETS['feature-minimal'],
      PRESETS['tdd-red-green'],
      PRESETS['spec-driven'],
      PRESETS.refactor,
    ],
    Debugging: [PRESETS.debug, PRESETS['incident-response'], PRESETS['code-archaeology']],
    Review: [PRESETS.review, PRESETS['pr-review'], PRESETS['adversarial-review']],
    Documentation: [PRESETS.docs, PRESETS['documentation-first']],
    Specialized: [
      PRESETS['api-design'],
      PRESETS['migration-safety'],
      PRESETS['performance-optimization'],
      PRESETS['scientific-method'],
      PRESETS.research,
      PRESETS['gap-analysis'],
    ],
  };

  if (cwd) {
    const custom = loadCustomPresets(cwd);
    const customPresets = Object.values(custom).filter((p) => !PRESETS[p.name]);
    if (customPresets.length > 0) {
      categories.Custom = customPresets;
    }
  }

  return categories;
}

/**
 * Format presets for CLI help
 */
export function formatPresetsHelp(cwd?: string): string {
  const categories = getPresetsByCategory(cwd);
  const lines: string[] = ['Available presets:', ''];

  for (const [category, presets] of Object.entries(categories)) {
    lines.push(`  ${category}:`);
    for (const preset of presets) {
      lines.push(`    ${preset.name.padEnd(22)} ${preset.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
