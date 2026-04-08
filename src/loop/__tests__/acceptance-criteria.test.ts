import { describe, expect, it } from 'vitest';
import { extractAcceptanceCriteria } from '../acceptance-criteria.js';

describe('extractAcceptanceCriteria', () => {
  it('should extract explicit Given/When/Then criteria', () => {
    const task = `
      Add user login
      Given: a user with valid credentials
      When: they submit the login form
      Then: they are redirected to the dashboard
    `;

    const result = extractAcceptanceCriteria(task);
    expect(result.criteria).toHaveLength(1);
    expect(result.criteria[0].given).toBe('a user with valid credentials');
    expect(result.criteria[0].when).toBe('they submit the login form');
    expect(result.criteria[0].expected).toBe('they are redirected to the dashboard');
    expect(result.raw).toContain('Acceptance Criteria');
    expect(result.raw).toContain('Criterion 1');
  });

  it('should extract multiple criteria', () => {
    const task = `
      Given: an empty cart
      When: user adds an item
      Then: cart count shows 1

      Given: a cart with items
      When: user clicks checkout
      Then: payment form is displayed
    `;

    const result = extractAcceptanceCriteria(task);
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].given).toContain('empty cart');
    expect(result.criteria[1].when).toContain('checkout');
  });

  it('should generate prompt for add/create tasks without explicit criteria', () => {
    const task = 'Add user authentication with email/password';
    const result = extractAcceptanceCriteria(task);

    expect(result.criteria).toHaveLength(0);
    expect(result.raw).toContain('Auto-Generated');
    expect(result.raw).toContain('Happy path');
    expect(result.raw).toContain('Edge cases');
  });

  it('should generate prompt for fix/bug tasks', () => {
    const task = 'Fix the login timeout bug';
    const result = extractAcceptanceCriteria(task);

    expect(result.criteria).toHaveLength(0);
    expect(result.raw).toContain('bug is fixed');
    expect(result.raw).toContain('No regression');
  });

  it('should generate prompt for refactor tasks', () => {
    const task = 'Refactor the auth module for better performance';
    const result = extractAcceptanceCriteria(task);

    expect(result.criteria).toHaveLength(0);
    expect(result.raw).toContain('Behavior preservation');
    expect(result.raw).toContain('Measurable improvement');
  });

  it('should generate generic prompt for unknown task types', () => {
    const task = 'Update the README';
    const result = extractAcceptanceCriteria(task);

    expect(result.criteria).toHaveLength(0);
    expect(result.raw).toContain('Given/When/Then');
  });
});
