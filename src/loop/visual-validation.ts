/**
 * Visual Validation Module
 *
 * Integrates Playwright MCP visual testing with the ralph-starter loop.
 * Works alongside test/lint/build validation as part of backpressure system.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectVisualTests,
  formatVisualFeedback,
  formatVisualResults,
  PlaywrightClient,
  type PlaywrightOptions,
  runVisualTests,
  type VisualTestCase,
  type VisualTestResult,
} from '../integrations/playwright/index.js';

export interface VisualValidationResult {
  success: boolean;
  available: boolean;
  testCount: number;
  passed: number;
  failed: number;
  results: VisualTestResult[];
  output: string;
  feedback: string;
  duration: number;
}

/**
 * Check if visual validation is available
 */
export async function isVisualValidationAvailable(): Promise<boolean> {
  const client = new PlaywrightClient();
  return await client.isAvailable();
}

/**
 * Check if visual tests are configured for a project
 */
export function hasVisualTests(cwd: string): boolean {
  // Check for visual test config files
  const configPaths = [
    join(cwd, '.ralph', 'visual-tests.json'),
    join(cwd, 'ralph-visual-tests.json'),
    join(cwd, '.ralph-visual-tests.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      return true;
    }
  }

  // Check AGENTS.md for visual tests section
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const { readFileSync } = require('node:fs');
    const content = readFileSync(agentsPath, 'utf-8');
    if (/##\s*visual\s*tests?/i.test(content)) {
      return true;
    }
  }

  return false;
}

/**
 * Run visual validation for a project
 */
export async function runVisualValidation(
  cwd: string,
  options: PlaywrightOptions = {}
): Promise<VisualValidationResult> {
  const startTime = Date.now();

  // Check if Playwright MCP is available
  const client = new PlaywrightClient(options);
  const available = await client.isAvailable();

  if (!available) {
    return {
      success: true, // Don't fail if visual validation isn't available
      available: false,
      testCount: 0,
      passed: 0,
      failed: 0,
      results: [],
      output: 'Playwright MCP not available. Install with: npm install -g @playwright/mcp',
      feedback: '',
      duration: Date.now() - startTime,
    };
  }

  // Detect visual tests
  const tests = detectVisualTests(cwd);

  if (tests.length === 0) {
    return {
      success: true,
      available: true,
      testCount: 0,
      passed: 0,
      failed: 0,
      results: [],
      output: 'No visual tests configured',
      feedback: '',
      duration: Date.now() - startTime,
    };
  }

  // Run the tests
  const results = await runVisualTests(tests, options);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    success: failed === 0,
    available: true,
    testCount: tests.length,
    passed,
    failed,
    results,
    output: formatVisualResults(results),
    feedback: formatVisualFeedback(results),
    duration: Date.now() - startTime,
  };
}

/**
 * Create visual test cases from a simple URL list
 */
export function createTestCasesFromUrls(urls: string[]): VisualTestCase[] {
  return urls.map((url, index) => ({
    name: `Page ${index + 1}`,
    url,
  }));
}

/**
 * Create visual test cases with custom assertions
 */
export function createTestCase(
  name: string,
  url: string,
  options: Partial<VisualTestCase> = {}
): VisualTestCase {
  return {
    name,
    url,
    ...options,
  };
}

/**
 * Quick verification of a single URL
 */
export async function verifyUrl(
  url: string,
  options: PlaywrightOptions = {}
): Promise<VisualTestResult> {
  const tests = [{ name: 'Quick verify', url }];
  const results = await runVisualTests(tests, options);
  return results[0];
}

/**
 * Take a screenshot of a URL for reference
 */
export async function takeScreenshot(
  url: string,
  name: string,
  options: PlaywrightOptions = {}
): Promise<string> {
  const client = new PlaywrightClient(options);

  try {
    await client.connect();
    await client.navigate(url);
    const screenshotData = await client.screenshot(name);
    return screenshotData;
  } finally {
    await client.disconnect();
  }
}

/**
 * Verify page contains expected elements
 */
export async function verifyElements(
  url: string,
  selectors: string[],
  options: PlaywrightOptions = {}
): Promise<{ success: boolean; found: string[]; missing: string[] }> {
  const client = new PlaywrightClient(options);

  try {
    await client.connect();
    await client.navigate(url);
    const snapshot = await client.getSnapshot();

    const found: string[] = [];
    const missing: string[] = [];

    for (const selector of selectors) {
      if (snapshot.includes(selector)) {
        found.push(selector);
      } else {
        missing.push(selector);
      }
    }

    return {
      success: missing.length === 0,
      found,
      missing,
    };
  } finally {
    await client.disconnect();
  }
}

// Re-export types and utilities from playwright module
export type { VisualTestCase, VisualTestResult, PlaywrightOptions };
export { formatVisualResults, formatVisualFeedback, detectVisualTests };
