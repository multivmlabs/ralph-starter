import { describe, expect, it } from 'vitest';
import { formatValidationResult, validateSpec } from '../spec-validator.js';

describe('validateSpec', () => {
  it('should score a complete spec highly', () => {
    const spec = `
# My Feature

## Proposal
We need this feature because users have requested it.

## Design
The implementation will use a new service layer with dependency injection.

## Tasks
- [ ] Create the service class
- [ ] Add routes
- [ ] Write tests

## Acceptance Criteria
Given: A user is logged in
When: They click the dashboard button
Then: The dashboard loads within 2 seconds

The service SHALL handle concurrent requests.
The API MUST return 200 on success.
    `.trim();

    const result = validateSpec(spec);
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.warnings.filter((w) => w.level === 'error')).toHaveLength(0);
  });

  it('should score a minimal spec low', () => {
    const result = validateSpec('Fix the bug.');
    expect(result.valid).toBe(false);
    expect(result.score).toBeLessThan(40);
    expect(result.warnings.some((w) => w.level === 'error')).toBe(true);
  });

  it('should detect RFC 2119 keywords', () => {
    const spec = `
# Feature

## Proposal
This is needed.

The system SHALL process requests within 100ms.
The API MUST validate input.
The UI SHOULD show loading state.
    `.trim();

    const result = validateSpec(spec);
    expect(result.score).toBeGreaterThanOrEqual(45);
  });

  it('should detect Given/When/Then criteria', () => {
    const spec = `
# Feature

## Proposal
We need this feature.

Given: The user has an account
When: They submit the form
Then: A confirmation email is sent
    `.trim();

    const result = validateSpec(spec);
    expect(result.warnings.find((w) => w.message.includes('acceptance criteria'))).toBeUndefined();
  });

  it('should detect task checklists', () => {
    const spec = `
# Feature

## Proposal
Adding authentication.

- [ ] Create auth middleware
- [ ] Add login endpoint
- [x] Set up database schema
    `.trim();

    const result = validateSpec(spec);
    expect(result.warnings.find((w) => w.message.includes('tasks'))).toBeUndefined();
  });

  it('should warn about missing design section', () => {
    const result = validateSpec(
      '# Feature\n\n## Proposal\nJust a proposal with enough text to not be too short.'
    );
    expect(result.warnings.some((w) => w.message.includes('design'))).toBe(true);
  });

  it('should handle empty content', () => {
    const result = validateSpec('');
    expect(result.valid).toBe(false);
    expect(result.score).toBe(0);
  });
});

describe('formatValidationResult', () => {
  it('should format passing result', () => {
    const output = formatValidationResult({ valid: true, score: 85, warnings: [] });
    expect(output).toContain('PASS');
    expect(output).toContain('85/100');
    expect(output).toContain('No issues found');
  });

  it('should format failing result with warnings', () => {
    const output = formatValidationResult({
      valid: false,
      score: 20,
      warnings: [
        { level: 'error', message: 'Low completeness' },
        { level: 'warning', message: 'Missing proposal' },
      ],
    });
    expect(output).toContain('FAIL');
    expect(output).toContain('[ERROR]');
    expect(output).toContain('[WARN]');
  });
});
