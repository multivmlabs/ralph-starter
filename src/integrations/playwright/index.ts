/**
 * Playwright MCP Integration
 *
 * Provides visual verification capabilities for ralph-starter loops.
 * Connects to Playwright MCP server for browser automation and screenshot comparison.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface VisualTestCase {
  /** Test name for identification */
  name: string;
  /** URL to navigate to */
  url: string;
  /** Selectors to verify exist on page */
  selectors?: string[];
  /** Screenshot file name (optional) */
  screenshot?: string;
  /** Actions to perform before verification */
  actions?: VisualAction[];
  /** Assertions to run */
  assertions?: VisualAssertion[];
}

export interface VisualAction {
  type: 'click' | 'fill' | 'hover' | 'wait' | 'scroll';
  selector?: string;
  value?: string;
  timeout?: number;
}

export interface VisualAssertion {
  type: 'visible' | 'hidden' | 'text' | 'count' | 'attribute';
  selector: string;
  expected?: string | number;
  attribute?: string;
}

export interface VisualTestResult {
  name: string;
  success: boolean;
  url: string;
  screenshotPath?: string;
  error?: string;
  assertions?: {
    passed: number;
    failed: number;
    details: Array<{ assertion: VisualAssertion; passed: boolean; actual?: string }>;
  };
  duration: number;
}

export interface PlaywrightOptions {
  /** Path to Playwright MCP server */
  serverPath?: string;
  /** Browser to use */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** Headless mode */
  headless?: boolean;
  /** Base URL for relative paths */
  baseUrl?: string;
  /** Screenshot directory */
  screenshotDir?: string;
  /** Timeout for operations (ms) */
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<PlaywrightOptions> = {
  serverPath: 'npx',
  browser: 'chromium',
  headless: true,
  baseUrl: 'http://localhost:3000',
  screenshotDir: '.ralph/screenshots',
  timeout: 30000,
};

/**
 * Playwright MCP Client
 * Wraps the Playwright MCP server for visual verification
 */
export class PlaywrightClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private options: Required<PlaywrightOptions>;

  constructor(options: PlaywrightOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if Playwright MCP is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if @playwright/mcp is installed
      const { execa } = await import('execa');
      const result = await execa('npx', ['@playwright/mcp', '--help'], {
        timeout: 10000,
        reject: false,
      });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Connect to Playwright MCP server
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['@playwright/mcp', '--browser', this.options.browser],
    });

    this.client = new Client({ name: 'ralph-playwright', version: '1.0.0' }, { capabilities: {} });

    await this.client.connect(this.transport);
  }

  /**
   * Disconnect from Playwright MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    const fullUrl = url.startsWith('http') ? url : `${this.options.baseUrl}${url}`;

    await this.client.callTool({
      name: 'browser_navigate',
      arguments: { url: fullUrl },
    });
  }

  /**
   * Take a screenshot
   */
  async screenshot(name?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    const result = await this.client.callTool({
      name: 'browser_screenshot',
      arguments: name ? { name } : {},
    });

    // The screenshot tool returns the image data
    const content = result.content as Array<{ type: string; data?: string; text?: string }>;
    const imageContent = content.find((c) => c.type === 'image');
    return imageContent?.data || '';
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    await this.client.callTool({
      name: 'browser_click',
      arguments: { element: selector },
    });
  }

  /**
   * Fill a form field
   */
  async fill(selector: string, value: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    await this.client.callTool({
      name: 'browser_type',
      arguments: { element: selector, text: value },
    });
  }

  /**
   * Hover over an element
   */
  async hover(selector: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    await this.client.callTool({
      name: 'browser_hover',
      arguments: { element: selector },
    });
  }

  /**
   * Get page content/snapshot
   */
  async getSnapshot(): Promise<string> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    const result = await this.client.callTool({
      name: 'browser_snapshot',
      arguments: {},
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const textContent = content.find((c) => c.type === 'text');
    return textContent?.text || '';
  }

  /**
   * Execute JavaScript in the page
   */
  async evaluate(script: string): Promise<unknown> {
    if (!this.client) {
      throw new Error('Not connected to Playwright MCP');
    }

    const result = await this.client.callTool({
      name: 'browser_evaluate',
      arguments: { script },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const textContent = content.find((c) => c.type === 'text');
    try {
      return textContent?.text ? JSON.parse(textContent.text) : null;
    } catch {
      return textContent?.text || null;
    }
  }
}

/**
 * Detect visual test cases from project configuration
 */
export function detectVisualTests(cwd: string): VisualTestCase[] {
  const tests: VisualTestCase[] = [];

  // Check for ralph visual tests config
  const configPaths = [
    join(cwd, '.ralph', 'visual-tests.json'),
    join(cwd, 'ralph-visual-tests.json'),
    join(cwd, '.ralph-visual-tests.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (Array.isArray(config.tests)) {
          tests.push(...config.tests);
        } else if (Array.isArray(config)) {
          tests.push(...config);
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  // Check AGENTS.md for visual test definitions
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');

    // Look for visual test section
    const visualMatch = content.match(/##\s*visual\s*tests?\s*\n([\s\S]*?)(?=\n##|\n---|Z)/i);
    if (visualMatch) {
      const section = visualMatch[1];

      // Parse test definitions like: - Home page: http://localhost:3000/
      const testMatches = section.matchAll(/[-*]\s*([^:]+):\s*(\S+)/g);
      for (const match of testMatches) {
        tests.push({
          name: match[1].trim(),
          url: match[2].trim(),
        });
      }
    }
  }

  return tests;
}

/**
 * Run visual test cases
 */
export async function runVisualTests(
  tests: VisualTestCase[],
  options: PlaywrightOptions = {}
): Promise<VisualTestResult[]> {
  const results: VisualTestResult[] = [];
  const client = new PlaywrightClient(options);

  try {
    await client.connect();

    for (const test of tests) {
      const startTime = Date.now();
      const result: VisualTestResult = {
        name: test.name,
        success: true,
        url: test.url,
        duration: 0,
      };

      try {
        // Navigate to URL
        await client.navigate(test.url);

        // Execute actions if any
        if (test.actions) {
          for (const action of test.actions) {
            switch (action.type) {
              case 'click':
                if (action.selector) await client.click(action.selector);
                break;
              case 'fill':
                if (action.selector && action.value) {
                  await client.fill(action.selector, action.value);
                }
                break;
              case 'hover':
                if (action.selector) await client.hover(action.selector);
                break;
              case 'wait':
                await new Promise((r) => setTimeout(r, action.timeout || 1000));
                break;
            }
          }
        }

        // Take screenshot if requested
        if (test.screenshot) {
          const screenshotData = await client.screenshot(test.screenshot);
          result.screenshotPath = test.screenshot;
          // Note: In real implementation, save the screenshot to disk
        }

        // Run assertions
        if (test.assertions && test.assertions.length > 0) {
          result.assertions = { passed: 0, failed: 0, details: [] };

          for (const assertion of test.assertions) {
            const assertionResult = await runAssertion(client, assertion);
            result.assertions.details.push(assertionResult);
            if (assertionResult.passed) {
              result.assertions.passed++;
            } else {
              result.assertions.failed++;
              result.success = false;
            }
          }
        }

        // Verify selectors exist if specified
        if (test.selectors && test.selectors.length > 0) {
          const snapshot = await client.getSnapshot();
          for (const selector of test.selectors) {
            if (!snapshot.includes(selector)) {
              result.success = false;
              result.error = `Selector not found: ${selector}`;
              break;
            }
          }
        }
      } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
      }

      result.duration = Date.now() - startTime;
      results.push(result);
    }
  } finally {
    await client.disconnect();
  }

  return results;
}

/**
 * Run a single assertion
 */
async function runAssertion(
  client: PlaywrightClient,
  assertion: VisualAssertion
): Promise<{ assertion: VisualAssertion; passed: boolean; actual?: string }> {
  try {
    const snapshot = await client.getSnapshot();

    switch (assertion.type) {
      case 'visible':
        return {
          assertion,
          passed: snapshot.includes(assertion.selector),
          actual: snapshot.includes(assertion.selector) ? 'visible' : 'not found',
        };

      case 'hidden':
        return {
          assertion,
          passed: !snapshot.includes(assertion.selector),
          actual: snapshot.includes(assertion.selector) ? 'visible' : 'hidden',
        };

      case 'text': {
        const hasText = snapshot.includes(assertion.expected as string);
        return {
          assertion,
          passed: hasText,
          actual: hasText ? 'found' : 'not found',
        };
      }

      default:
        return { assertion, passed: true };
    }
  } catch (error) {
    return {
      assertion,
      passed: false,
      actual: error instanceof Error ? error.message : 'error',
    };
  }
}

/**
 * Format visual test results for display
 */
export function formatVisualResults(results: VisualTestResult[]): string {
  const lines: string[] = [];

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  lines.push(`Visual Tests: ${passed} passed, ${failed} failed`);
  lines.push('');

  for (const result of results) {
    const status = result.success ? '✓' : '✗';
    lines.push(`${status} ${result.name} (${result.duration}ms)`);

    if (!result.success && result.error) {
      lines.push(`  Error: ${result.error}`);
    }

    if (result.assertions) {
      lines.push(`  Assertions: ${result.assertions.passed}/${result.assertions.details.length}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format visual test failures for agent feedback
 */
export function formatVisualFeedback(results: VisualTestResult[]): string {
  const failedResults = results.filter((r) => !r.success);

  if (failedResults.length === 0) {
    return '';
  }

  const feedback = ['## Visual Verification Failed\n'];

  for (const result of failedResults) {
    feedback.push(`### ${result.name}`);
    feedback.push(`URL: ${result.url}`);
    if (result.error) {
      feedback.push('```');
      feedback.push(result.error);
      feedback.push('```');
    }
    if (result.assertions) {
      const failedAssertions = result.assertions.details.filter((a) => !a.passed);
      for (const fa of failedAssertions) {
        feedback.push(`- ${fa.assertion.type} "${fa.assertion.selector}": ${fa.actual}`);
      }
    }
    feedback.push('');
  }

  feedback.push('Please fix the above visual issues before continuing.');

  return feedback.join('\n');
}
