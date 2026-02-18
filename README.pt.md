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
  <strong>Conecte suas ferramentas. Execute loops de codificação com IA. Entregue mais rápido.</strong>
</h3>

<p align="center">
  <em>Extraia especificações do GitHub, Linear, Notion, Figma e mais — depois deixe a IA construir autonomamente.</em>
</p>

<p align="center">
  <a href="#integracoes">Integrações</a> •
  <a href="#inicio-rapido">Início Rápido</a> •
  <a href="#recursos">Recursos</a> •
  <a href="https://ralphstarter.ai">Documentação</a>
</p>

---


A maioria das ferramentas de codificação com IA trabalham isoladamente. Você descreve uma tarefa, a IA a constrói, pronto.

**ralph-starter** é diferente. Ele **conecta ao seu fluxo de trabalho existente** — extraindo especificações de issues do GitHub, tickets do Linear, documentos do Notion ou qualquer URL — e depois executa loops autônomos de IA até a tarefa estar completa.

```bash
# Construir a partir de uma issue do GitHub
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Construir a partir de um ticket do Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Construir a partir de uma especificação do Notion
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# Ou simplesmente descreva o que você quer
ralph-starter run "build a todo app with React" --commit
```

---

## Integrações

ralph-starter integra com suas ferramentas favoritas de forma nativa:

| Integração | Método de Autenticação | O Que Extrai |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (recomendado) ou token API | Issues, PRs, arquivos |
| **Linear** | `linear` CLI ou chave API | Issues por equipe/projeto |
| **Notion** | Nenhum (público) ou token API (privado) | Páginas, databases |
| **Figma** | Token API | Especificações de design, tokens, ativos e extração de conteúdo |
| **URLs** | Nenhum | Qualquer markdown/HTML público |
| **Arquivos** | Nenhum | Markdown local, PDF |

```bash
# Verificar integrações disponíveis
ralph-starter integrations list

# Testar conectividade
ralph-starter integrations test github
ralph-starter integrations test linear

# Visualizar dados antes de executar
ralph-starter integrations fetch github owner/repo
```

> **Quer mais integrações?** PRs são bem-vindos! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para começar.

---

## Índice

- [Integrações](#integracoes)
- [Início Rápido](#inicio-rapido)
- [Recursos](#recursos)
- [Comandos](#comandos)
- [Configuração](#configuracao-de-chave-api)
- [Contribuindo](#contribuindo)

---

### Recursos Principais

| Recurso | Descrição |
|---------|-------------|
| **Integrações** | Extraia especificações do GitHub, Linear, Notion, Figma, URLs, arquivos |
| **Suporte Multi-Agente** | Funciona com Claude Code, Cursor, Copilot, Gemini CLI e mais |
| **Assistente Interativo** | Criação de projeto guiada com especificações refinadas por IA |
| **16+ Predefinições de Fluxo** | Modos pré-configurados: feature, tdd, debug, review e mais |
| **Circuit Breaker** | Para automaticamente loops travados após falhas repetidas |
| **Rastreamento de Custo** | Estima uso de tokens e custo por iteração |
| **Automação Git** | Auto-commit, push e criação de PR |
| **Validação de Backpressure** | Executa testes/lint/build após cada iteração |
| **Servidor MCP** | Use do Claude Desktop ou qualquer cliente MCP |

### Exemplo Rápido

```bash
# Tarefa simples
ralph-starter run "build a todo app" --commit --validate

# Com predefinição
ralph-starter run --preset tdd-red-green "add user authentication"

# Com controles de segurança
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# Assistente interativo
ralph-starter
```

---

## O que é Ralph Wiggum?

Saiba sobre a técnica Ralph Wiggum em [ghuntley.com/ralph](https://ghuntley.com/ralph/).

## Instalação

```bash
npm install -g ralph-starter
# ou
npx ralph-starter
```

Após instalar, execute o assistente de configuração e verifique seu ambiente:

```bash
ralph-starter setup    # Configurar chaves API e preferências
ralph-starter check    # Verificar requisitos do sistema e conectividade
```

## Início Rápido

### Para Todos (Não-Desenvolvedores São Bem-vindos!)

Basta executar `ralph-starter` sem argumentos para iniciar o assistente interativo:

```bash
ralph-starter
```

O assistente irá:
1. Perguntar se você tem uma ideia de projeto (ou ajudá-lo a criar uma)
2. Refinar sua ideia com IA
3. Permitir que você personalize o stack de tecnologia
4. Construir seu projeto automaticamente

### Não Sabe O Que Construir?

```bash
ralph-starter ideas
```

Isso inicia o **Modo de Ideias** - uma sessão de brainstorming para ajudá-lo a descobrir ideias de projeto:
- **Brainstorm com IA** - Obtenha sugestões criativas
- **Veja ideias em tendência** - Baseadas nas tendências de tecnologia 2025-2026
- **Baseado nas minhas habilidades** - Personalizado para tecnologias que você conhece
- **Resolver um problema** - Ajude a corrigir algo que te frustra

### Para Desenvolvedores

```bash
# Executar uma única tarefa
ralph-starter run "build a todo app with React"

# Com automação git
ralph-starter run "add user authentication" --commit --pr

# Com validação (backpressure)
ralph-starter run "refactor auth" --commit --validate

# Buscar especificações de fontes externas
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# Buscar uma issue específica do GitHub
ralph-starter run --from github --project owner/repo --issue 123

# Especificar diretório de saída (pula o prompt "onde executar?")
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### Trabalhando com Projetos Existentes

ralph-starter detecta automaticamente projetos existentes quando você executa o assistente:

**Projeto Ralph Playbook** (possui AGENTS.md, IMPLEMENTATION_PLAN.md, etc.):
```bash
cd my-ralph-project
ralph-starter
```
O assistente detectará os arquivos do Ralph Playbook e permitirá que você:
- Continue trabalhando (execute o loop de construção)
- Regenere o plano de implementação
- Adicione novas especificações

**Projeto de Linguagem** (possui package.json, pyproject.toml, Cargo.toml, go.mod):
```bash
cd my-existing-app
ralph-starter
```
O assistente detectará o tipo de projeto e permitirá que você:
- Adicione recursos ao projeto existente
- Crie um novo projeto em uma subpasta

## Recursos

### Assistente Interativo
Inicie com `ralph-starter` (sem argumentos) para uma experiência guiada:
- Descreva sua ideia em português simples
- IA refina e sugere recursos
- Escolha seu stack de tecnologia
- Executa automaticamente init → plan → build

### Modo de Ideias
Para usuários que ainda não sabem o que construir:
```bash
ralph-starter ideas
```

### Servidor MCP
Use ralph-starter do Claude Desktop ou qualquer cliente MCP:

```bash
ralph-starter mcp
```

Adicione à configuração do Claude Desktop:
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

**Ferramentas MCP Disponíveis:**
- `ralph_init` - Inicializar Ralph Playbook
- `ralph_plan` - Criar plano de implementação
- `ralph_run` - Executar loop de codificação
- `ralph_status` - Verificar progresso
- `ralph_validate` - Executar testes/lint/build

### Suporte Multi-Agente
Funciona com seus agentes de codificação favoritos:
- **Claude Code** (recomendado)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### Provedores LLM
ralph-starter suporta múltiplos provedores LLM para recursos internos:

| Provedor | Variável de Ambiente | Descrição |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Modelos Claude (padrão) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 e GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ modelos com uma API |

Essas chaves são para chamadas LLM internas do ralph-starter. Agentes de codificação lidam com sua própria autenticação.

### Automação Git
```bash
ralph-starter run "your task" --commit      # Auto-commit após tarefas
ralph-starter run "your task" --push        # Push para remoto
ralph-starter run "your task" --pr          # Criar PR quando concluído
```

### Validação de Backpressure
```bash
ralph-starter run "your task" --validate    # Executar testes/lint/build após cada iteração
```

A flag `--validate` executa comandos de teste, lint e build (de AGENTS.md ou package.json) após cada iteração. Se a validação falhar, o agente recebe feedback para corrigir os problemas.

### Predefinições de Fluxo

Configurações pré-definidas para cenários comuns de desenvolvimento:

```bash
# Listar todas as 16+ predefinições
ralph-starter presets

# Usar uma predefinição
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Predefinições Disponíveis:**
| Categoria | Predefinições |
|----------|---------|
| Desenvolvimento | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Depuração | `debug`, `incident-response`, `code-archaeology` |
| Revisão | `review`, `pr-review`, `adversarial-review` |
| Documentação | `docs`, `documentation-first` |
| Especializado | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Para automaticamente loops que estão travados:

```bash
# Parar após 3 falhas consecutivas (padrão)
ralph-starter run "build X" --validate

# Limites personalizados
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

O circuit breaker monitora:
- **Falhas consecutivas**: Para após N falhas de validação seguidas
- **Contagem de mesmo erro**: Para se o mesmo erro se repetir N vezes

### Rastreamento de Progresso

Escreve logs de iteração em `activity.md`:

```bash
# Habilitado por padrão
ralph-starter run "build X"

# Desabilitar se não for necessário
ralph-starter run "build X" --no-track-progress
```

Cada iteração registra:
- Timestamp e duração
- Status (completo, falhou, bloqueado)
- Resultados de validação
- Informações de commit

### Conclusão Baseada em Arquivo

O loop verifica automaticamente sinais de conclusão:
- Arquivo `RALPH_COMPLETE` na raiz do projeto
- Arquivo marcador `.ralph-done`
- Todas as tarefas marcadas `[x]` em `IMPLEMENTATION_PLAN.md`

### Limitação de Taxa

Controle a frequência de chamadas API para gerenciar custos:

```bash
# Limitar a 50 chamadas por hora
ralph-starter run --rate-limit 50 "build X"
```

**Quando os limites de taxa são atingidos**, ralph-starter exibe estatísticas detalhadas:

```
⚠ Limite de taxa do Claude atingido

Estatísticas de Limite de Taxa:
  • Uso da sessão: 100% (50K / 50K tokens)
  • Requisições feitas: 127 nesta hora
  • Tempo até reinício: ~47 minutos (reinicia às 04:30 UTC)

Progresso da Sessão:
  • Tarefas concluídas: 3/5
  • Tarefa atual: "Add swarm mode CLI flags"
  • Branch: auto/github-54
  • Iterações concluídas: 12

Para retomar quando o limite reiniciar:
  ralph-starter run

Dica: Verifique seus limites em https://claude.ai/settings
```

Isso ajuda você a:
- Saber exatamente quando pode retomar
- Acompanhar o progresso da sua sessão atual
- Entender seus padrões de uso

### Rastreamento de Custo

Rastreie o uso estimado de tokens e custos durante os loops:

```bash
# Rastreamento de custo está habilitado por padrão
ralph-starter run "build X"

# Desabilitar rastreamento de custo
ralph-starter run "build X" --no-track-cost
```

O rastreamento de custo fornece:
- **Custo por iteração** exibido durante o loop
- **Total acumulado** de tokens e custo
- **Resumo de custo** no final do loop
- **Custo registrado** em `activity.md` para cada iteração
- **Custo projetado** para iterações restantes (após 3+ iterações)

Modelos suportados para estimativa de custo:
- Claude 3 Opus ($15/$75 por 1M tokens)
- Claude 3.5 Sonnet ($3/$15 por 1M tokens)
- Claude 3.5 Haiku ($0.25/$1.25 por 1M tokens)
- GPT-4 ($30/$60 por 1M tokens)
- GPT-4 Turbo ($10/$30 por 1M tokens)

## Fluxo de Trabalho Ralph Playbook

ralph-starter segue a metodologia [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/):

```bash
# 1. Inicializar arquivos do Ralph Playbook
ralph-starter init

# 2. Escrever especificações na pasta specs/

# 3. Criar plano de implementação
ralph-starter plan

# 4. Executar o plano
ralph-starter run --commit --validate
```

Isso cria:
- `AGENTS.md` - Instruções do agente e comandos de validação
- `PROMPT_plan.md` - Template de prompt de planejamento
- `PROMPT_build.md` - Template de prompt de construção
- `IMPLEMENTATION_PLAN.md` - Lista de tarefas priorizadas
- `specs/` - Arquivos de especificação

## Comandos

| Comando | Descrição |
|---------|-------------|
| `ralph-starter` | Iniciar assistente interativo |
| `ralph-starter run [task]` | Executar um loop de codificação autônomo |
| `ralph-starter auto` | Processar issues em lote do GitHub/Linear |
| `ralph-starter integrations <action>` | Gerenciar integrações (list, help, test, fetch) |
| `ralph-starter plan` | Criar plano de implementação a partir de especificações |
| `ralph-starter init` | Inicializar Ralph Playbook em um projeto |
| `ralph-starter setup` | Configurar ambiente e chaves API interativamente |
| `ralph-starter check` | Verificar requisitos do sistema e conectividade |
| `ralph-starter ideas` | Brainstorm de ideias de projeto |
| `ralph-starter presets` | Listar predefinições de fluxo disponíveis |
| `ralph-starter mcp` | Iniciar como servidor MCP |
| `ralph-starter config <action>` | Gerenciar credenciais |
| `ralph-starter source <action>` | Gerenciar fontes de entrada (legado) |
| `ralph-starter skill add <repo>` | Instalar habilidades de agente |

## Opções para `run`

### Opções Principais

| Flag | Descrição |
|------|-------------|
| `--auto` | Pular prompts de permissão **(padrão: true)** |
| `--no-auto` | Requerer aprovação manual de permissão |
| `--commit` | Auto-commit após tarefas |
| `--push` | Push de commits para remoto |
| `--pr` | Criar pull request |
| `--validate` | Executar testes/lint/build (backpressure) |
| `--agent <name>` | Especificar agente a usar |
| `--max-iterations <n>` | Máximo de iterações do loop (padrão: 50) |

### Modo de Depuração

Use `RALPH_DEBUG=1` para ver saída detalhada durante a execução:

```bash
# Ver saída detalhada do agente, timing e prompts
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# Depurar com issue do GitHub
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

O modo de depuração mostra:
- Comandos exatos sendo executados
- Saída do agente em tempo real
- Informações de timing
- Detalhes de erro

### Predefinições de Fluxo

| Flag | Descrição |
|------|-------------|
| `--preset <name>` | Usar uma predefinição de fluxo (feature, tdd-red-green, debug, etc.) |

```bash
# Listar todas as predefinições disponíveis
ralph-starter presets

# Usar uma predefinição
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Detecção de Saída

| Flag | Descrição |
|------|-------------|
| `--completion-promise <string>` | String personalizada para detectar conclusão de tarefa |
| `--require-exit-signal` | Requerer `EXIT_SIGNAL: true` explícito para conclusão |

```bash
# Parar quando o agente emitir "FEATURE_DONE"
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Requerer sinal de saída explícito
ralph-starter run --require-exit-signal "build Y"
```

### Controles de Segurança

| Flag | Descrição |
|------|-------------|
| `--rate-limit <n>` | Máximo de chamadas API por hora (padrão: ilimitado) |
| `--circuit-breaker-failures <n>` | Máximo de falhas consecutivas antes de parar (padrão: 3) |
| `--circuit-breaker-errors <n>` | Máximo de ocorrências do mesmo erro antes de parar (padrão: 5) |
| `--track-progress` | Escrever progresso em activity.md (padrão: true) |
| `--no-track-progress` | Desabilitar rastreamento de progresso |
| `--track-cost` | Rastrear uso de tokens e custo estimado (padrão: true) |
| `--no-track-cost` | Desabilitar rastreamento de custo |

```bash
# Limitar a 50 chamadas API por hora
ralph-starter run --rate-limit 50 "build X"

# Parar após 2 falhas consecutivas
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Opções de Fonte

| Flag | Descrição |
|------|-------------|
| `--from <source>` | Buscar especificação da fonte |
| `--project <name>` | Filtro de projeto para fontes |
| `--label <name>` | Filtro de label para fontes |
| `--status <status>` | Filtro de status para fontes |
| `--limit <n>` | Máximo de itens da fonte |
| `--issue <n>` | Número de issue específica (GitHub) |
| `--output-dir <path>` | Diretório para executar tarefa (pula prompt) |
| `--prd <file>` | Ler tarefas do markdown |

## Comandos de Configuração

```bash
# Definir credenciais
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# Ver configuração
ralph-starter config list
ralph-starter config get linear.apiKey

# Remover
ralph-starter config delete linear.apiKey
```

## Exemplo: Construir um Dashboard SaaS

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Assista a mágica acontecer...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## Testando ralph-starter

### Teste Rápido (Sem Chaves API)

Você pode testar ralph-starter com URLs públicas - nenhuma chave API necessária:

```bash
# Testar com um gist público do GitHub ou markdown bruto
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Testar com issues do GitHub (requer login gh CLI)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Testando o Assistente

```bash
# Iniciar o assistente interativo
ralph-starter

# Ou testar o modo de ideias
ralph-starter ideas
```

### Testando com Suas Próprias Especificações

```bash
# Criar um arquivo de especificação simples
echo "Build a simple counter app with React" > my-spec.md

# Executar com arquivo local
ralph-starter run --from ./my-spec.md
```

### Verificando Conectividade da Fonte

Antes de usar uma integração, verifique se está funcionando:

```bash
# Verificar quais integrações estão disponíveis
ralph-starter integrations list

# Testar cada integração
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# Visualizar itens (dry run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## Configuração de Chave API

### Opção 1: Variáveis de Ambiente (Recomendado para Desenvolvedores)

Defina variáveis de ambiente no perfil do seu shell ou arquivo `.env`:

```bash
# Adicionar ao ~/.bashrc, ~/.zshrc, ou arquivo .env
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Variáveis de ambiente têm precedência sobre o arquivo de configuração.

### Opção 2: Comando de Configuração

Use o CLI para armazenar credenciais:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Credenciais são armazenadas em `~/.ralph-starter/sources.json`.

### Referência de Variável de Ambiente

| Fonte | Variável de Ambiente | Chave de Configuração |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## Requisitos

- Node.js 18+
- Pelo menos um agente de codificação instalado (Claude Code, Cursor, etc.)
- Git (para recursos de automação)
- GitHub CLI `gh` (para criação de PR e fonte GitHub)

## Documentação

Documentação completa disponível em: https://ralphstarter.ai

## Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes.

- **Solicitações de recursos e ideias**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **Templates de projeto**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

Para criar integrações personalizadas, agentes ou usar a API programática, veja o [Guia de Extensão do Desenvolvedor](https://ralphstarter.ai/docs/guides/extending-ralph-starter).

## Licença

MIT
