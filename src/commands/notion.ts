/**
 * ralph-starter notion — Interactive Notion pages wizard
 *
 * Guides the user through selecting Notion pages to work on:
 * 1. Authenticate (API token)
 * 2. Search for pages or paste a URL
 * 3. Select a page
 * 4. Delegate to run command
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { askBrowseOrUrl, askForUrl, ensureCredentials } from '../integrations/wizards/shared.js';
import { type RunCommandOptions, runCommand } from './run.js';

export interface NotionWizardOptions {
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  maxIterations?: number;
  agent?: string;
}

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_API_VERSION = '2022-06-28';

interface NotionSearchResult {
  id: string;
  object: 'page' | 'database';
  url: string;
  properties?: Record<string, unknown>;
  title?: Array<{ plain_text: string }>;
  parent?: {
    type: string;
    workspace?: boolean;
    page_id?: string;
    database_id?: string;
  };
}

/** Search Notion pages via the API */
async function searchPages(
  token: string,
  query: string,
  limit = 10
): Promise<NotionSearchResult[]> {
  const response = await fetch(`${NOTION_API_BASE}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      filter: { property: 'object', value: 'page' },
      page_size: limit,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Notion token. Run: ralph-starter config set notion.token <token>');
    }
    throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: NotionSearchResult[];
    has_more: boolean;
  };

  return data.results;
}

/** Extract the title from a Notion page's properties */
function getPageTitle(page: NotionSearchResult): string {
  // Direct title property (databases)
  if (page.title) {
    const titleText = page.title.map((t) => t.plain_text).join('');
    if (titleText) return titleText;
  }

  // Page properties — look for the Title property
  if (page.properties) {
    for (const prop of Object.values(page.properties)) {
      const p = prop as { type?: string; title?: Array<{ plain_text: string }> };
      if (p.type === 'title' && p.title) {
        const titleText = p.title.map((t: { plain_text: string }) => t.plain_text).join('');
        if (titleText) return titleText;
      }
    }
  }

  return 'Untitled';
}

/** Get a short description of the page's parent */
function getParentInfo(page: NotionSearchResult): string {
  if (!page.parent) return '';
  if (page.parent.workspace) return 'workspace';
  if (page.parent.page_id) return 'subpage';
  if (page.parent.database_id) return 'database item';
  return '';
}

export async function notionCommand(options: NotionWizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('  Notion Pages'));
  console.log(chalk.dim('  Build from Notion pages interactively'));
  console.log();

  // Step 1: Ensure credentials
  await ensureCredentials('notion', 'Notion', {
    credKey: 'token',
    consoleUrl: 'https://www.notion.so/my-integrations',
    envVar: 'NOTION_API_KEY',
  });

  // Step 2: Browse or URL?
  const mode = await askBrowseOrUrl('Notion');

  if (mode === 'url') {
    const url = await askForUrl('Notion', /notion\.(so|site)/);

    const runOpts: RunCommandOptions = {
      from: 'notion',
      project: url,
      auto: true,
      commit: options.commit ?? false,
      push: options.push,
      pr: options.pr,
      validate: options.validate ?? true,
      maxIterations: options.maxIterations,
      agent: options.agent,
    };

    await runCommand(undefined, runOpts);
    return;
  }

  // Browse mode — search for pages
  // Get the actual token for API calls (ensureCredentials may have returned '__cli_auth__')
  const creds = await import('../sources/config.js').then((m) => m.getSourceCredentials('notion'));
  const token = process.env.NOTION_API_KEY || creds?.token;

  if (!token) {
    console.log(chalk.red('  Could not obtain Notion API token.'));
    console.log(chalk.dim('  Run: ralph-starter config set notion.token <token>'));
    return;
  }

  // Search loop — let user search and refine until they find the right page
  let selectedUrl: string | undefined;

  while (!selectedUrl) {
    const { searchQuery } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchQuery',
        message: 'Search for a page:',
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Please enter a search term',
      },
    ]);

    console.log(chalk.dim('  Searching...'));
    let results: NotionSearchResult[];
    try {
      results = await searchPages(token, searchQuery.trim());
    } catch (err) {
      console.log(chalk.red('  Failed to search Notion. Check your token.'));
      console.log(chalk.dim(`  Error: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }

    if (results.length === 0) {
      console.log(chalk.yellow('  No pages found. Try a different search term.'));
      console.log();
      continue;
    }

    const SEARCH_AGAIN = '__search_again__';
    const { selectedPage } = await inquirer.prompt([
      {
        type: 'select',
        name: 'selectedPage',
        message: 'Select a page:',
        choices: [
          ...results.map((page) => {
            const title = getPageTitle(page);
            const parent = getParentInfo(page);
            const parentTag = parent ? chalk.dim(` (${parent})`) : '';
            return {
              name: `${title}${parentTag}`,
              value: page.url,
            };
          }),
          { name: chalk.dim('Search again...'), value: SEARCH_AGAIN },
        ],
      },
    ]);

    if (selectedPage !== SEARCH_AGAIN) {
      selectedUrl = selectedPage;
    }
    // Otherwise loop continues
  }

  // Step 3: Run with the selected page URL
  console.log();
  console.log(chalk.green('  Starting build from Notion page...'));
  console.log();

  const runOpts: RunCommandOptions = {
    from: 'notion',
    project: selectedUrl,
    auto: true,
    commit: options.commit ?? false,
    push: options.push,
    pr: options.pr,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    agent: options.agent,
  };

  await runCommand(undefined, runOpts);
}
