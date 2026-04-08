import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinearSync } from '../linear-sync.js';

const updateTask = vi.fn().mockResolvedValue({
  id: 'uuid-123',
  identifier: 'ENG-42',
  title: 'Test issue',
  url: 'https://linear.app/team/ENG-42',
  status: 'In Progress',
  source: 'linear',
});
const addComment = vi.fn().mockResolvedValue(undefined);

// Mock the LinearIntegration class
vi.mock('../../integrations/linear/source.js', () => ({
  LinearIntegration: class MockLinearIntegration {
    updateTask = updateTask;
    addComment = addComment;
  },
}));

describe('createLinearSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default resolved value
    updateTask.mockResolvedValue({
      id: 'uuid-123',
      identifier: 'ENG-42',
      title: 'Test issue',
      url: 'https://linear.app/team/ENG-42',
      status: 'In Progress',
      source: 'linear',
    });
  });

  it('should move issue to In Progress on creation', async () => {
    const handler = await createLinearSync({ issueId: 'ENG-42', headless: true });

    expect(handler).not.toBeNull();
    expect(updateTask).toHaveBeenCalledWith('ENG-42', { status: 'In Progress' });
  });

  it('should return null if updateTask fails (no auth)', async () => {
    updateTask.mockRejectedValueOnce(new Error('No API key'));

    const handler = await createLinearSync({ issueId: 'ENG-42', headless: true });
    expect(handler).toBeNull();
  });

  it('should move issue to Done on complete event', async () => {
    const handler = await createLinearSync({ issueId: 'ENG-42', headless: true });

    await handler!({
      type: 'complete',
      summary: 'Implemented feature X',
      commits: 3,
      iterations: 5,
      cost: '$0.42',
    });

    expect(updateTask).toHaveBeenCalledWith('ENG-42', { status: 'Done' });
    expect(addComment).toHaveBeenCalledWith(
      'ENG-42',
      expect.stringContaining('Loop completed successfully')
    );
    expect(addComment).toHaveBeenCalledWith('ENG-42', expect.stringContaining('Commits: 3'));
    expect(addComment).toHaveBeenCalledWith('ENG-42', expect.stringContaining('$0.42'));
  });

  it('should move issue to In Review on failed event', async () => {
    const handler = await createLinearSync({ issueId: 'ENG-42', headless: true });

    await handler!({
      type: 'failed',
      error: 'circuit_breaker',
      iterations: 3,
    });

    expect(updateTask).toHaveBeenCalledWith('ENG-42', { status: 'In Review' });
    expect(addComment).toHaveBeenCalledWith('ENG-42', expect.stringContaining('Loop stopped'));
    expect(addComment).toHaveBeenCalledWith('ENG-42', expect.stringContaining('circuit_breaker'));
  });

  it('should not throw on event handler errors', async () => {
    const handler = await createLinearSync({ issueId: 'ENG-42', headless: true });

    // Make the next updateTask call fail
    updateTask.mockRejectedValueOnce(new Error('Network error'));

    // Should not throw
    await expect(
      handler!({ type: 'complete', summary: 'done', commits: 1, iterations: 1 })
    ).resolves.not.toThrow();
  });
});
