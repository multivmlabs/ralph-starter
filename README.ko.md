> [English](README.md) | [Portugues](README.pt.md) | [Espanol](README.es.md) | [Francais](README.fr.md) | [Turkce](README.tr.md) | [Deutsch](README.de.md) | [العربية](README.ar.md) | [简体中文](README.zh-Hans.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

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
  <strong>도구를 연결하고, AI 코딩 루프를 실행하고, 더 빠르게 배포하세요.</strong>
</h3>

<p align="center">
  <em>GitHub, Linear, Notion, Figma 등에서 스펙을 가져온 다음 AI가 자율적으로 빌드하게 하세요.</em>
</p>

<p align="center">
  <a href="#통합">통합</a> •
  <a href="#빠른-시작">빠른 시작</a> •
  <a href="#기능">기능</a> •
  <a href="https://ralphstarter.ai">문서</a>
</p>

---


대부분의 AI 코딩 도구는 독립적으로 작동합니다. 작업을 설명하면 AI가 빌드하고 끝입니다.

**ralph-starter**는 다릅니다. **기존 워크플로우에 연결**되어 GitHub 이슈, Linear 티켓, Notion 문서 또는 모든 URL에서 스펙을 가져온 다음 작업이 완료될 때까지 자율적인 AI 루프를 실행합니다.

```bash
# GitHub 이슈에서 빌드
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Linear 티켓에서 빌드
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Notion 스펙에서 빌드
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# 또는 원하는 것을 설명하세요
ralph-starter run "build a todo app with React" --commit
```

---

## 통합

ralph-starter는 즉시 사용 가능한 도구와 통합됩니다:

| 통합 | 인증 방법 | 가져오는 내용 |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (권장) 또는 API 토큰 | 이슈, PR, 파일 |
| **Linear** | `linear` CLI 또는 API 키 | 팀/프로젝트별 이슈 |
| **Notion** | 없음 (공개) 또는 API 토큰 (비공개) | 페이지, 데이터베이스 |
| **Figma** | API 토큰 | 디자인 스펙, 토큰, 자산 및 콘텐츠 추출 |
| **URLs** | 없음 | 모든 공개 markdown/HTML |
| **파일** | 없음 | 로컬 markdown, PDF |

```bash
# 사용 가능한 통합 확인
ralph-starter integrations list

# 연결 테스트
ralph-starter integrations test github
ralph-starter integrations test linear

# 실행 전 데이터 미리보기
ralph-starter integrations fetch github owner/repo
```

> **더 많은 통합을 원하시나요?** PR을 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하여 시작하세요.

---

## 목차

- [통합](#통합)
- [빠른 시작](#빠른-시작)
- [기능](#기능)
- [명령어](#명령어)
- [설정](#api-키-설정)
- [기여하기](#기여하기)

---

### 주요 기능

| 기능 | 설명 |
|---------|-------------|
| **통합** | GitHub, Linear, Notion, Figma, URL, 파일에서 스펙 가져오기 |
| **멀티 에이전트 지원** | Claude Code, Cursor, Copilot, Gemini CLI 등과 작동 |
| **대화형 마법사** | AI로 개선된 스펙과 함께 안내형 프로젝트 생성 |
| **16+ 워크플로우 프리셋** | 사전 구성된 모드: feature, tdd, debug, review 등 |
| **회로 차단기** | 반복된 실패 후 정체된 루프 자동 중지 |
| **비용 추적** | 반복당 토큰 사용량 및 비용 추정 |
| **Git 자동화** | 자동 커밋, 푸시 및 PR 생성 |
| **백프레셔 검증** | 각 반복 후 테스트/린트/빌드 실행 |
| **MCP Server** | Claude Desktop 또는 모든 MCP 클라이언트에서 사용 |

### 빠른 예제

```bash
# 간단한 작업
ralph-starter run "build a todo app" --commit --validate

# 프리셋 사용
ralph-starter run --preset tdd-red-green "add user authentication"

# 안전 제어 사용
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# 대화형 마법사
ralph-starter
```

---

## Ralph Wiggum이란?

[ghuntley.com/ralph](https://ghuntley.com/ralph/)에서 Ralph Wiggum 기법에 대해 알아보세요.

## 설치

```bash
npm install -g ralph-starter
# 또는
npx ralph-starter
```

설치 후 설정 마법사를 실행하고 환경을 확인하세요:

```bash
ralph-starter setup    # API 키 및 환경 설정 구성
ralph-starter check    # 시스템 요구사항 및 연결 확인
```

## 빠른 시작

### 모든 사용자를 위해 (개발자가 아니어도 환영합니다!)

인수 없이 `ralph-starter`를 실행하여 대화형 마법사를 시작하세요:

```bash
ralph-starter
```

마법사는 다음을 수행합니다:
1. 프로젝트 아이디어가 있는지 묻습니다 (또는 브레인스토밍 도와드립니다)
2. AI로 아이디어를 개선합니다
3. 기술 스택을 커스터마이즈할 수 있습니다
4. 프로젝트를 자동으로 빌드합니다

### 무엇을 빌드할지 모르시나요?

```bash
ralph-starter ideas
```

이것은 프로젝트 아이디어를 발견하는 데 도움이 되는 **아이디어 모드** - 브레인스토밍 세션을 시작합니다:
- **AI와 브레인스토밍** - 창의적인 제안 받기
- **트렌딩 아이디어 보기** - 2025-2026 기술 트렌드 기반
- **내 기술 기반** - 당신이 아는 기술에 맞춤화
- **문제 해결** - 당신을 좌절시키는 것을 고치는 데 도움

### 개발자를 위해

```bash
# 단일 작업 실행
ralph-starter run "build a todo app with React"

# git 자동화 사용
ralph-starter run "add user authentication" --commit --pr

# 검증 사용 (백프레셔)
ralph-starter run "refactor auth" --commit --validate

# 외부 소스에서 스펙 가져오기
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# 특정 GitHub 이슈 가져오기
ralph-starter run --from github --project owner/repo --issue 123

# 출력 디렉토리 지정 ("어디서 실행?" 프롬프트 건너뛰기)
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### 기존 프로젝트 작업

ralph-starter는 마법사를 실행할 때 기존 프로젝트를 자동으로 감지합니다:

**Ralph Playbook 프로젝트** (AGENTS.md, IMPLEMENTATION_PLAN.md 등이 있음):
```bash
cd my-ralph-project
ralph-starter
```
마법사가 Ralph Playbook 파일을 감지하고 다음을 수행할 수 있습니다:
- 작업 계속 (빌드 루프 실행)
- 구현 계획 재생성
- 새 스펙 추가

**언어 프로젝트** (package.json, pyproject.toml, Cargo.toml, go.mod가 있음):
```bash
cd my-existing-app
ralph-starter
```
마법사가 프로젝트 타입을 감지하고 다음을 수행할 수 있습니다:
- 기존 프로젝트에 기능 추가
- 하위 폴더에 새 프로젝트 생성

## 기능

### 대화형 마법사
인수 없이 `ralph-starter`를 실행하여 안내받으세요:
- 평문 영어로 아이디어 설명
- AI가 개선하고 기능 제안
- 기술 스택 선택
- 자동으로 init → plan → build 실행

### 아이디어 모드
아직 무엇을 빌드할지 모르는 사용자를 위해:
```bash
ralph-starter ideas
```

### MCP Server
Claude Desktop 또는 모든 MCP 클라이언트에서 ralph-starter 사용:

```bash
ralph-starter mcp
```

Claude Desktop 설정에 추가:
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

**사용 가능한 MCP 도구:**
- `ralph_init` - Ralph Playbook 초기화
- `ralph_plan` - 구현 계획 생성
- `ralph_run` - 코딩 루프 실행
- `ralph_status` - 진행 상황 확인
- `ralph_validate` - 테스트/린트/빌드 실행

### 멀티 에이전트 지원
선호하는 코딩 에이전트와 작동:
- **Claude Code** (권장)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### LLM 제공자
ralph-starter는 내부 기능을 위해 여러 LLM 제공자를 지원합니다:

| 제공자 | 환경 변수 | 설명 |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude 모델 (기본값) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 및 GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 하나의 API로 100개 이상의 모델 |

이 키는 ralph-starter의 내부 LLM 호출용입니다. 코딩 에이전트는 자체 인증을 처리합니다.

### Git 자동화
```bash
ralph-starter run "your task" --commit      # 작업 후 자동 커밋
ralph-starter run "your task" --push        # 원격으로 푸시
ralph-starter run "your task" --pr          # 완료 시 PR 생성
```

### 백프레셔 검증
```bash
ralph-starter run "your task" --validate    # 각 반복 후 테스트/린트/빌드 실행
```

`--validate` 플래그는 각 반복 후 테스트, 린트 및 빌드 명령(AGENTS.md 또는 package.json에서)을 실행합니다. 검증이 실패하면 에이전트가 문제를 수정하도록 피드백을 받습니다.

### 워크플로우 프리셋

일반적인 개발 시나리오를 위한 사전 구성된 설정:

```bash
# 16개 이상의 프리셋 나열
ralph-starter presets

# 프리셋 사용
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**사용 가능한 프리셋:**
| 카테고리 | 프리셋 |
|----------|---------|
| 개발 | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| 디버깅 | `debug`, `incident-response`, `code-archaeology` |
| 리뷰 | `review`, `pr-review`, `adversarial-review` |
| 문서화 | `docs`, `documentation-first` |
| 전문화 | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### 회로 차단기

정체된 루프를 자동으로 중지합니다:

```bash
# 3번의 연속 실패 후 중지 (기본값)
ralph-starter run "build X" --validate

# 사용자 정의 임계값
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

회로 차단기는 다음을 모니터링합니다:
- **연속 실패**: N번의 연속 검증 실패 후 중지
- **동일한 오류 횟수**: 동일한 오류가 N번 반복되면 중지

### 진행 상황 추적

반복 로그를 `activity.md`에 기록합니다:

```bash
# 기본적으로 활성화됨
ralph-starter run "build X"

# 필요하지 않으면 비활성화
ralph-starter run "build X" --no-track-progress
```

각 반복은 다음을 기록합니다:
- 타임스탬프 및 기간
- 상태 (완료됨, 실패함, 차단됨)
- 검증 결과
- 커밋 정보

### 파일 기반 완료

루프는 완료 신호를 자동으로 확인합니다:
- 프로젝트 루트의 `RALPH_COMPLETE` 파일
- `.ralph-done` 마커 파일
- `IMPLEMENTATION_PLAN.md`의 모든 작업이 `[x]`로 표시됨

### 속도 제한

비용 관리를 위해 API 호출 빈도 제어:

```bash
# 시간당 50회 호출로 제한
ralph-starter run --rate-limit 50 "build X"
```

**속도 제한에 도달하면** ralph-starter는 상세한 통계를 표시합니다:

```
⚠ Claude 속도 제한 도달

속도 제한 통계:
  • 세션 사용량: 100% (50K / 50K 토큰)
  • 요청 수: 이번 시간에 127회
  • 재설정까지 시간: ~47분 (04:30 UTC에 재설정)

세션 진행 상황:
  • 완료된 작업: 3/5
  • 현재 작업: "Add swarm mode CLI flags"
  • 브랜치: auto/github-54
  • 완료된 반복: 12

제한이 재설정되면 재개하려면:
  ralph-starter run

팁: https://claude.ai/settings에서 제한을 확인하세요
```

이를 통해 다음을 수행할 수 있습니다:
- 재개할 수 있는 정확한 시간 파악
- 현재 세션의 진행 상황 추적
- 사용 패턴 이해

### 비용 추적

루프 중 예상 토큰 사용량 및 비용 추적:

```bash
# 비용 추적은 기본적으로 활성화됨
ralph-starter run "build X"

# 비용 추적 비활성화
ralph-starter run "build X" --no-track-cost
```

비용 추적은 다음을 제공합니다:
- 루프 중 표시되는 **반복당 비용**
- 토큰 및 비용의 **누적 합계**
- 루프 종료 시 **비용 요약**
- 각 반복에 대해 `activity.md`에 **기록된 비용**
- 남은 반복에 대한 **예상 비용** (3개 이상의 반복 후)

비용 추정 지원 모델:
- Claude 3 Opus (1M 토큰당 $15/$75)
- Claude 3.5 Sonnet (1M 토큰당 $3/$15)
- Claude 3.5 Haiku (1M 토큰당 $0.25/$1.25)
- GPT-4 (1M 토큰당 $30/$60)
- GPT-4 Turbo (1M 토큰당 $10/$30)

## Ralph Playbook 워크플로우

ralph-starter는 [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) 방법론을 따릅니다:

```bash
# 1. Ralph Playbook 파일 초기화
ralph-starter init

# 2. specs/ 폴더에 스펙 작성

# 3. 구현 계획 생성
ralph-starter plan

# 4. 계획 실행
ralph-starter run --commit --validate
```

이것은 다음을 생성합니다:
- `AGENTS.md` - 에이전트 지침 및 검증 명령
- `PROMPT_plan.md` - 계획 프롬프트 템플릿
- `PROMPT_build.md` - 빌드 프롬프트 템플릿
- `IMPLEMENTATION_PLAN.md` - 우선순위가 지정된 작업 목록
- `specs/` - 스펙 파일

## 명령어

| 명령어 | 설명 |
|---------|-------------|
| `ralph-starter` | 대화형 마법사 시작 |
| `ralph-starter run [task]` | 자율 코딩 루프 실행 |
| `ralph-starter auto` | GitHub/Linear의 이슈 일괄 처리 |
| `ralph-starter integrations <action>` | 통합 관리 (list, help, test, fetch) |
| `ralph-starter plan` | 스펙에서 구현 계획 생성 |
| `ralph-starter init` | 프로젝트에서 Ralph Playbook 초기화 |
| `ralph-starter setup` | 환경 및 API 키 대화형 구성 |
| `ralph-starter check` | 시스템 요구사항 및 연결 확인 |
| `ralph-starter ideas` | 프로젝트 아이디어 브레인스토밍 |
| `ralph-starter presets` | 사용 가능한 워크플로우 프리셋 나열 |
| `ralph-starter mcp` | MCP 서버로 시작 |
| `ralph-starter config <action>` | 자격 증명 관리 |
| `ralph-starter source <action>` | 입력 소스 관리 (레거시) |
| `ralph-starter skill add <repo>` | 에이전트 스킬 설치 |

## `run`을 위한 옵션

### 핵심 옵션

| 플래그 | 설명 |
|------|-------------|
| `--auto` | 권한 프롬프트 건너뛰기 **(기본값: true)** |
| `--no-auto` | 수동 권한 승인 필요 |
| `--commit` | 작업 후 자동 커밋 |
| `--push` | 원격으로 커밋 푸시 |
| `--pr` | 풀 리퀘스트 생성 |
| `--validate` | 테스트/린트/빌드 실행 (백프레셔) |
| `--agent <name>` | 사용할 에이전트 지정 |
| `--max-iterations <n>` | 최대 루프 반복 (기본값: 50) |

### 디버그 모드

실행 중 상세한 출력을 보려면 `RALPH_DEBUG=1`을 사용하세요:

```bash
# 상세한 에이전트 출력, 타이밍 및 프롬프트 보기
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# GitHub 이슈로 디버그
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

디버그 모드는 다음을 표시합니다:
- 실행 중인 정확한 명령
- 실시간 에이전트 출력
- 타이밍 정보
- 오류 세부 정보

### 워크플로우 프리셋

| 플래그 | 설명 |
|------|-------------|
| `--preset <name>` | 워크플로우 프리셋 사용 (feature, tdd-red-green, debug 등) |

```bash
# 사용 가능한 모든 프리셋 나열
ralph-starter presets

# 프리셋 사용
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### 종료 감지

| 플래그 | 설명 |
|------|-------------|
| `--completion-promise <string>` | 작업 완료 감지를 위한 사용자 정의 문자열 |
| `--require-exit-signal` | 완료를 위해 명시적인 `EXIT_SIGNAL: true` 필요 |

```bash
# 에이전트가 "FEATURE_DONE"을 출력하면 중지
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# 명시적인 종료 신호 필요
ralph-starter run --require-exit-signal "build Y"
```

### 안전 제어

| 플래그 | 설명 |
|------|-------------|
| `--rate-limit <n>` | 시간당 최대 API 호출 수 (기본값: 무제한) |
| `--circuit-breaker-failures <n>` | 중지 전 최대 연속 실패 (기본값: 3) |
| `--circuit-breaker-errors <n>` | 중지 전 동일한 오류 발생 최대 횟수 (기본값: 5) |
| `--track-progress` | activity.md에 진행 상황 기록 (기본값: true) |
| `--no-track-progress` | 진행 상황 추적 비활성화 |
| `--track-cost` | 토큰 사용량 및 예상 비용 추적 (기본값: true) |
| `--no-track-cost` | 비용 추적 비활성화 |

```bash
# 시간당 50회 API 호출로 제한
ralph-starter run --rate-limit 50 "build X"

# 2번의 연속 실패 후 중지
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### 소스 옵션

| 플래그 | 설명 |
|------|-------------|
| `--from <source>` | 소스에서 스펙 가져오기 |
| `--project <name>` | 소스용 프로젝트 필터 |
| `--label <name>` | 소스용 레이블 필터 |
| `--status <status>` | 소스용 상태 필터 |
| `--limit <n>` | 소스에서 최대 항목 수 |
| `--issue <n>` | 특정 이슈 번호 (GitHub) |
| `--output-dir <path>` | 작업을 실행할 디렉토리 (프롬프트 건너뛰기) |
| `--prd <file>` | markdown에서 작업 읽기 |

## Config 명령어

```bash
# 자격 증명 설정
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# 설정 보기
ralph-starter config list
ralph-starter config get linear.apiKey

# 제거
ralph-starter config delete linear.apiKey
```

## 예제: SaaS 대시보드 빌드

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# 마법이 일어나는 것을 지켜보세요...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## ralph-starter 테스트

### 빠른 테스트 (API 키 필요 없음)

공개 URL로 ralph-starter를 테스트할 수 있습니다 - API 키가 필요하지 않습니다:

```bash
# 공개 GitHub gist 또는 원시 markdown으로 테스트
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# GitHub 이슈로 테스트 (gh CLI 로그인 필요)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### 마법사 테스트

```bash
# 대화형 마법사 시작
ralph-starter

# 또는 아이디어 모드 테스트
ralph-starter ideas
```

### 자체 스펙으로 테스트

```bash
# 간단한 스펙 파일 생성
echo "Build a simple counter app with React" > my-spec.md

# 로컬 파일로 실행
ralph-starter run --from ./my-spec.md
```

### 소스 연결 확인

통합을 사용하기 전에 작동하는지 확인하세요:

```bash
# 사용 가능한 통합 확인
ralph-starter integrations list

# 각 통합 테스트
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# 항목 미리보기 (드라이런)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## API 키 설정

### 옵션 1: 환경 변수 (개발자에게 권장)

쉘 프로필 또는 `.env` 파일에 환경 변수를 설정하세요:

```bash
# ~/.bashrc, ~/.zshrc 또는 .env 파일에 추가
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

환경 변수는 설정 파일보다 우선합니다.

### 옵션 2: Config 명령어

CLI를 사용하여 자격 증명을 저장하세요:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

자격 증명은 `~/.ralph-starter/sources.json`에 저장됩니다.

### 환경 변수 레퍼런스

| 소스 | 환경 변수 | Config 키 |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## 요구 사항

- Node.js 18+
- 최소 하나의 코딩 에이전트 설치 (Claude Code, Cursor 등)
- Git (자동화 기능용)
- GitHub CLI `gh` (PR 생성 및 GitHub 소스용)

## 문서

전체 문서는 https://ralphstarter.ai에서 확인하세요.

## 기여하기

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

- **기능 요청 및 아이디어**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **프로젝트 템플릿**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

사용자 정의 통합, 에이전트 생성 또는 프로그래밍 API 사용에 대해서는 [개발자 확장 가이드](https://ralphstarter.ai/docs/guides/extending-ralph-starter)를 참조하세요.

## 라이선스

MIT
