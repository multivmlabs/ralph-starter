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
  <strong>ツールを接続。AIコーディングループを実行。より速く納品。</strong>
</h3>

<p align="center">
  <em>GitHub、Linear、Notion、Figmaなどから仕様を取得 — そしてAIに自律的に構築させる。</em>
</p>

<p align="center">
  <a href="#統合">統合</a> •
  <a href="#クイックスタート">クイックスタート</a> •
  <a href="#機能">機能</a> •
  <a href="https://ralphstarter.ai">ドキュメント</a>
</p>

---


ほとんどのAIコーディングツールは独立して動作します。タスクを記述し、AIがそれを構築し、完了。

**ralph-starter**は異なります。**既存のワークフローに接続します** — GitHub issues、Linear tickets、Notion docsまたは任意のURLから仕様を取得 — そしてタスクが完了するまで自律的なAIループを実行します。

```bash
# GitHub issueから構築
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Linear ticketから構築
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Notion仕様から構築
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# または単に何が欲しいか記述する
ralph-starter run "build a todo app with React" --commit
```

---

## 統合

ralph-starterはお気に入りのツールとネイティブに統合します:

| 統合 | 認証方法 | 取得内容 |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (推奨) またはAPIトークン | Issues、PRs、ファイル |
| **Linear** | `linear` CLI またはAPIキー | チーム/プロジェクト別のIssues |
| **Notion** | なし (公開) またはAPIトークン (非公開) | ページ、データベース |
| **Figma** | APIトークン | デザイン仕様、トークン、アセットとコンテンツ抽出 |
| **URLs** | なし | 任意の公開markdown/HTML |
| **ファイル** | なし | ローカルmarkdown、PDF |

```bash
# 利用可能な統合を確認
ralph-starter integrations list

# 接続性をテスト
ralph-starter integrations test github
ralph-starter integrations test linear

# 実行前にデータをプレビュー
ralph-starter integrations fetch github owner/repo
```

> **より多くの統合が必要ですか?** PRを歓迎します! 始めるには[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

---

## 目次

- [統合](#統合)
- [クイックスタート](#クイックスタート)
- [機能](#機能)
- [コマンド](#コマンド)
- [設定](#apiキー設定)
- [貢献](#貢献)

---

### 主な機能

| 機能 | 説明 |
|---------|-------------|
| **統合** | GitHub、Linear、Notion、Figma、URLs、ファイルから仕様を取得 |
| **マルチエージェントサポート** | Claude Code、Cursor、Copilot、Gemini CLIなどと連携 |
| **インタラクティブウィザード** | AI洗練された仕様によるガイド付きプロジェクト作成 |
| **16+のワークフロープリセット** | 事前設定されたモード: feature、tdd、debug、reviewなど |
| **サーキットブレーカー** | 繰り返し失敗後にスタックしたループを自動停止 |
| **コスト追跡** | 反復ごとのトークン使用量とコストを推定 |
| **Git自動化** | 自動コミット、プッシュ、PR作成 |
| **バックプレッシャー検証** | 各反復後にテスト/lint/buildを実行 |
| **MCPサーバー** | Claude Desktopまたは任意のMCPクライアントから使用 |

### クイック例

```bash
# シンプルなタスク
ralph-starter run "build a todo app" --commit --validate

# プリセットを使用
ralph-starter run --preset tdd-red-green "add user authentication"

# セーフティコントロールを使用
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# インタラクティブウィザード
ralph-starter
```

---

## Ralph Wiggumとは?

Ralph Wiggum技術については[ghuntley.com/ralph](https://ghuntley.com/ralph/)で学んでください。

## インストール

```bash
npm install -g ralph-starter
# または
npx ralph-starter
```

インストール後、セットアップウィザードを実行し、環境を確認します:

```bash
ralph-starter setup    # APIキーと設定を構成
ralph-starter check    # システム要件と接続性を確認
```

## クイックスタート

### すべての人向け(非開発者歓迎!)

引数なしで`ralph-starter`を実行してインタラクティブウィザードを起動するだけです:

```bash
ralph-starter
```

ウィザードは:
1. プロジェクトのアイデアがあるか尋ねます(またはアイデアの作成を支援)
2. AIであなたのアイデアを洗練
3. 技術スタックをカスタマイズできるようにする
4. プロジェクトを自動的に構築

### 何を構築すべきか分からない?

```bash
ralph-starter ideas
```

これは**アイデアモード**を起動します - プロジェクトアイデアの発見を支援するブレインストーミングセッション:
- **AIとブレインストーミング** - 創造的な提案を取得
- **トレンドアイデアを見る** - 2025-2026年のテクノロジートレンドに基づく
- **私のスキルに基づく** - 知っている技術にパーソナライズ
- **問題を解決** - あなたを悩ませる何かの修正を支援

### 開発者向け

```bash
# 単一のタスクを実行
ralph-starter run "build a todo app with React"

# Git自動化を使用
ralph-starter run "add user authentication" --commit --pr

# 検証を使用(バックプレッシャー)
ralph-starter run "refactor auth" --commit --validate

# 外部ソースから仕様を取得
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# 特定のGitHub issueを取得
ralph-starter run --from github --project owner/repo --issue 123

# 出力ディレクトリを指定("どこで実行?"プロンプトをスキップ)
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### 既存プロジェクトでの作業

ralph-starterはウィザード実行時に既存プロジェクトを自動検出します:

**Ralph Playbookプロジェクト**(AGENTS.md、IMPLEMENTATION_PLAN.mdなどを持つ):
```bash
cd my-ralph-project
ralph-starter
```
ウィザードはRalph Playbookファイルを検出し、以下を可能にします:
- 作業を続ける(ビルドループを実行)
- 実装計画を再生成
- 新しい仕様を追加

**言語プロジェクト**(package.json、pyproject.toml、Cargo.toml、go.modを持つ):
```bash
cd my-existing-app
ralph-starter
```
ウィザードはプロジェクトタイプを検出し、以下を可能にします:
- 既存プロジェクトに機能を追加
- サブフォルダに新しいプロジェクトを作成

## 機能

### インタラクティブウィザード
ガイド付き体験のために`ralph-starter`(引数なし)で起動:
- シンプルな言葉でアイデアを記述
- AIが洗練し、機能を提案
- 技術スタックを選択
- 自動的にinit → plan → buildを実行

### アイデアモード
まだ何を構築するか分からないユーザー向け:
```bash
ralph-starter ideas
```

### MCPサーバー
Claude Desktopまたは任意のMCPクライアントからralph-starterを使用:

```bash
ralph-starter mcp
```

Claude Desktop設定に追加:
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

**利用可能なMCPツール:**
- `ralph_init` - Ralph Playbookを初期化
- `ralph_plan` - 実装計画を作成
- `ralph_run` - コーディングループを実行
- `ralph_status` - 進捗を確認
- `ralph_validate` - テスト/lint/buildを実行

### マルチエージェントサポート
お気に入りのコーディングエージェントと連携:
- **Claude Code** (推奨)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### LLMプロバイダー
ralph-starterは内部機能のために複数のLLMプロバイダーをサポート:

| プロバイダー | 環境変数 | 説明 |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claudeモデル(デフォルト) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4とGPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 1つのAPIで100+モデル |

これらのキーはralph-starterの内部LLM呼び出し用です。コーディングエージェントは独自の認証を処理します。

### Git自動化
```bash
ralph-starter run "your task" --commit      # タスク後に自動コミット
ralph-starter run "your task" --push        # リモートにプッシュ
ralph-starter run "your task" --pr          # 完了時にPRを作成
```

### バックプレッシャー検証
```bash
ralph-starter run "your task" --validate    # 各反復後にテスト/lint/buildを実行
```

`--validate`フラグは各反復後にテスト、lint、buildコマンド(AGENTS.mdまたはpackage.jsonから)を実行します。検証が失敗すると、エージェントは問題を修正するためのフィードバックを受け取ります。

### ワークフロープリセット

一般的な開発シナリオの事前設定:

```bash
# すべての16+プリセットをリスト
ralph-starter presets

# プリセットを使用
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**利用可能なプリセット:**
| カテゴリ | プリセット |
|----------|---------|
| 開発 | `feature`、`feature-minimal`、`tdd-red-green`、`spec-driven`、`refactor` |
| デバッグ | `debug`、`incident-response`、`code-archaeology` |
| レビュー | `review`、`pr-review`、`adversarial-review` |
| ドキュメント | `docs`、`documentation-first` |
| 専門 | `api-design`、`migration-safety`、`performance-optimization`、`scientific-method`、`research`、`gap-analysis` |

### サーキットブレーカー

スタックしたループを自動的に停止:

```bash
# 3回連続失敗後に停止(デフォルト)
ralph-starter run "build X" --validate

# カスタムしきい値
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

サーキットブレーカーは監視:
- **連続失敗**: N回連続の検証失敗後に停止
- **同じエラー数**: 同じエラーがN回繰り返されたら停止

### 進捗追跡

反復ログを`activity.md`に書き込み:

```bash
# デフォルトで有効
ralph-starter run "build X"

# 不要な場合は無効化
ralph-starter run "build X" --no-track-progress
```

各反復は記録:
- タイムスタンプと期間
- ステータス(完了、失敗、ブロック)
- 検証結果
- コミット情報

### ファイルベースの完了

ループは自動的に完了シグナルをチェック:
- プロジェクトルートの`RALPH_COMPLETE`ファイル
- `.ralph-done`マーカーファイル
- `IMPLEMENTATION_PLAN.md`内のすべてのタスクが`[x]`とマーク

### レート制限

コスト管理のためにAPI呼び出し頻度を制御:

```bash
# 1時間あたり50回の呼び出しに制限
ralph-starter run --rate-limit 50 "build X"
```

**レート制限に達すると**、ralph-starterは詳細な統計を表示:

```
⚠ Claudeレート制限に到達

レート制限統計:
  • セッション使用量: 100% (50K / 50K トークン)
  • 実行されたリクエスト: この時間に127回
  • リセットまでの時間: ~47分 (04:30 UTCにリセット)

セッション進捗:
  • 完了したタスク: 3/5
  • 現在のタスク: "Add swarm mode CLI flags"
  • ブランチ: auto/github-54
  • 完了した反復: 12

制限がリセットされたら再開するには:
  ralph-starter run

ヒント: https://claude.ai/settings で制限を確認
```

これは以下に役立ちます:
- いつ再開できるか正確に知る
- 現在のセッションの進捗を追跡
- 使用パターンを理解

### コスト追跡

ループ中の推定トークン使用量とコストを追跡:

```bash
# コスト追跡はデフォルトで有効
ralph-starter run "build X"

# コスト追跡を無効化
ralph-starter run "build X" --no-track-cost
```

コスト追跡が提供:
- ループ中に表示される**反復ごとのコスト**
- トークンとコストの**累計合計**
- ループ終了時の**コストサマリー**
- 各反復の`activity.md`に**記録されたコスト**
- 残りの反復の**予測コスト**(3+反復後)

コスト推定のサポートモデル:
- Claude 3 Opus (100万トークンあたり$15/$75)
- Claude 3.5 Sonnet (100万トークンあたり$3/$15)
- Claude 3.5 Haiku (100万トークンあたり$0.25/$1.25)
- GPT-4 (100万トークンあたり$30/$60)
- GPT-4 Turbo (100万トークンあたり$10/$30)

## Ralph Playbookワークフロー

ralph-starterは[Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/)方法論に従います:

```bash
# 1. Ralph Playbookファイルを初期化
ralph-starter init

# 2. specs/フォルダに仕様を記述

# 3. 実装計画を作成
ralph-starter plan

# 4. 計画を実行
ralph-starter run --commit --validate
```

これは作成:
- `AGENTS.md` - エージェント指示と検証コマンド
- `PROMPT_plan.md` - 計画プロンプトテンプレート
- `PROMPT_build.md` - ビルドプロンプトテンプレート
- `IMPLEMENTATION_PLAN.md` - 優先順位付きタスクリスト
- `specs/` - 仕様ファイル

## コマンド

| コマンド | 説明 |
|---------|-------------|
| `ralph-starter` | インタラクティブウィザードを起動 |
| `ralph-starter run [task]` | 自律コーディングループを実行 |
| `ralph-starter auto` | GitHub/Linearからissuesをバッチ処理 |
| `ralph-starter integrations <action>` | 統合を管理(list、help、test、fetch) |
| `ralph-starter plan` | 仕様から実装計画を作成 |
| `ralph-starter init` | プロジェクトでRalph Playbookを初期化 |
| `ralph-starter setup` | 環境とAPIキーを対話的に構成 |
| `ralph-starter check` | システム要件と接続性を確認 |
| `ralph-starter ideas` | プロジェクトアイデアをブレインストーミング |
| `ralph-starter presets` | 利用可能なワークフロープリセットをリスト |
| `ralph-starter mcp` | MCPサーバーとして起動 |
| `ralph-starter config <action>` | 認証情報を管理 |
| `ralph-starter source <action>` | 入力ソースを管理(レガシー) |
| `ralph-starter skill add <repo>` | エージェントスキルをインストール |

## `run`のオプション

### コアオプション

| フラグ | 説明 |
|------|-------------|
| `--auto` | 許可プロンプトをスキップ **(デフォルト: true)** |
| `--no-auto` | 手動許可承認が必要 |
| `--commit` | タスク後に自動コミット |
| `--push` | コミットをリモートにプッシュ |
| `--pr` | プルリクエストを作成 |
| `--validate` | テスト/lint/buildを実行(バックプレッシャー) |
| `--agent <name>` | 使用するエージェントを指定 |
| `--max-iterations <n>` | 最大ループ反復(デフォルト: 50) |

### デバッグモード

実行中の詳細な出力を見るには`RALPH_DEBUG=1`を使用:

```bash
# 詳細なエージェント出力、タイミング、プロンプトを表示
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# GitHub issueでデバッグ
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

デバッグモードは表示:
- 実行される正確なコマンド
- リアルタイムのエージェント出力
- タイミング情報
- エラー詳細

### ワークフロープリセット

| フラグ | 説明 |
|------|-------------|
| `--preset <name>` | ワークフロープリセットを使用(feature、tdd-red-green、debugなど) |

```bash
# すべての利用可能なプリセットをリスト
ralph-starter presets

# プリセットを使用
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### 終了検出

| フラグ | 説明 |
|------|-------------|
| `--completion-promise <string>` | タスク完了を検出するカスタム文字列 |
| `--require-exit-signal` | 完了に明示的な`EXIT_SIGNAL: true`が必要 |

```bash
# エージェントが"FEATURE_DONE"を出力したら停止
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# 明示的な終了シグナルが必要
ralph-starter run --require-exit-signal "build Y"
```

### セーフティコントロール

| フラグ | 説明 |
|------|-------------|
| `--rate-limit <n>` | 1時間あたりの最大API呼び出し(デフォルト: 無制限) |
| `--circuit-breaker-failures <n>` | 停止前の最大連続失敗(デフォルト: 3) |
| `--circuit-breaker-errors <n>` | 停止前の同じエラーの最大発生回数(デフォルト: 5) |
| `--track-progress` | activity.mdに進捗を書き込み(デフォルト: true) |
| `--no-track-progress` | 進捗追跡を無効化 |
| `--track-cost` | トークン使用量と推定コストを追跡(デフォルト: true) |
| `--no-track-cost` | コスト追跡を無効化 |

```bash
# 1時間あたり50回のAPI呼び出しに制限
ralph-starter run --rate-limit 50 "build X"

# 2回連続失敗後に停止
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### ソースオプション

| フラグ | 説明 |
|------|-------------|
| `--from <source>` | ソースから仕様を取得 |
| `--project <name>` | ソースのプロジェクトフィルター |
| `--label <name>` | ソースのラベルフィルター |
| `--status <status>` | ソースのステータスフィルター |
| `--limit <n>` | ソースからの最大アイテム数 |
| `--issue <n>` | 特定のissue番号(GitHub) |
| `--output-dir <path>` | タスクを実行するディレクトリ(プロンプトをスキップ) |
| `--prd <file>` | markdownからタスクを読み取り |

## 設定コマンド

```bash
# 認証情報を設定
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# 設定を表示
ralph-starter config list
ralph-starter config get linear.apiKey

# 削除
ralph-starter config delete linear.apiKey
```

## 例: SaaSダッシュボードの構築

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# 魔法が起こるのを見る...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## ralph-starterのテスト

### クイックテスト(APIキー不要)

ralph-starterは公開URLでテストできます - APIキーは不要:

```bash
# 公開GitHub gistまたは生のmarkdownでテスト
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# GitHub issuesでテスト(gh CLIログインが必要)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### ウィザードのテスト

```bash
# インタラクティブウィザードを起動
ralph-starter

# またはアイデアモードをテスト
ralph-starter ideas
```

### 独自の仕様でテスト

```bash
# シンプルな仕様ファイルを作成
echo "Build a simple counter app with React" > my-spec.md

# ローカルファイルで実行
ralph-starter run --from ./my-spec.md
```

### ソース接続性の確認

統合を使用する前に、動作していることを確認:

```bash
# どの統合が利用可能か確認
ralph-starter integrations list

# 各統合をテスト
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# アイテムをプレビュー(ドライラン)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## APIキー設定

### オプション1: 環境変数(開発者に推奨)

シェルプロファイルまたは`.env`ファイルで環境変数を設定:

```bash
# ~/.bashrc、~/.zshrc、または.envファイルに追加
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

環境変数は設定ファイルよりも優先されます。

### オプション2: 設定コマンド

CLIを使用して認証情報を保存:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

認証情報は`~/.ralph-starter/sources.json`に保存されます。

### 環境変数リファレンス

| ソース | 環境変数 | 設定キー |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## 要件

- Node.js 18+
- 少なくとも1つのコーディングエージェントがインストールされている(Claude Code、Cursorなど)
- Git(自動化機能用)
- GitHub CLI `gh`(PR作成とGitHubソース用)

## ドキュメント

完全なドキュメントは以下で入手可能: https://ralphstarter.ai

## 貢献

貢献を歓迎します! ガイドラインについては[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

- **機能リクエストとアイデア**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **プロジェクトテンプレート**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

カスタム統合、エージェントの作成、またはプログラマティックAPIの使用については、[開発者拡張ガイド](https://ralphstarter.ai/docs/guides/extending-ralph-starter)を参照してください。

## ライセンス

MIT
