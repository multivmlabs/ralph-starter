# Playwright MCP Integration

Visual verification integration using Playwright MCP server.

## Overview

This integration connects ralph-starter to the Playwright MCP server for:
- Browser automation
- Screenshot capture
- Visual assertions
- UI verification in coding loops

## Setup

### Install Playwright MCP

```bash
npm install -g @playwright/mcp
# or
npx @playwright/mcp
```

### Configure Visual Tests

Create a visual tests configuration file:

**`.ralph/visual-tests.json`**
```json
{
  "tests": [
    {
      "name": "Home page loads",
      "url": "http://localhost:3000",
      "selectors": ["nav", "main", "footer"]
    },
    {
      "name": "Login form works",
      "url": "http://localhost:3000/login",
      "actions": [
        { "type": "fill", "selector": "#email", "value": "test@example.com" },
        { "type": "fill", "selector": "#password", "value": "password" },
        { "type": "click", "selector": "button[type=submit]" }
      ],
      "assertions": [
        { "type": "visible", "selector": ".dashboard" }
      ]
    }
  ]
}
```

Or add to `AGENTS.md`:

```markdown
## Visual Tests

- Home page: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Settings: http://localhost:3000/settings
```

## Usage

### CLI Command

```bash
# Run visual verification
ralph-starter verify

# With options
ralph-starter verify --base-url http://localhost:8080 --browser firefox
```

### In Coding Loop

```bash
# Run loop with visual validation
ralph-starter run "Add login form" --validate --visual

# Visual tests run after each iteration alongside tests/lint/build
```

### Programmatic

```typescript
import { PlaywrightClient, runVisualTests, detectVisualTests } from 'ralph-starter';

// Detect tests from config
const tests = detectVisualTests(process.cwd());

// Run tests
const results = await runVisualTests(tests, {
  browser: 'chromium',
  baseUrl: 'http://localhost:3000'
});

// Format for display
console.log(formatVisualResults(results));
```

## Test Case Schema

```typescript
interface VisualTestCase {
  // Test identifier
  name: string;

  // URL to test
  url: string;

  // Optional selectors to verify exist
  selectors?: string[];

  // Optional screenshot name
  screenshot?: string;

  // Actions to perform before assertions
  actions?: Array<{
    type: 'click' | 'fill' | 'hover' | 'wait' | 'scroll';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;

  // Assertions to run
  assertions?: Array<{
    type: 'visible' | 'hidden' | 'text' | 'count' | 'attribute';
    selector: string;
    expected?: string | number;
    attribute?: string;
  }>;
}
```

## MCP Tool

When running as MCP server, use the `ralph_visual_verify` tool:

```json
{
  "name": "ralph_visual_verify",
  "arguments": {
    "path": "/path/to/project",
    "baseUrl": "http://localhost:3000"
  }
}
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `serverPath` | `npx` | Path to Playwright MCP server |
| `browser` | `chromium` | Browser to use |
| `headless` | `true` | Run headless |
| `baseUrl` | `http://localhost:3000` | Base URL for relative paths |
| `screenshotDir` | `.ralph/screenshots` | Screenshot storage |
| `timeout` | `30000` | Operation timeout (ms) |

## Integration with Loop

Visual tests integrate with the validation backpressure system:

1. Agent makes changes
2. Tests run (if `--validate`)
3. Lint runs
4. Build runs
5. **Visual tests run** (if `--visual`)
6. Failed visual tests fed back to agent
7. Agent fixes issues
8. Repeat until passing

## Troubleshooting

### Playwright MCP not found

```bash
npm install -g @playwright/mcp
```

### Browser not starting

Ensure Playwright browsers are installed:
```bash
npx playwright install chromium
```

### Timeouts

Increase timeout in config or via CLI:
```bash
ralph-starter verify --timeout 60000
```
