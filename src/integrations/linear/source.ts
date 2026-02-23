/**
 * Linear Integration Source
 *
 * Fetches issues from Linear using GraphQL API.
 * Supports CLI auth (`linear auth login`) or API key.
 */

import {
  type AuthMethod,
  BaseIntegration,
  type IntegrationOptions,
  type IntegrationResult,
  type TaskCreateInput,
  type TaskReference,
  type TaskUpdateInput,
  type WritableIntegration,
} from '../base.js';

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  description: string | null;
  priority: number;
  priorityLabel: string | null;
  state: {
    name: string;
    type: string;
  } | null;
  labels: {
    nodes: Array<{ name: string }>;
  } | null;
  project: {
    name: string;
  } | null;
  team: {
    name: string;
    key: string;
  } | null;
}

interface LinearResponse {
  data: {
    issues: {
      nodes: LinearIssue[];
    };
  };
  errors?: Array<{ message: string }>;
}

export class LinearIntegration extends BaseIntegration implements WritableIntegration {
  readonly supportsWrite = true as const;
  name = 'linear';
  displayName = 'Linear';
  description = 'Fetch issues from Linear';
  website = 'https://linear.app';

  // Supports CLI auth, API key, and OAuth
  authMethods: AuthMethod[] = ['cli', 'api-key', 'oauth'];

  private readonly API_URL = 'https://api.linear.app/graphql';
  private linearCliAvailable: boolean | null = null;

  /**
   * Check if Linear CLI is available and authenticated
   */
  protected async isCliAvailable(): Promise<boolean> {
    if (this.linearCliAvailable !== null) {
      return this.linearCliAvailable;
    }

    try {
      const { execa } = await import('execa');
      // Check if linear CLI is installed and authenticated
      const result = await execa('linear', ['whoami'], { reject: false });
      this.linearCliAvailable = result.exitCode === 0;
      return this.linearCliAvailable;
    } catch {
      this.linearCliAvailable = false;
      return false;
    }
  }

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    const projectName = options?.project || identifier;
    const authMethod = await this.getConfiguredAuthMethod();

    if (!authMethod) {
      this.error(
        'No authentication configured. Options:\n' +
          '  1. Install Linear CLI: npm install -g @linear/cli && linear auth login\n' +
          '  2. Use API key: ralph-starter config set linear.apiKey <key>'
      );
    }

    // Get API key based on auth method
    let apiKey: string;

    if (authMethod === 'cli') {
      apiKey = await this.getApiKeyFromCli();
    } else {
      apiKey = await this.getApiKey();
    }

    const issues = await this.fetchIssues(apiKey, projectName, options);
    return this.formatIssues(issues, projectName);
  }

  private async getApiKeyFromCli(): Promise<string> {
    try {
      const { execa } = await import('execa');
      // Linear CLI stores token which we can use
      const result = await execa('linear', ['config', 'get', 'apiKey']);
      return result.stdout.trim();
    } catch {
      // Fall back to regular API key
      return this.getApiKey();
    }
  }

  private async fetchIssues(
    apiKey: string,
    projectName: string,
    options?: IntegrationOptions
  ): Promise<LinearIssue[]> {
    const limit = options?.limit || 50;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (projectName && projectName !== 'all') {
      filter.or = [
        { project: { name: { containsIgnoreCase: projectName } } },
        { team: { name: { containsIgnoreCase: projectName } } },
        { team: { key: { eq: projectName.toUpperCase() } } },
      ];
    }

    if (options?.label) {
      filter.labels = { name: { containsIgnoreCase: options.label } };
    }

    if (options?.status) {
      filter.state = { name: { containsIgnoreCase: options.status } };
    } else {
      // Default to non-completed issues
      filter.completedAt = { null: true };
    }

    const query = `
      query GetIssues($filter: IssueFilter, $first: Int) {
        issues(filter: $filter, first: $first, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            url
            description
            priority
            priorityLabel
            state {
              name
              type
            }
            labels {
              nodes {
                name
              }
            }
            project {
              name
            }
            team {
              name
              key
            }
          }
        }
      }
    `;

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query,
        variables: {
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: limit,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error('Invalid Linear API key. Run: ralph-starter config set linear.apiKey <key>');
      }
      this.error(`Linear API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LinearResponse;

    if (data.errors) {
      this.error(`Linear API error: ${data.errors[0].message}`);
    }

    return data.data.issues.nodes;
  }

  private formatIssues(issues: LinearIssue[], projectName: string): IntegrationResult {
    const title = projectName === 'all' ? 'All Issues' : `${projectName} Issues`;

    if (issues.length === 0) {
      return {
        content: `# ${title}\n\nNo issues found.`,
        source: `linear:${projectName}`,
        title,
        metadata: { type: 'linear', issues: 0 },
      };
    }

    const sections: string[] = [`# ${title}\n`];

    // Group by priority
    const priorityOrder = ['Urgent', 'High', 'Medium', 'Low', 'No priority'];
    const byPriority: Record<string, LinearIssue[]> = {};

    for (const issue of issues) {
      const priority = issue.priorityLabel || 'No priority';
      if (!byPriority[priority]) {
        byPriority[priority] = [];
      }
      byPriority[priority].push(issue);
    }

    const priorityEmoji: Record<string, string> = {
      Urgent: '🔴',
      High: '🟠',
      Medium: '🟡',
      Low: '🔵',
      'No priority': '⚪',
    };

    for (const priority of priorityOrder) {
      const priorityIssues = byPriority[priority];
      if (!priorityIssues || priorityIssues.length === 0) continue;

      sections.push(`\n## ${priorityEmoji[priority] || '⚪'} ${priority}\n`);

      for (const issue of priorityIssues) {
        sections.push(`### ${issue.identifier}: ${issue.title}`);

        const meta: string[] = [];
        if (issue.state?.name) {
          meta.push(`Status: ${issue.state.name}`);
        }
        if (issue.team?.name) {
          meta.push(`Team: ${issue.team.name}`);
        }
        if (issue.project?.name) {
          meta.push(`Project: ${issue.project.name}`);
        }

        const labels = issue.labels?.nodes?.map((l) => l.name).filter(Boolean);
        if (labels && labels.length > 0) {
          meta.push(`Labels: ${labels.join(', ')}`);
        }

        if (meta.length > 0) {
          sections.push(`*${meta.join(' | ')}*`);
        }

        sections.push('');

        if (issue.description) {
          sections.push(issue.description);
        } else {
          sections.push('*No description*');
        }

        sections.push('');
      }
    }

    return {
      content: sections.join('\n'),
      source: `linear:${projectName}`,
      title,
      metadata: {
        type: 'linear',
        project: projectName,
        issues: issues.length,
      },
    };
  }

  // ============================================
  // WritableIntegration methods
  // ============================================

  private async getAuthKey(): Promise<string> {
    const authMethod = await this.getConfiguredAuthMethod();
    if (authMethod === 'cli') {
      return this.getApiKeyFromCli();
    }
    return this.getApiKey();
  }

  private async graphqlMutation(
    apiKey: string,
    query: string,
    variables: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      this.error(`Linear API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      data: Record<string, unknown>;
      errors?: Array<{ message: string }>;
    };
    if (data.errors) {
      this.error(`Linear API error: ${data.errors[0].message}`);
    }
    return data.data;
  }

  async listTasks(options?: IntegrationOptions): Promise<TaskReference[]> {
    const apiKey = await this.getAuthKey();
    const projectName = options?.project || 'all';
    const issues = await this.fetchIssues(apiKey, projectName, options);

    return issues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      status: issue.state?.name || 'Unknown',
      source: 'linear' as const,
      priority: issue.priority,
      labels: issue.labels?.nodes?.map((l) => l.name),
    }));
  }

  async createTask(input: TaskCreateInput, options?: IntegrationOptions): Promise<TaskReference> {
    const apiKey = await this.getAuthKey();

    // First, resolve team ID from project name
    const teamId = await this.resolveTeamId(apiKey, input.project || options?.project);

    const mutationInput: Record<string, unknown> = {
      title: input.title,
      teamId,
    };

    if (input.description) mutationInput.description = input.description;
    if (input.priority) mutationInput.priority = input.priority;

    // Resolve label IDs if provided
    if (input.labels && input.labels.length > 0) {
      const labelIds = await this.resolveLabelIds(apiKey, teamId, input.labels);
      if (labelIds.length > 0) mutationInput.labelIds = labelIds;
    }

    // Resolve assignee ID if provided
    if (input.assignee) {
      mutationInput.assigneeId = await this.resolveAssigneeId(apiKey, input.assignee);
    }

    const query = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
            state { name }
            priority
          }
        }
      }
    `;

    const data = await this.graphqlMutation(apiKey, query, { input: mutationInput });
    const result = data.issueCreate as {
      success: boolean;
      issue: {
        id: string;
        identifier: string;
        title: string;
        url: string;
        state: { name: string };
        priority: number;
      };
    };

    if (!result.success) {
      this.error('Failed to create Linear issue');
    }

    return {
      id: result.issue.id,
      identifier: result.issue.identifier,
      title: result.issue.title,
      url: result.issue.url,
      status: result.issue.state.name,
      source: 'linear',
      priority: result.issue.priority,
      labels: input.labels,
    };
  }

  async updateTask(
    id: string,
    input: TaskUpdateInput,
    options?: IntegrationOptions
  ): Promise<TaskReference> {
    const apiKey = await this.getAuthKey();

    // Resolve the issue ID — could be identifier (RAL-42) or UUID
    const issueId = await this.resolveIssueId(apiKey, id);

    const updateInput: Record<string, unknown> = {};

    if (input.status) {
      const stateId = await this.resolveStateId(apiKey, issueId, input.status);
      if (stateId) updateInput.stateId = stateId;
    }

    if (input.priority !== undefined) {
      updateInput.priority = input.priority;
    }

    if (input.assignee) {
      updateInput.assigneeId = await this.resolveAssigneeId(apiKey, input.assignee);
    }

    if (Object.keys(updateInput).length > 0) {
      const query = `
        mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
            issue {
              id
              identifier
              title
              url
              state { name }
              priority
            }
          }
        }
      `;

      await this.graphqlMutation(apiKey, query, { id: issueId, input: updateInput });
    }

    if (input.comment) {
      await this.addComment(id, input.comment, options);
    }

    // Fetch updated issue
    return await this.getIssueRef(apiKey, issueId);
  }

  async closeTask(id: string, comment?: string, options?: IntegrationOptions): Promise<void> {
    const apiKey = await this.getAuthKey();
    const issueId = await this.resolveIssueId(apiKey, id);

    // Find the "Done" state for this issue's team
    const doneStateId = await this.resolveStateId(apiKey, issueId, 'Done');
    if (doneStateId) {
      const query = `
        mutation CloseIssue($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) { success }
        }
      `;
      await this.graphqlMutation(apiKey, query, { id: issueId, input: { stateId: doneStateId } });
    }

    if (comment) {
      await this.addComment(id, comment, options);
    }
  }

  async addComment(id: string, body: string, _options?: IntegrationOptions): Promise<void> {
    const apiKey = await this.getAuthKey();
    const issueId = await this.resolveIssueId(apiKey, id);

    const query = `
      mutation AddComment($input: CommentCreateInput!) {
        commentCreate(input: $input) { success }
      }
    `;

    await this.graphqlMutation(apiKey, query, { input: { issueId, body } });
  }

  // ============================================
  // Helper resolvers for Linear GraphQL
  // ============================================

  private async resolveTeamId(apiKey: string, projectOrTeam?: string): Promise<string> {
    const query = `
      query GetTeams {
        teams { nodes { id name key } }
      }
    `;
    const data = await this.graphqlMutation(apiKey, query, {});
    const teams = (data.teams as { nodes: Array<{ id: string; name: string; key: string }> }).nodes;

    if (teams.length === 0) {
      this.error('No teams found in your Linear workspace');
    }

    if (projectOrTeam) {
      const match = teams.find(
        (t) =>
          t.name.toLowerCase() === projectOrTeam.toLowerCase() ||
          t.key.toLowerCase() === projectOrTeam.toLowerCase()
      );
      if (match) return match.id;
    }

    // Default to first team
    return teams[0].id;
  }

  private async resolveLabelIds(
    apiKey: string,
    teamId: string,
    labels: string[]
  ): Promise<string[]> {
    const query = `
      query GetLabels($teamId: ID!) {
        team(id: $teamId) {
          labels { nodes { id name } }
        }
      }
    `;
    const data = await this.graphqlMutation(apiKey, query, { teamId });
    const existingLabels = (data.team as { labels: { nodes: Array<{ id: string; name: string }> } })
      .labels.nodes;

    return labels
      .map((name) => existingLabels.find((l) => l.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is string => !!id);
  }

  private async resolveIssueId(apiKey: string, idOrIdentifier: string): Promise<string> {
    // Linear's issue(id:) accepts both UUIDs and identifiers (e.g., "ENG-42")
    // Verify the issue exists and return its UUID
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) { id }
      }
    `;
    try {
      const data = await this.graphqlMutation(apiKey, query, { id: idOrIdentifier });
      return (data.issue as { id: string }).id;
    } catch {
      this.error(`Linear issue not found: ${idOrIdentifier}`);
    }
  }

  private async resolveStateId(
    apiKey: string,
    issueId: string,
    stateName: string
  ): Promise<string | null> {
    const query = `
      query GetIssueTeam($id: String!) {
        issue(id: $id) {
          team {
            states { nodes { id name type } }
          }
        }
      }
    `;
    const data = await this.graphqlMutation(apiKey, query, { id: issueId });
    const states = (
      data.issue as {
        team: { states: { nodes: Array<{ id: string; name: string; type: string }> } };
      }
    ).team.states.nodes;

    const match = states.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
    if (match) return match.id;

    // Try matching by type (e.g., "completed" type for "Done")
    if (stateName.toLowerCase() === 'done') {
      const completed = states.find((s) => s.type === 'completed');
      if (completed) return completed.id;
    }

    return null;
  }

  private async resolveAssigneeId(apiKey: string, assigneeName: string): Promise<string> {
    const query = `
      query GetUsers {
        users { nodes { id name displayName email active } }
      }
    `;
    const data = await this.graphqlMutation(apiKey, query, {});
    const users = (
      data.users as {
        nodes: Array<{
          id: string;
          name: string;
          displayName: string;
          email: string;
          active: boolean;
        }>;
      }
    ).nodes.filter((u) => u.active);

    const needle = assigneeName.toLowerCase();

    // Exact match: name, displayName, or email prefix
    const exact = users.find(
      (u) =>
        u.name.toLowerCase() === needle ||
        u.displayName.toLowerCase() === needle ||
        u.email.toLowerCase().split('@')[0] === needle
    );
    if (exact) return exact.id;

    // Partial match: contains
    const partial = users.find(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.displayName.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle)
    );
    if (partial) return partial.id;

    const available = users.map((u) => u.displayName || u.name).join(', ');
    this.error(`No Linear user matching "${assigneeName}". Available members: ${available}`);
  }

  private async getIssueRef(apiKey: string, issueId: string): Promise<TaskReference> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id identifier title url
          state { name }
          priority
          labels { nodes { name } }
        }
      }
    `;
    const data = await this.graphqlMutation(apiKey, query, { id: issueId });
    const issue = data.issue as {
      id: string;
      identifier: string;
      title: string;
      url: string;
      state: { name: string };
      priority: number;
      labels: { nodes: Array<{ name: string }> };
    };

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      status: issue.state.name,
      source: 'linear',
      priority: issue.priority,
      labels: issue.labels.nodes.map((l) => l.name),
    };
  }

  getHelp(): string {
    return `
linear: Fetch issues from Linear

Usage:
  ralph-starter run --from linear --project "My Project"
  ralph-starter run --from linear --project TEAM-KEY --label "feature"

Options:
  --project  Project name, team name, or team key (e.g., ENG)
  --label    Filter by label name
  --status   Filter by status name (e.g., "In Progress", "Todo")
  --limit    Maximum issues to fetch (default: 50)

Authentication:

Option 1: Linear CLI (recommended)
  1. Install: npm install -g @linear/cli
  2. Login: linear auth login

Option 2: API Key
  1. Get API key from: https://linear.app/settings/api
  2. Run: ralph-starter config set linear.apiKey <key>

Examples:
  ralph-starter run --from linear --project "Mobile App"
  ralph-starter run --from linear --project ENG --label "bug"
  ralph-starter run --from linear --project all --status "In Progress"
`.trim();
  }
}
