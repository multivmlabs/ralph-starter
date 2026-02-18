> [English](README.md) | [Português](README.pt.md) | [Español](README.es.md) | [Français](README.fr.md) | [Türkçe](README.tr.md) | [Deutsch](README.de.md) | [العربية](README.ar.md) | [简体中文](README.zh-Hans.md) | [日本語](README.ja.md)

<p align="center">
  <img src="ralph.png" alt="Ralph Wiggum" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ralph-starter"><img src="https://img.shields.io/npm/v/ralph-starter.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/ralph-starter"><img src="https://img.shields.io/npm/dm/ralph-starter.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/ralph-starter.svg?style=flat-square" alt="license"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/actions"><img src="https://img.shields.io/github/actions/workflow/status/multivmlabs/ralph-starter/ci.yml?branch=main&style=flat-square" alt="build status"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/actions/workflows/security.yml"><img src="https://img.shields.io/github/actions/workflow/status/multivmlabs/ralph-starter/security.yml?branch=main&style=flat-square&label=security" alt="security scanning"></a>
  <a href="https://securityscorecards.dev/viewer/?uri=github.com/multivmlabs/ralph-starter"><img src="https://img.shields.io/ossf-scorecard/github.com/multivmlabs/ralph-starter?style=flat-square&label=scorecard" alt="OSSF Scorecard"></a>
  <a href="https://github.com/multivmlabs/ralph-starter"><img src="https://img.shields.io/github/stars/multivmlabs/ralph-starter?style=flat-square" alt="GitHub stars"></a>
</p>

<h3 align="center">
  <strong>连接您的工具。运行 AI 编码循环。更快交付。</strong>
</h3>

<p align="center">
  <em>从 GitHub、Linear、Notion、Figma 等提取规格 — 然后让 AI 自主构建。</em>
</p>

<p align="center">
  <a href="#集成">集成</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#功能">功能</a> •
  <a href="https://ralphstarter.ai">文档</a>
</p>

---


大多数 AI 编码工具都是独立工作的。你描述一个任务,AI 构建它,完成。

**ralph-starter** 不同。它**连接到你现有的工作流程** — 从 GitHub issues、Linear tickets、Notion 文档或任何 URL 中提取规格 — 然后运行自主 AI 循环直到任务完成。

```bash
# 从 GitHub issue 构建
ralph-starter run --from github --project myorg/myrepo --label "ready"

# 从 Linear ticket 构建
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# 从 Notion 规格构建
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# 或者只是描述你想要什么
ralph-starter run "build a todo app with React" --commit
```

---

## 集成

ralph-starter 与您喜爱的工具原生集成:

| 集成 | 身份验证方法 | 提取内容 |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (推荐) 或 API token | Issues、PRs、文件 |
| **Linear** | `linear` CLI 或 API key | 按团队/项目的 Issues |
| **Notion** | 无 (公开) 或 API token (私有) | 页面、数据库 |
| **Figma** | API token | 设计规格、tokens、资产和内容提取 |
| **URLs** | 无 | 任何公开 markdown/HTML |
| **文件** | 无 | 本地 markdown、PDF |

```bash
# 检查可用集成
ralph-starter integrations list

# 测试连接性
ralph-starter integrations test github
ralph-starter integrations test linear

# 运行前预览数据
ralph-starter integrations fetch github owner/repo
```

> **想要更多集成?** 欢迎 PR! 查看 [CONTRIBUTING.md](CONTRIBUTING.md) 开始。

---

## 目录

- [集成](#集成)
- [快速开始](#快速开始)
- [功能](#功能)
- [命令](#命令)
- [配置](#api-密钥配置)
- [贡献](#贡献)

---

### 主要功能

| 功能 | 描述 |
|---------|-------------|
| **集成** | 从 GitHub、Linear、Notion、Figma、URLs、文件提取规格 |
| **多代理支持** | 适用于 Claude Code、Cursor、Copilot、Gemini CLI 等 |
| **交互式向导** | 使用 AI 精炼规格的引导式项目创建 |
| **16+ 工作流预设** | 预配置模式: feature、tdd、debug、review 等 |
| **断路器** | 重复失败后自动停止卡住的循环 |
| **成本跟踪** | 估算每次迭代的 token 使用量和成本 |
| **Git 自动化** | 自动提交、推送和创建 PR |
| **反压验证** | 每次迭代后运行测试/lint/build |
| **MCP 服务器** | 从 Claude Desktop 或任何 MCP 客户端使用 |

### 快速示例

```bash
# 简单任务
ralph-starter run "build a todo app" --commit --validate

# 使用预设
ralph-starter run --preset tdd-red-green "add user authentication"

# 使用安全控制
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# 交互式向导
ralph-starter
```

---

## 什么是 Ralph Wiggum?

在 [ghuntley.com/ralph](https://ghuntley.com/ralph/) 了解 Ralph Wiggum 技术。

## 安装

```bash
npm install -g ralph-starter
# 或
npx ralph-starter
```

安装后,运行设置向导并验证您的环境:

```bash
ralph-starter setup    # 配置 API 密钥和偏好设置
ralph-starter check    # 验证系统要求和连接性
```

## 快速开始

### 面向所有人(欢迎非开发者!)

只需运行不带参数的 `ralph-starter` 来启动交互式向导:

```bash
ralph-starter
```

向导将:
1. 询问您是否有项目想法(或帮助您创建一个)
2. 使用 AI 完善您的想法
3. 让您自定义技术栈
4. 自动构建您的项目

### 不知道构建什么?

```bash
ralph-starter ideas
```

这会启动**创意模式** - 一个头脑风暴会话,帮助您发现项目创意:
- **与 AI 头脑风暴** - 获得创意建议
- **查看趋势创意** - 基于 2025-2026 技术趋势
- **基于我的技能** - 针对您了解的技术个性化
- **解决问题** - 帮助修复让您沮丧的事情

### 面向开发者

```bash
# 运行单个任务
ralph-starter run "build a todo app with React"

# 使用 git 自动化
ralph-starter run "add user authentication" --commit --pr

# 使用验证 (反压)
ralph-starter run "refactor auth" --commit --validate

# 从外部源获取规格
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# 获取特定 GitHub issue
ralph-starter run --from github --project owner/repo --issue 123

# 指定输出目录 (跳过"在哪里运行?"提示)
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### 使用现有项目

ralph-starter 在运行向导时自动检测现有项目:

**Ralph Playbook 项目** (有 AGENTS.md、IMPLEMENTATION_PLAN.md 等):
```bash
cd my-ralph-project
ralph-starter
```
向导将检测 Ralph Playbook 文件并允许您:
- 继续工作 (运行构建循环)
- 重新生成实施计划
- 添加新规格

**语言项目** (有 package.json、pyproject.toml、Cargo.toml、go.mod):
```bash
cd my-existing-app
ralph-starter
```
向导将检测项目类型并允许您:
- 向现有项目添加功能
- 在子文件夹中创建新项目

## 功能

### 交互式向导
使用 `ralph-starter` (无参数) 启动以获得引导体验:
- 用简单的语言描述您的想法
- AI 精炼并建议功能
- 选择您的技术栈
- 自动运行 init → plan → build

### 创意模式
对于还不知道要构建什么的用户:
```bash
ralph-starter ideas
```

### MCP 服务器
从 Claude Desktop 或任何 MCP 客户端使用 ralph-starter:

```bash
ralph-starter mcp
```

添加到 Claude Desktop 配置:
```json
{
  "mcpServers": {
    "ralph-starter": {
      "command": "ralph-starter",
      "args": ["mcp"]
    }
  }
}
```

**可用的 MCP 工具:**
- `ralph_init` - 初始化 Ralph Playbook
- `ralph_plan` - 创建实施计划
- `ralph_run` - 执行编码循环
- `ralph_status` - 检查进度
- `ralph_validate` - 运行测试/lint/build

### 多代理支持
适用于您喜爱的编码代理:
- **Claude Code** (推荐)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### LLM 提供商
ralph-starter 支持多个 LLM 提供商用于内部功能:

| 提供商 | 环境变量 | 描述 |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude 模型 (默认) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 和 GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 一个 API 访问 100+ 模型 |

这些密钥用于 ralph-starter 的内部 LLM 调用。编码代理处理自己的身份验证。

### Git 自动化
```bash
ralph-starter run "your task" --commit      # 任务后自动提交
ralph-starter run "your task" --push        # 推送到远程
ralph-starter run "your task" --pr          # 完成时创建 PR
```

### 反压验证
```bash
ralph-starter run "your task" --validate    # 每次迭代后运行测试/lint/build
```

`--validate` 标志在每次迭代后运行测试、lint 和 build 命令(来自 AGENTS.md 或 package.json)。如果验证失败,代理会收到反馈以修复问题。

### 工作流预设

常见开发场景的预配置设置:

```bash
# 列出所有 16+ 预设
ralph-starter presets

# 使用预设
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**可用预设:**
| 类别 | 预设 |
|----------|---------|
| 开发 | `feature`、`feature-minimal`、`tdd-red-green`、`spec-driven`、`refactor` |
| 调试 | `debug`、`incident-response`、`code-archaeology` |
| 审查 | `review`、`pr-review`、`adversarial-review` |
| 文档 | `docs`、`documentation-first` |
| 专业 | `api-design`、`migration-safety`、`performance-optimization`、`scientific-method`、`research`、`gap-analysis` |

### 断路器

自动停止卡住的循环:

```bash
# 3 次连续失败后停止 (默认)
ralph-starter run "build X" --validate

# 自定义阈值
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

断路器监控:
- **连续失败**: 连续 N 次验证失败后停止
- **相同错误计数**: 如果相同错误重复 N 次则停止

### 进度跟踪

将迭代日志写入 `activity.md`:

```bash
# 默认启用
ralph-starter run "build X"

# 如果不需要则禁用
ralph-starter run "build X" --no-track-progress
```

每次迭代记录:
- 时间戳和持续时间
- 状态 (已完成、失败、阻塞)
- 验证结果
- 提交信息

### 基于文件的完成

循环自动检查完成信号:
- 项目根目录中的 `RALPH_COMPLETE` 文件
- `.ralph-done` 标记文件
- `IMPLEMENTATION_PLAN.md` 中所有任务标记为 `[x]`

### 速率限制

控制 API 调用频率以管理成本:

```bash
# 限制为每小时 50 次调用
ralph-starter run --rate-limit 50 "build X"
```

**达到速率限制时**, ralph-starter 显示详细统计信息:

```
⚠ 达到 Claude 速率限制

速率限制统计:
  • 会话使用: 100% (50K / 50K tokens)
  • 发出的请求: 本小时 127 次
  • 重置前时间: ~47 分钟 (在 04:30 UTC 重置)

会话进度:
  • 已完成任务: 3/5
  • 当前任务: "Add swarm mode CLI flags"
  • 分支: auto/github-54
  • 已完成迭代: 12

限制重置后继续:
  ralph-starter run

提示: 在 https://claude.ai/settings 检查您的限制
```

这帮助您:
- 确切知道何时可以恢复
- 跟踪当前会话的进度
- 了解您的使用模式

### 成本跟踪

在循环期间跟踪估算的 token 使用量和成本:

```bash
# 成本跟踪默认启用
ralph-starter run "build X"

# 禁用成本跟踪
ralph-starter run "build X" --no-track-cost
```

成本跟踪提供:
- 循环期间显示的**每次迭代成本**
- tokens 和成本的**累计总计**
- 循环结束时的**成本摘要**
- 在 `activity.md` 中为每次迭代**记录的成本**
- 剩余迭代的**预计成本** (3+ 次迭代后)

支持成本估算的模型:
- Claude 3 Opus (每 1M tokens $15/$75)
- Claude 3.5 Sonnet (每 1M tokens $3/$15)
- Claude 3.5 Haiku (每 1M tokens $0.25/$1.25)
- GPT-4 (每 1M tokens $30/$60)
- GPT-4 Turbo (每 1M tokens $10/$30)

## Ralph Playbook 工作流

ralph-starter 遵循 [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) 方法论:

```bash
# 1. 初始化 Ralph Playbook 文件
ralph-starter init

# 2. 在 specs/ 文件夹中编写规格

# 3. 创建实施计划
ralph-starter plan

# 4. 执行计划
ralph-starter run --commit --validate
```

这会创建:
- `AGENTS.md` - 代理指令和验证命令
- `PROMPT_plan.md` - 计划提示模板
- `PROMPT_build.md` - 构建提示模板
- `IMPLEMENTATION_PLAN.md` - 优先任务列表
- `specs/` - 规格文件

## 命令

| 命令 | 描述 |
|---------|-------------|
| `ralph-starter` | 启动交互式向导 |
| `ralph-starter run [task]` | 运行自主编码循环 |
| `ralph-starter auto` | 批量处理 GitHub/Linear 的 issues |
| `ralph-starter integrations <action>` | 管理集成 (list、help、test、fetch) |
| `ralph-starter plan` | 从规格创建实施计划 |
| `ralph-starter init` | 在项目中初始化 Ralph Playbook |
| `ralph-starter setup` | 交互式配置环境和 API 密钥 |
| `ralph-starter check` | 验证系统要求和连接性 |
| `ralph-starter ideas` | 头脑风暴项目创意 |
| `ralph-starter presets` | 列出可用的工作流预设 |
| `ralph-starter mcp` | 作为 MCP 服务器启动 |
| `ralph-starter config <action>` | 管理凭证 |
| `ralph-starter source <action>` | 管理输入源 (传统) |
| `ralph-starter skill add <repo>` | 安装代理技能 |

## `run` 的选项

### 核心选项

| 标志 | 描述 |
|------|-------------|
| `--auto` | 跳过权限提示 **(默认: true)** |
| `--no-auto` | 需要手动权限批准 |
| `--commit` | 任务后自动提交 |
| `--push` | 推送提交到远程 |
| `--pr` | 创建 pull request |
| `--validate` | 运行测试/lint/build (反压) |
| `--agent <name>` | 指定要使用的代理 |
| `--max-iterations <n>` | 最大循环迭代次数 (默认: 50) |

### 调试模式

使用 `RALPH_DEBUG=1` 在执行期间查看详细输出:

```bash
# 查看详细的代理输出、时间和提示
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# 使用 GitHub issue 调试
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

调试模式显示:
- 正在运行的确切命令
- 实时代理输出
- 时间信息
- 错误详情

### 工作流预设

| 标志 | 描述 |
|------|-------------|
| `--preset <name>` | 使用工作流预设 (feature、tdd-red-green、debug 等) |

```bash
# 列出所有可用预设
ralph-starter presets

# 使用预设
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### 退出检测

| 标志 | 描述 |
|------|-------------|
| `--completion-promise <string>` | 用于检测任务完成的自定义字符串 |
| `--require-exit-signal` | 需要显式 `EXIT_SIGNAL: true` 才能完成 |

```bash
# 当代理输出 "FEATURE_DONE" 时停止
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# 需要显式退出信号
ralph-starter run --require-exit-signal "build Y"
```

### 安全控制

| 标志 | 描述 |
|------|-------------|
| `--rate-limit <n>` | 每小时最大 API 调用次数 (默认: 无限制) |
| `--circuit-breaker-failures <n>` | 停止前的最大连续失败次数 (默认: 3) |
| `--circuit-breaker-errors <n>` | 停止前相同错误的最大次数 (默认: 5) |
| `--track-progress` | 将进度写入 activity.md (默认: true) |
| `--no-track-progress` | 禁用进度跟踪 |
| `--track-cost` | 跟踪 token 使用量和估算成本 (默认: true) |
| `--no-track-cost` | 禁用成本跟踪 |

```bash
# 限制为每小时 50 次 API 调用
ralph-starter run --rate-limit 50 "build X"

# 2 次连续失败后停止
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### 源选项

| 标志 | 描述 |
|------|-------------|
| `--from <source>` | 从源获取规格 |
| `--project <name>` | 源的项目过滤器 |
| `--label <name>` | 源的标签过滤器 |
| `--status <status>` | 源的状态过滤器 |
| `--limit <n>` | 源的最大项目数 |
| `--issue <n>` | 特定 issue 编号 (GitHub) |
| `--output-dir <path>` | 运行任务的目录 (跳过提示) |
| `--prd <file>` | 从 markdown 读取任务 |

## 配置命令

```bash
# 设置凭证
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# 查看配置
ralph-starter config list
ralph-starter config get linear.apiKey

# 删除
ralph-starter config delete linear.apiKey
```

## 示例: 构建 SaaS 仪表板

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# 观看奇迹发生...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## 测试 ralph-starter

### 快速测试 (无需 API 密钥)

您可以使用公共 URL 测试 ralph-starter - 无需 API 密钥:

```bash
# 使用公共 GitHub gist 或原始 markdown 测试
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# 使用 GitHub issues 测试 (需要 gh CLI 登录)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### 测试向导

```bash
# 启动交互式向导
ralph-starter

# 或测试创意模式
ralph-starter ideas
```

### 使用您自己的规格测试

```bash
# 创建一个简单的规格文件
echo "Build a simple counter app with React" > my-spec.md

# 使用本地文件运行
ralph-starter run --from ./my-spec.md
```

### 验证源连接性

在使用集成之前,验证它是否正常工作:

```bash
# 检查哪些集成可用
ralph-starter integrations list

# 测试每个集成
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# 预览项目 (空运行)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## API 密钥配置

### 选项 1: 环境变量 (推荐开发者使用)

在 shell 配置文件或 `.env` 文件中设置环境变量:

```bash
# 添加到 ~/.bashrc、~/.zshrc 或 .env 文件
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

环境变量优先于配置文件。

### 选项 2: 配置命令

使用 CLI 存储凭证:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

凭证存储在 `~/.ralph-starter/sources.json` 中。

### 环境变量参考

| 源 | 环境变量 | 配置键 |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## 要求

- Node.js 18+
- 至少安装一个编码代理 (Claude Code、Cursor 等)
- Git (用于自动化功能)
- GitHub CLI `gh` (用于 PR 创建和 GitHub 源)

## 文档

完整文档可在以下位置获取: https://ralphstarter.ai

## 贡献

欢迎贡献! 查看 [CONTRIBUTING.md](CONTRIBUTING.md) 获取指南。

- **功能请求和创意**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **项目模板**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

要创建自定义集成、代理或使用编程 API,请参阅[开发者扩展指南](https://ralphstarter.ai/docs/guides/extending-ralph-starter)。

## 许可证

MIT
