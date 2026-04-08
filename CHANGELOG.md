# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2026-04-08

### Added
- OpenSpec as builtin source: `--from openspec:my-feature` (#320)
- Spec validator with completeness scoring (0-100) and `--spec-validate` flag (#321)
- `ralph-starter spec` command: validate, list, summary subcommands (#321)
- Figma CLI docs page (`docs/docs/cli/figma.md`) (#321)
- SDD blog post, LinkedIn article (PT-BR), Twitter thread (EN) (#321)

### Fixed
- Broken `/docs/cli/figma` link in HeroSection that caused all docs CI failures (#321)
- Removed `content/` directory from git tracking (#322)

## [0.5.0] - 2026-04-08

### Added
- Interactive integration wizards: `ralph-starter github`, `ralph-starter linear`, `ralph-starter notion` (#270, #271, #272)
- Linear status sync during loop execution via `--linear-sync` flag (#274)
- Agent reviewer: LLM-powered diff review before commit via `--review` flag (#292)
- Headless mode and `--no-auto-skills` flag (#294)
- Modular SDK agent runtimes: Anthropic SDK, OpenCode SDK (#293)
- Amp (Sourcegraph) as first-class agent with SDK + CLI support (#291)
- VHS terminal demo tape files (#264)
- FAQPage and HowTo JSON-LD schemas for SEO/AEO (#267)
- Randomized hero terminal demo across integrations (#263)

### Changed
- Bumped 12 dependencies including esbuild, yaml, inquirer, simple-git, lint-staged
- Updated CI actions: codecov v6, codeql-action v4.35.1, pnpm/action-setup v5

### Documentation
- English blog post on Figma-to-code visual validation (#265)



## [0.4.0] - 2026-03-05

### Added
- visual validation, notable components, and Figma context improvements (#254)
- enhance Figma integration with full API property coverage (#251)
- Figma-specific agent prompts, auto-inject tokens, spec cap (#248)
- expose --max-cost CLI flag with cost threshold warnings (#247)
- unified task management across GitHub & Linear (#196)

### Fixed
- show model name and cost in loop header (#249)
- add Tailwind v4 @theme inline guidance to prevent v3 patterns (#246)
- auto mode gets stuck in validation loop on pre-existing test failures (#245)
- prevent PR targeting same branch and duplicated prefix (#244)
- show task title instead of agent name in loop header (#242)

### Changed
- add context-builder and task-executor tests (#250)

## [0.3.1] - 2026-02-19

### Documentation & Blog
- SEO-optimized blog posts with enriched content and proper og:image cards
- Fixed CLI command syntax across all blog posts
- Humanized AI writing patterns in 14 blog posts
- Added i18n translations (ES, FR, DE, JA, KO, ZH, PT, NL)
- Generated branded blog card images (1200x630)

### npm Package
- Reduced npm package size by excluding source maps and dev files via .npmignore

### Dependencies
- Bump @biomejs/biome from 2.3.14 to 2.4.0
- Bump @anthropic-ai/sdk from 0.73.0 to 0.74.0
- Bump simple-git from 3.30.0 to 3.31.1
- Bump inquirer from 13.2.2 to 13.2.4
- Bump github/codeql-action from 4.32.2 to 4.32.3

## [0.2.1] - 2026-02-12

### Fixed
- make auto-install opt-in (#174)

## [0.1.1-beta.16] - 2026-02-07

### Added
- add seo category to template filters (#142)
- enforce pnpm, vitest v4, esbuild v0.27, security fixes (#136)

### Fixed
- update codeql-action SHA and harden workflow patterns (#147)
- fix release workflow for pnpm and update scorecard action (#144)
- rename changelog script to .cjs for ESM compatibility (#143)
- pin GitHub Actions to SHA hashes and add LICENSE (#141)

## [0.1.1-beta.15] - 2026-02-06

### Added
- Auto mode improvements with semantic PR titles and AUTO label
- PR body formatter with issue linking
- Figma content extraction mode

### Fixed
- Auto mode cascading branches and PRs issue

### Changed
- Landing page improvements and new standalone documentation pages
- README structure improvements

## [0.1.1-beta.14] - 2026-02-05

### Changed
- Updated and cleaned up root markdown files

## [0.1.1-beta.13] - 2026-02-05

### Changed
- Updated README with Figma integration, more agents, and LLM providers documentation

## [0.1.1-beta.12] - 2026-02-05

### Added
- Figma integration for design-to-code workflows

## [0.1.1-beta.11] - 2026-02-03

### Changed
- Replaced Discussions links with Templates

## [0.1.1-beta.10] - 2026-02-03

### Added
- ralph-ideas and ralph-templates repository references

### Fixed
- Security: prevent path traversal and secure credential storage

## [0.1.1-beta.9] - 2026-02-03

### Fixed
- Removed broken docs and coverage badges

## [0.1.1-beta.8] - 2026-02-03

### Added
- `--prd` flag to work through PRD task lists
- GitHub Sponsors funding configuration

## [0.1.1-beta.7] - 2026-02-03

### Changed
- Dependency updates (commander, eslint, @types/node)

## [0.1.1-beta.6] - 2026-01-30

### Fixed
- Task progression and iteration-specific instructions

## [0.1.1-beta.5] - 2026-01-30

### Fixed
- Extract tasks from spec to enable dynamic loop headers
- CI: added missing permissions to release workflow

## [0.1.1-beta.4] - 2026-01-30

### Fixed
- Always use smart iteration calculation instead of hardcoded default
- CI: create release PR after source PR is merged
- CI: trigger auto-label on PR open/sync events

### Changed
- Removed unused ASCII art and functions

## [0.1.1-beta.3] - 2026-01-30

### Added
- ralph-ideas integration and configurable default issues repo
- Automated release workflow with candidate-release labels
- OSS best practices and community health files
- Answer Engine Optimization (AEO) features for docs

### Fixed
- GitHub source improvements
- Docs meta tags and removed Todoist integration

### Changed
- Dynamic CLI version display
- Dependency updates (zod, pdf-parse, actions/checkout, etc.)

## [0.1.1-beta.2] - 2026-01-30

### Changed
- Dynamic CLI version bump

## [0.1.1-beta.1] - 2026-01-30

### Added
- Initial beta release with automated release workflow

## [0.1.0-beta.1] - 2025-01-27

### Added
- Interactive wizard for project generation (`ralph-starter`)
- Idea brainstorming mode with curated project ideas (`ralph-starter ideas`)
- Multi-provider LLM support (Anthropic, OpenAI, OpenRouter)
- Claude Code CLI integration for zero-config AI execution
- Setup wizard for first-time configuration (`ralph-starter setup`)
- Task progress tracking with time and cost estimates
- Validation loop with auto-retry on failures
- "Improve existing project" wizard option for Ralph projects
- Conventional commits enforcement with commitlint
- Release scripts for npm publishing

### Fixed
- Task name markdown stripping in progress display
- Footer link reliability rules in generated projects
- Time estimate accuracy (reduced from conservative estimates)
- Loop/task number display consistency

### Changed
- Removed ASCII art from completion screen
- Unified task/loop numbering in executor output
- Simplified progress display with real-time step detection
