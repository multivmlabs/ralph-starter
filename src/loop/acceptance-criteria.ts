/**
 * Acceptance Criteria Extractor
 *
 * Extracts or generates Given/When/Then acceptance criteria from task descriptions.
 * Injected into the agent prompt so it writes tests matching the criteria.
 */

export type AcceptanceCriterion = {
  given: string;
  when: string;
  expected: string;
};

export type AcceptanceCriteria = {
  criteria: AcceptanceCriterion[];
  raw: string;
};

/**
 * Extract acceptance criteria from a task description.
 *
 * Supports two modes:
 * 1. **Explicit**: If the task already contains Given/When/Then blocks, extract them
 * 2. **Generated**: If no explicit criteria, generate a structured prompt asking
 *    the agent to define and follow acceptance criteria
 */
export function extractAcceptanceCriteria(task: string): AcceptanceCriteria {
  const criteria: AcceptanceCriterion[] = [];

  // Try to extract explicit Given/When/Then blocks
  const gwt = /given\s*:\s*([^\n]+)\n\s*when\s*:\s*([^\n]+)\n\s*then\s*:\s*([^\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = gwt.exec(task)) !== null) {
    criteria.push({
      given: match[1].trim(),
      when: match[2].trim(),
      expected: match[3].trim(),
    });
  }

  if (criteria.length > 0) {
    return { criteria, raw: formatCriteria(criteria) };
  }

  // No explicit criteria found — return a prompt that asks the agent to generate them
  return {
    criteria: [],
    raw: formatGeneratedPrompt(task),
  };
}

/**
 * Format extracted criteria into a markdown prompt section.
 */
function formatCriteria(criteria: AcceptanceCriterion[]): string {
  const lines = ['## Acceptance Criteria\n'];
  lines.push('Write tests that verify each of the following criteria:\n');

  for (let i = 0; i < criteria.length; i++) {
    lines.push(`### Criterion ${i + 1}`);
    lines.push(`- **Given** ${criteria[i].given}`);
    lines.push(`- **When** ${criteria[i].when}`);
    lines.push(`- **Then** ${criteria[i].expected}`);
    lines.push('');
  }

  lines.push('Each criterion MUST have a corresponding test case.');
  lines.push('Mark each criterion as verified in a comment when the test passes.');

  return lines.join('\n');
}

/**
 * Generate a structured prompt for the agent to create its own acceptance criteria.
 */
function formatGeneratedPrompt(task: string): string {
  // Extract key verbs/actions from the task for hints
  const taskLower = task.toLowerCase();
  const isAddFeature =
    taskLower.includes('add') || taskLower.includes('create') || taskLower.includes('implement');
  const isFix =
    taskLower.includes('fix') || taskLower.includes('bug') || taskLower.includes('resolve');
  const isRefactor =
    taskLower.includes('refactor') ||
    taskLower.includes('improve') ||
    taskLower.includes('optimize');

  const lines = ['## Acceptance Criteria (Auto-Generated)\n'];
  lines.push(
    'Before writing any code, define acceptance criteria in Given/When/Then format for this task.'
  );
  lines.push('Write these criteria as test cases FIRST, then implement to make them pass.\n');

  if (isAddFeature) {
    lines.push('Focus your criteria on:');
    lines.push('- Happy path: the feature works as expected');
    lines.push('- Edge cases: invalid input, empty state, boundary conditions');
    lines.push('- Integration: the feature works with existing code');
  } else if (isFix) {
    lines.push('Focus your criteria on:');
    lines.push('- The bug is fixed: the original failing case now passes');
    lines.push('- No regression: related functionality still works');
    lines.push('- Root cause: the fix addresses the underlying issue, not just symptoms');
  } else if (isRefactor) {
    lines.push('Focus your criteria on:');
    lines.push('- Behavior preservation: all existing tests still pass');
    lines.push('- Measurable improvement: the refactor achieves its stated goal');
    lines.push('- No side effects: unrelated functionality is unchanged');
  }

  lines.push('');
  lines.push('Format each criterion as:');
  lines.push('```');
  lines.push('Given: [initial state/context]');
  lines.push('When: [action/trigger]');
  lines.push('Then: [expected outcome]');
  lines.push('```');

  return lines.join('\n');
}
