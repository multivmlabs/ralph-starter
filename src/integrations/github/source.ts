/**
 * GitHub Integration Source
 *
 * Fetches issues from GitHub repositories.
 * Uses the `gh` CLI for authentication (if available) or falls back to API token.
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

interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: string;
  labels?: Array<string | { name: string }>;
}

export class GitHubIntegration extends BaseIntegration implements WritableIntegration {
  readonly supportsWrite = true as const;
  name = 'github';
  displayName = 'GitHub';
  description = 'Fetch issues from GitHub repositories';
  website = 'https://github.com';

  // CLI is preferred, API token is fallback
  authMethods: AuthMethod[] = ['cli', 'api-key'];

  private ghCliAvailable: boolean | null = null;

  /**
   * Check if gh CLI is available and authenticated
   */
  protected async isCliAvailable(): Promise<boolean> {
    if (this.ghCliAvailable !== null) {
      return this.ghCliAvailable;
    }

    try {
      const { execa } = await import('execa');
      await execa('gh', ['auth', 'status']);
      this.ghCliAvailable = true;
      return true;
    } catch {
      this.ghCliAvailable = false;
      return false;
    }
  }

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);

    // Prefer CLI if available
    if (await this.isCliAvailable()) {
      return this.fetchViaCli(owner, repo, options);
    }

    return this.fetchViaApi(owner, repo, options);
  }

  private parseRepoIdentifier(identifier: string): { owner: string; repo: string } {
    // Handle full GitHub URLs
    if (identifier.includes('github.com')) {
      const match = identifier.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
    }

    // Handle owner/repo format
    if (identifier.includes('/')) {
      const [owner, repo] = identifier.split('/');
      return { owner, repo };
    }

    this.error(`Invalid repository format: ${identifier}. Use owner/repo or GitHub URL.`);
  }

  private async fetchViaCli(
    owner: string,
    repo: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const { execa } = await import('execa');

    // Use search API so is:issue excludes PRs server-side before sort and per_page limit
    const qualifiers = [`repo:${owner}/${repo}`, 'is:issue', `state:${options?.status || 'open'}`];
    if (options?.label) {
      qualifiers.push(`label:"${options.label}"`);
    }

    const params = new URLSearchParams();
    params.set('q', qualifiers.join(' '));
    params.set('sort', 'created');
    params.set('order', 'asc');
    params.set('per_page', String(options?.limit || 20));

    const endpoint = `search/issues?${params.toString()}`;
    const result = await execa('gh', ['api', endpoint]);
    const response = JSON.parse(result.stdout) as { items: GitHubIssue[] };

    return this.formatIssues(response.items, owner, repo);
  }

  private async fetchViaApi(
    owner: string,
    repo: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    // Use search API so is:issue excludes PRs server-side before sort and per_page limit
    const qualifiers = [`repo:${owner}/${repo}`, 'is:issue', `state:${options?.status || 'open'}`];
    if (options?.label) {
      qualifiers.push(`label:"${options.label}"`);
    }

    const params = new URLSearchParams();
    params.set('q', qualifiers.join(' '));
    params.set('sort', 'created');
    params.set('order', 'asc');
    params.set('per_page', String(options?.limit || 20));

    const url = `https://api.github.com/search/issues?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ralph-starter/0.1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error('Invalid GitHub token. Run: ralph-starter config set github.token <value>');
      }
      this.error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { items: GitHubIssue[] };
    return this.formatIssues(data.items, owner, repo);
  }

  private formatIssues(issues: GitHubIssue[], owner: string, repo: string): IntegrationResult {
    if (issues.length === 0) {
      return {
        content: `# ${owner}/${repo}\n\nNo issues found matching the criteria.`,
        source: `github:${owner}/${repo}`,
        title: `${owner}/${repo} Issues`,
        metadata: { type: 'github', issues: 0 },
      };
    }

    const sections: string[] = [`# ${owner}/${repo} Issues\n`];

    for (const issue of issues) {
      const labels = issue.labels
        ?.map((l) => (typeof l === 'string' ? l : l.name))
        .filter(Boolean)
        .join(', ');

      sections.push(`## #${issue.number}: ${issue.title}`);

      if (labels) {
        sections.push(`*Labels: ${labels}*`);
      }

      sections.push('');

      if (issue.body) {
        sections.push(issue.body);
      } else {
        sections.push('*No description provided*');
      }

      sections.push('\n---\n');
    }

    return {
      content: sections.join('\n'),
      source: `github:${owner}/${repo}`,
      title: `${owner}/${repo} Issues`,
      metadata: {
        type: 'github',
        owner,
        repo,
        issues: issues.length,
      },
    };
  }

  // ============================================
  // WritableIntegration methods
  // ============================================

  async listTasks(options?: IntegrationOptions): Promise<TaskReference[]> {
    const project = options?.project;
    if (!project) {
      this.error('Project (owner/repo) is required for listing GitHub tasks');
    }

    const { execa } = await import('execa');
    const args = [
      'issue',
      'list',
      '-R',
      project,
      '--json',
      'number,title,state,url,labels',
      '--state',
      options?.status || 'open',
      '--limit',
      String(options?.limit || 50),
    ];
    if (options?.label) args.push('--label', options.label);

    const result = await execa('gh', args);
    const issues = JSON.parse(result.stdout) as Array<{
      number: number;
      title: string;
      state: string;
      url: string;
      labels?: Array<{ name: string }>;
    }>;

    return issues.map((issue) => ({
      id: String(issue.number),
      identifier: `#${issue.number}`,
      title: issue.title,
      url: issue.url,
      status: issue.state,
      source: 'github' as const,
      labels: issue.labels?.map((l) => l.name),
    }));
  }

  async createTask(input: TaskCreateInput, options?: IntegrationOptions): Promise<TaskReference> {
    const project = input.project || options?.project;
    if (!project) {
      this.error('Project (owner/repo) is required for creating GitHub issues');
    }

    const { execa } = await import('execa');
    const args = ['issue', 'create', '-R', project, '--title', input.title];

    if (input.description) args.push('--body', input.description);
    if (input.labels && input.labels.length > 0) {
      args.push('--label', input.labels.join(','));
    }
    if (input.assignee) args.push('--assignee', input.assignee);

    const result = await execa('gh', args);
    // gh issue create outputs the URL of the new issue
    const url = result.stdout.trim();
    const numberMatch = url.match(/\/issues\/(\d+)$/);
    const number = numberMatch ? numberMatch[1] : '0';

    return {
      id: number,
      identifier: `#${number}`,
      title: input.title,
      url,
      status: 'open',
      source: 'github',
      labels: input.labels,
    };
  }

  async updateTask(
    id: string,
    input: TaskUpdateInput,
    options?: IntegrationOptions
  ): Promise<TaskReference> {
    const project = options?.project;
    if (!project) {
      this.error('Project (owner/repo) is required for updating GitHub issues');
    }

    const { execa } = await import('execa');

    if (input.labels && input.labels.length > 0) {
      await execa('gh', [
        'issue',
        'edit',
        id,
        '-R',
        project,
        '--add-label',
        input.labels.join(','),
      ]);
    }

    if (input.assignee) {
      await execa('gh', ['issue', 'edit', id, '-R', project, '--add-assignee', input.assignee]);
    }

    if (input.status) {
      const stateFlag = input.status.toLowerCase() === 'closed' ? 'closed' : 'open';
      await execa('gh', ['issue', 'edit', id, '-R', project, '--state', stateFlag]);
    }

    if (input.comment) {
      await execa('gh', ['issue', 'comment', id, '-R', project, '--body', input.comment]);
    }

    // Fetch updated issue to return current state
    const result = await execa('gh', [
      'issue',
      'view',
      id,
      '-R',
      project,
      '--json',
      'number,title,state,url,labels',
    ]);
    const issue = JSON.parse(result.stdout);

    return {
      id: String(issue.number),
      identifier: `#${issue.number}`,
      title: issue.title,
      url: issue.url,
      status: issue.state,
      source: 'github',
      labels: issue.labels?.map((l: { name: string }) => l.name),
    };
  }

  async closeTask(id: string, comment?: string, options?: IntegrationOptions): Promise<void> {
    const project = options?.project;
    if (!project) {
      this.error('Project (owner/repo) is required for closing GitHub issues');
    }

    const { execa } = await import('execa');
    const args = ['issue', 'close', id, '-R', project];
    if (comment) args.push('--comment', comment);

    await execa('gh', args);
  }

  async addComment(id: string, body: string, options?: IntegrationOptions): Promise<void> {
    const project = options?.project;
    if (!project) {
      this.error('Project (owner/repo) is required for commenting on GitHub issues');
    }

    const { execa } = await import('execa');
    await execa('gh', ['issue', 'comment', id, '-R', project, '--body', body]);
  }

  getHelp(): string {
    return `
github: Fetch issues from GitHub repositories

Usage:
  ralph-starter run --from github --project owner/repo
  ralph-starter run --from github --project owner/repo --label bug
  ralph-starter run --from github --project https://github.com/owner/repo

Options:
  --project  Repository in owner/repo format or GitHub URL
  --label    Filter by label name
  --status   Issue state: open, closed, all (default: open)
  --limit    Maximum issues to fetch (default: 20)

Authentication:
  Uses 'gh' CLI if available and authenticated (recommended)
  Otherwise requires: ralph-starter config set github.token <token>

Setup with gh CLI (recommended):
  1. Install: https://cli.github.com/
  2. Run: gh auth login

Setup with token:
  1. Create token at: https://github.com/settings/tokens
  2. Run: ralph-starter config set github.token <token>

Examples:
  ralph-starter run --from github --project facebook/react --label "good first issue"
  ralph-starter run --from github --project my-org/my-repo --status all
`.trim();
  }
}
