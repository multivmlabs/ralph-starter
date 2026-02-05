---
sidebar_position: 4
title: config
description: Manage source configuration and credentials
keywords: [cli, config, command, credentials]
---

# ralph-starter config

Manage source configuration and credentials.

## Synopsis

```bash
ralph-starter config <action> [args...]
```

## Actions

| Action | Description |
|--------|-------------|
| `list` | Show all configuration |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `delete <key>` | Remove a value |

## Examples

### List Configuration

```bash
ralph-starter config list
```

Output:
```
Configuration:
  apiKey: sk-ant-...
  linear.apiKey: lin_api_...
  notion.token: secret_...
```

### Get Value

```bash
ralph-starter config get linear.apiKey
```

### Set Value

```bash
# Set LLM provider API keys
ralph-starter config set providers.anthropic.apiKey sk-ant-xxxx
ralph-starter config set providers.openai.apiKey sk-xxxx
ralph-starter config set providers.openrouter.apiKey sk-or-xxxx

# Set active LLM provider
ralph-starter config set llm.provider anthropic

# Set source integration keys
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter config set notion.token secret_xxxx
ralph-starter config set github.token ghp_xxxx
ralph-starter config set figma.token figd_xxxx

# Set defaults
ralph-starter config set github.defaultIssuesRepo owner/repo
```

### Delete Value

```bash
ralph-starter config delete linear.apiKey
```

## Configuration Keys

### LLM Provider Keys

| Key | Description |
|-----|-------------|
| `llm.provider` | Active LLM provider (`anthropic`, `openai`, `openrouter`) |
| `providers.anthropic.apiKey` | Anthropic API key |
| `providers.openai.apiKey` | OpenAI API key |
| `providers.openrouter.apiKey` | OpenRouter API key |

### Source Integration Keys

| Key | Description |
|-----|-------------|
| `linear.apiKey` | Linear API key |
| `notion.token` | Notion integration token |
| `github.token` | GitHub personal access token |
| `github.defaultIssuesRepo` | Default repo for `--issue` without `--project` |
| `figma.token` | Figma personal access token |

## Storage Location

Configuration is stored in:

```
~/.ralph-starter/config.json
```

Example file:
```json
{
  "llm": {
    "provider": "anthropic"
  },
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-xxxx"
    }
  }
}
```

Source credentials are stored in:

```
~/.ralph-starter/sources.json
```

## Security Notes

- Credentials are stored in plain text
- File permissions are set to user-only (600)
- Consider using environment variables for sensitive keys:
  - `ANTHROPIC_API_KEY`
  - `GITHUB_TOKEN`

## Environment Variables

These environment variables override config file values:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `GITHUB_TOKEN` | GitHub token |
| `FIGMA_TOKEN` | Figma token |
| `LINEAR_API_KEY` | Linear API key |
| `NOTION_TOKEN` | Notion integration token |

## See Also

- [ralph-starter source](/docs/cli/source)
- [Input Sources](/docs/sources/overview)
