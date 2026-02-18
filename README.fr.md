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
  <strong>Connectez vos outils. Exécutez des boucles de codage IA. Livrez plus rapidement.</strong>
</h3>

<p align="center">
  <em>Extrayez des spécifications depuis GitHub, Linear, Notion, Figma et plus — puis laissez l'IA construire de manière autonome.</em>
</p>

<p align="center">
  <a href="#integrations">Intégrations</a> •
  <a href="#demarrage-rapide">Démarrage Rapide</a> •
  <a href="#fonctionnalites">Fonctionnalités</a> •
  <a href="https://ralphstarter.ai">Documentation</a>
</p>

---


La plupart des outils de codage IA fonctionnent de manière isolée. Vous décrivez une tâche, l'IA la construit, terminé.

**ralph-starter** est différent. Il **se connecte à votre workflow existant** — en extrayant des spécifications depuis les issues GitHub, les tickets Linear, les documents Notion ou toute URL — puis exécute des boucles IA autonomes jusqu'à ce que la tâche soit terminée.

```bash
# Construire depuis une issue GitHub
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Construire depuis un ticket Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Construire depuis une spécification Notion
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# Ou décrivez simplement ce que vous voulez
ralph-starter run "build a todo app with React" --commit
```

---

## Intégrations

ralph-starter s'intègre nativement avec vos outils préférés :

| Intégration | Méthode d'Authentification | Ce Qu'il Extrait |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (recommandé) ou token API | Issues, PRs, fichiers |
| **Linear** | `linear` CLI ou clé API | Issues par équipe/projet |
| **Notion** | Aucune (public) ou token API (privé) | Pages, bases de données |
| **Figma** | Token API | Spécifications de design, tokens, actifs et extraction de contenu |
| **URLs** | Aucune | N'importe quel markdown/HTML public |
| **Fichiers** | Aucune | Markdown local, PDF |

```bash
# Vérifier les intégrations disponibles
ralph-starter integrations list

# Tester la connectivité
ralph-starter integrations test github
ralph-starter integrations test linear

# Prévisualiser les données avant l'exécution
ralph-starter integrations fetch github owner/repo
```

> **Vous voulez plus d'intégrations ?** Les PRs sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour commencer.

---

## Table des Matières

- [Intégrations](#integrations)
- [Démarrage Rapide](#demarrage-rapide)
- [Fonctionnalités](#fonctionnalites)
- [Commandes](#commandes)
- [Configuration](#configuration-de-cle-api)
- [Contribuer](#contribuer)

---

### Fonctionnalités Principales

| Fonctionnalité | Description |
|---------|-------------|
| **Intégrations** | Extrait des spécifications depuis GitHub, Linear, Notion, Figma, URLs, fichiers |
| **Support Multi-Agent** | Fonctionne avec Claude Code, Cursor, Copilot, Gemini CLI et plus |
| **Assistant Interactif** | Création de projet guidée avec spécifications affinées par IA |
| **16+ Préréglages de Workflow** | Modes préconfigurés : feature, tdd, debug, review et plus |
| **Circuit Breaker** | Arrête automatiquement les boucles bloquées après des échecs répétés |
| **Suivi des Coûts** | Estime l'utilisation de tokens et le coût par itération |
| **Automatisation Git** | Auto-commit, push et création de PR |
| **Validation de Backpressure** | Exécute tests/lint/build après chaque itération |
| **Serveur MCP** | Utilisez depuis Claude Desktop ou tout client MCP |

### Exemple Rapide

```bash
# Tâche simple
ralph-starter run "build a todo app" --commit --validate

# Avec préréglage
ralph-starter run --preset tdd-red-green "add user authentication"

# Avec contrôles de sécurité
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# Assistant interactif
ralph-starter
```

---

## Qu'est-ce que Ralph Wiggum ?

Découvrez la technique Ralph Wiggum sur [ghuntley.com/ralph](https://ghuntley.com/ralph/).

## Installation

```bash
npm install -g ralph-starter
# ou
npx ralph-starter
```

Après l'installation, exécutez l'assistant de configuration et vérifiez votre environnement :

```bash
ralph-starter setup    # Configurer les clés API et préférences
ralph-starter check    # Vérifier les exigences système et la connectivité
```

## Démarrage Rapide

### Pour Tous (Non-Développeurs Bienvenus !)

Exécutez simplement `ralph-starter` sans arguments pour lancer l'assistant interactif :

```bash
ralph-starter
```

L'assistant va :
1. Demander si vous avez une idée de projet (ou vous aider à en créer une)
2. Affiner votre idée avec l'IA
3. Vous permettre de personnaliser la stack technologique
4. Construire votre projet automatiquement

### Vous Ne Savez Pas Quoi Construire ?

```bash
ralph-starter ideas
```

Cela lance le **Mode Idées** - une session de brainstorming pour vous aider à découvrir des idées de projet :
- **Brainstorming avec IA** - Obtenez des suggestions créatives
- **Voir les idées tendance** - Basées sur les tendances technologiques 2025-2026
- **Basé sur mes compétences** - Personnalisé selon les technologies que vous connaissez
- **Résoudre un problème** - Aide à corriger quelque chose qui vous frustre

### Pour les Développeurs

```bash
# Exécuter une seule tâche
ralph-starter run "build a todo app with React"

# Avec automatisation git
ralph-starter run "add user authentication" --commit --pr

# Avec validation (backpressure)
ralph-starter run "refactor auth" --commit --validate

# Récupérer des spécifications depuis des sources externes
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# Récupérer une issue GitHub spécifique
ralph-starter run --from github --project owner/repo --issue 123

# Spécifier le répertoire de sortie (ignore l'invite "où exécuter ?")
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### Travailler avec des Projets Existants

ralph-starter détecte automatiquement les projets existants lorsque vous exécutez l'assistant :

**Projet Ralph Playbook** (a AGENTS.md, IMPLEMENTATION_PLAN.md, etc.) :
```bash
cd my-ralph-project
ralph-starter
```
L'assistant détectera les fichiers Ralph Playbook et vous permettra de :
- Continuer à travailler (exécuter la boucle de construction)
- Régénérer le plan d'implémentation
- Ajouter de nouvelles spécifications

**Projet de Langage** (a package.json, pyproject.toml, Cargo.toml, go.mod) :
```bash
cd my-existing-app
ralph-starter
```
L'assistant détectera le type de projet et vous permettra de :
- Ajouter des fonctionnalités au projet existant
- Créer un nouveau projet dans un sous-dossier

## Fonctionnalités

### Assistant Interactif
Lancez avec `ralph-starter` (sans arguments) pour une expérience guidée :
- Décrivez votre idée en français simple
- L'IA affine et suggère des fonctionnalités
- Choisissez votre stack technologique
- Exécute automatiquement init → plan → build

### Mode Idées
Pour les utilisateurs qui ne savent pas encore quoi construire :
```bash
ralph-starter ideas
```

### Serveur MCP
Utilisez ralph-starter depuis Claude Desktop ou tout client MCP :

```bash
ralph-starter mcp
```

Ajoutez à la configuration de Claude Desktop :
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

**Outils MCP Disponibles :**
- `ralph_init` - Initialiser Ralph Playbook
- `ralph_plan` - Créer un plan d'implémentation
- `ralph_run` - Exécuter la boucle de codage
- `ralph_status` - Vérifier la progression
- `ralph_validate` - Exécuter tests/lint/build

### Support Multi-Agent
Fonctionne avec vos agents de codage préférés :
- **Claude Code** (recommandé)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### Fournisseurs LLM
ralph-starter prend en charge plusieurs fournisseurs LLM pour les fonctionnalités internes :

| Fournisseur | Variable d'Environnement | Description |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Modèles Claude (par défaut) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 et GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ modèles avec une seule API |

Ces clés sont pour les appels LLM internes de ralph-starter. Les agents de codage gèrent leur propre authentification.

### Automatisation Git
```bash
ralph-starter run "your task" --commit      # Auto-commit après les tâches
ralph-starter run "your task" --push        # Push vers le distant
ralph-starter run "your task" --pr          # Créer une PR à la fin
```

### Validation de Backpressure
```bash
ralph-starter run "your task" --validate    # Exécuter tests/lint/build après chaque itération
```

Le flag `--validate` exécute les commandes de test, lint et build (depuis AGENTS.md ou package.json) après chaque itération. Si la validation échoue, l'agent reçoit un retour pour corriger les problèmes.

### Préréglages de Workflow

Paramètres préconfigurés pour les scénarios de développement courants :

```bash
# Lister tous les 16+ préréglages
ralph-starter presets

# Utiliser un préréglage
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Préréglages Disponibles :**
| Catégorie | Préréglages |
|----------|---------|
| Développement | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Débogage | `debug`, `incident-response`, `code-archaeology` |
| Révision | `review`, `pr-review`, `adversarial-review` |
| Documentation | `docs`, `documentation-first` |
| Spécialisé | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Arrête automatiquement les boucles bloquées :

```bash
# Arrêter après 3 échecs consécutifs (par défaut)
ralph-starter run "build X" --validate

# Seuils personnalisés
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

Le circuit breaker surveille :
- **Échecs consécutifs** : S'arrête après N échecs de validation d'affilée
- **Comptage de même erreur** : S'arrête si la même erreur se répète N fois

### Suivi de Progression

Écrit les journaux d'itération dans `activity.md` :

```bash
# Activé par défaut
ralph-starter run "build X"

# Désactiver si non nécessaire
ralph-starter run "build X" --no-track-progress
```

Chaque itération enregistre :
- Horodatage et durée
- Statut (terminé, échoué, bloqué)
- Résultats de validation
- Informations de commit

### Complétion Basée sur Fichier

La boucle vérifie automatiquement les signaux de complétion :
- Fichier `RALPH_COMPLETE` à la racine du projet
- Fichier marqueur `.ralph-done`
- Toutes les tâches marquées `[x]` dans `IMPLEMENTATION_PLAN.md`

### Limitation de Débit

Contrôlez la fréquence des appels API pour gérer les coûts :

```bash
# Limiter à 50 appels par heure
ralph-starter run --rate-limit 50 "build X"
```

**Lorsque les limites de débit sont atteintes**, ralph-starter affiche des statistiques détaillées :

```
⚠ Limite de débit Claude atteinte

Statistiques de Limite de Débit :
  • Utilisation de session : 100% (50K / 50K tokens)
  • Requêtes effectuées : 127 cette heure
  • Temps jusqu'à réinitialisation : ~47 minutes (réinitialisation à 04:30 UTC)

Progression de la Session :
  • Tâches terminées : 3/5
  • Tâche actuelle : "Add swarm mode CLI flags"
  • Branche : auto/github-54
  • Itérations terminées : 12

Pour reprendre lors de la réinitialisation de la limite :
  ralph-starter run

Astuce : Vérifiez vos limites sur https://claude.ai/settings
```

Cela vous aide à :
- Savoir exactement quand vous pouvez reprendre
- Suivre la progression de votre session actuelle
- Comprendre vos modèles d'utilisation

### Suivi des Coûts

Suivez l'utilisation estimée de tokens et les coûts pendant les boucles :

```bash
# Le suivi des coûts est activé par défaut
ralph-starter run "build X"

# Désactiver le suivi des coûts
ralph-starter run "build X" --no-track-cost
```

Le suivi des coûts fournit :
- **Coût par itération** affiché pendant la boucle
- **Total cumulatif** de tokens et coût
- **Résumé des coûts** à la fin de la boucle
- **Coût enregistré** dans `activity.md` pour chaque itération
- **Coût projeté** pour les itérations restantes (après 3+ itérations)

Modèles pris en charge pour l'estimation des coûts :
- Claude 3 Opus ($15/$75 par 1M tokens)
- Claude 3.5 Sonnet ($3/$15 par 1M tokens)
- Claude 3.5 Haiku ($0.25/$1.25 par 1M tokens)
- GPT-4 ($30/$60 par 1M tokens)
- GPT-4 Turbo ($10/$30 par 1M tokens)

## Workflow Ralph Playbook

ralph-starter suit la méthodologie [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) :

```bash
# 1. Initialiser les fichiers Ralph Playbook
ralph-starter init

# 2. Écrire les spécifications dans le dossier specs/

# 3. Créer un plan d'implémentation
ralph-starter plan

# 4. Exécuter le plan
ralph-starter run --commit --validate
```

Cela crée :
- `AGENTS.md` - Instructions de l'agent et commandes de validation
- `PROMPT_plan.md` - Modèle de prompt de planification
- `PROMPT_build.md` - Modèle de prompt de construction
- `IMPLEMENTATION_PLAN.md` - Liste de tâches priorisées
- `specs/` - Fichiers de spécification

## Commandes

| Commande | Description |
|---------|-------------|
| `ralph-starter` | Lancer l'assistant interactif |
| `ralph-starter run [task]` | Exécuter une boucle de codage autonome |
| `ralph-starter auto` | Traiter par lots les issues depuis GitHub/Linear |
| `ralph-starter integrations <action>` | Gérer les intégrations (list, help, test, fetch) |
| `ralph-starter plan` | Créer un plan d'implémentation depuis les spécifications |
| `ralph-starter init` | Initialiser Ralph Playbook dans un projet |
| `ralph-starter setup` | Configurer l'environnement et les clés API de manière interactive |
| `ralph-starter check` | Vérifier les exigences système et la connectivité |
| `ralph-starter ideas` | Brainstorming d'idées de projet |
| `ralph-starter presets` | Lister les préréglages de workflow disponibles |
| `ralph-starter mcp` | Démarrer en tant que serveur MCP |
| `ralph-starter config <action>` | Gérer les identifiants |
| `ralph-starter source <action>` | Gérer les sources d'entrée (legacy) |
| `ralph-starter skill add <repo>` | Installer les compétences d'agent |

## Options pour `run`

### Options Principales

| Drapeau | Description |
|------|-------------|
| `--auto` | Ignorer les invites de permission **(par défaut : true)** |
| `--no-auto` | Exiger l'approbation manuelle de permission |
| `--commit` | Auto-commit après les tâches |
| `--push` | Push des commits vers le distant |
| `--pr` | Créer une pull request |
| `--validate` | Exécuter tests/lint/build (backpressure) |
| `--agent <name>` | Spécifier l'agent à utiliser |
| `--max-iterations <n>` | Maximum d'itérations de boucle (par défaut : 50) |

### Mode Débogage

Utilisez `RALPH_DEBUG=1` pour voir la sortie détaillée pendant l'exécution :

```bash
# Voir la sortie détaillée de l'agent, le timing et les prompts
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# Déboguer avec une issue GitHub
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

Le mode débogage affiche :
- Commandes exactes en cours d'exécution
- Sortie de l'agent en temps réel
- Informations de timing
- Détails d'erreur

### Préréglages de Workflow

| Drapeau | Description |
|------|-------------|
| `--preset <name>` | Utiliser un préréglage de workflow (feature, tdd-red-green, debug, etc.) |

```bash
# Lister tous les préréglages disponibles
ralph-starter presets

# Utiliser un préréglage
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Détection de Sortie

| Drapeau | Description |
|------|-------------|
| `--completion-promise <string>` | Chaîne personnalisée pour détecter l'achèvement de la tâche |
| `--require-exit-signal` | Exiger `EXIT_SIGNAL: true` explicite pour l'achèvement |

```bash
# Arrêter quand l'agent émet "FEATURE_DONE"
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Exiger un signal de sortie explicite
ralph-starter run --require-exit-signal "build Y"
```

### Contrôles de Sécurité

| Drapeau | Description |
|------|-------------|
| `--rate-limit <n>` | Maximum d'appels API par heure (par défaut : illimité) |
| `--circuit-breaker-failures <n>` | Maximum d'échecs consécutifs avant arrêt (par défaut : 3) |
| `--circuit-breaker-errors <n>` | Maximum d'occurrences de même erreur avant arrêt (par défaut : 5) |
| `--track-progress` | Écrire la progression dans activity.md (par défaut : true) |
| `--no-track-progress` | Désactiver le suivi de progression |
| `--track-cost` | Suivre l'utilisation de tokens et le coût estimé (par défaut : true) |
| `--no-track-cost` | Désactiver le suivi des coûts |

```bash
# Limiter à 50 appels API par heure
ralph-starter run --rate-limit 50 "build X"

# Arrêter après 2 échecs consécutifs
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Options de Source

| Drapeau | Description |
|------|-------------|
| `--from <source>` | Récupérer la spécification depuis la source |
| `--project <name>` | Filtre de projet pour les sources |
| `--label <name>` | Filtre d'étiquette pour les sources |
| `--status <status>` | Filtre de statut pour les sources |
| `--limit <n>` | Maximum d'éléments depuis la source |
| `--issue <n>` | Numéro d'issue spécifique (GitHub) |
| `--output-dir <path>` | Répertoire pour exécuter la tâche (ignore l'invite) |
| `--prd <file>` | Lire les tâches depuis markdown |

## Commandes de Configuration

```bash
# Définir les identifiants
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# Voir la configuration
ralph-starter config list
ralph-starter config get linear.apiKey

# Supprimer
ralph-starter config delete linear.apiKey
```

## Exemple : Construire un Dashboard SaaS

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Regardez la magie opérer...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## Tester ralph-starter

### Test Rapide (Sans Clés API)

Vous pouvez tester ralph-starter avec des URLs publiques - aucune clé API requise :

```bash
# Tester avec un gist GitHub public ou markdown brut
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Tester avec des issues GitHub (nécessite une connexion gh CLI)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Tester l'Assistant

```bash
# Lancer l'assistant interactif
ralph-starter

# Ou tester le mode idées
ralph-starter ideas
```

### Tester avec Vos Propres Spécifications

```bash
# Créer un fichier de spécification simple
echo "Build a simple counter app with React" > my-spec.md

# Exécuter avec un fichier local
ralph-starter run --from ./my-spec.md
```

### Vérifier la Connectivité des Sources

Avant d'utiliser une intégration, vérifiez qu'elle fonctionne :

```bash
# Vérifier quelles intégrations sont disponibles
ralph-starter integrations list

# Tester chaque intégration
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# Prévisualiser les éléments (dry run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## Configuration de Clé API

### Option 1 : Variables d'Environnement (Recommandé pour les Développeurs)

Définissez les variables d'environnement dans votre profil shell ou fichier `.env` :

```bash
# Ajouter à ~/.bashrc, ~/.zshrc, ou fichier .env
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Les variables d'environnement ont priorité sur le fichier de configuration.

### Option 2 : Commande de Configuration

Utilisez le CLI pour stocker les identifiants :

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Les identifiants sont stockés dans `~/.ralph-starter/sources.json`.

### Référence des Variables d'Environnement

| Source | Variable d'Environnement | Clé de Configuration |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## Exigences

- Node.js 18+
- Au moins un agent de codage installé (Claude Code, Cursor, etc.)
- Git (pour les fonctionnalités d'automatisation)
- GitHub CLI `gh` (pour la création de PR et la source GitHub)

## Documentation

Documentation complète disponible sur : https://ralphstarter.ai

## Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives.

- **Demandes de fonctionnalités et idées** : [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **Modèles de projet** : [ralph-templates](https://github.com/multivmlabs/ralph-templates)

Pour créer des intégrations personnalisées, des agents ou utiliser l'API programmatique, consultez le [Guide d'Extension pour Développeurs](https://ralphstarter.ai/docs/guides/extending-ralph-starter).

## Licence

MIT
