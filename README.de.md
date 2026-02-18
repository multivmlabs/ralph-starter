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
  <strong>Verbinden Sie Ihre Tools. Führen Sie KI-Coding-Schleifen aus. Liefern Sie schneller.</strong>
</h3>

<p align="center">
  <em>Ziehen Sie Spezifikationen aus GitHub, Linear, Notion, Figma und mehr — und lassen Sie die KI autonom bauen.</em>
</p>

<p align="center">
  <a href="#integrationen">Integrationen</a> •
  <a href="#schnellstart">Schnellstart</a> •
  <a href="#funktionen">Funktionen</a> •
  <a href="https://ralphstarter.ai">Dokumentation</a>
</p>

---


Die meisten KI-Coding-Tools arbeiten isoliert. Sie beschreiben eine Aufgabe, die KI baut sie, fertig.

**ralph-starter** ist anders. Es **verbindet sich mit Ihrem bestehenden Workflow** — zieht Spezifikationen aus GitHub Issues, Linear Tickets, Notion Docs oder jeder URL — und führt dann autonome KI-Schleifen aus, bis die Aufgabe abgeschlossen ist.

```bash
# Aus einem GitHub Issue bauen
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Aus einem Linear Ticket bauen
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Aus einer Notion-Spezifikation bauen
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# Oder beschreiben Sie einfach, was Sie wollen
ralph-starter run "build a todo app with React" --commit
```

---

## Integrationen

ralph-starter integriert sich nativ mit Ihren Lieblings-Tools:

| Integration | Authentifizierungsmethode | Was es abruft |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (empfohlen) oder API Token | Issues, PRs, Dateien |
| **Linear** | `linear` CLI oder API-Schlüssel | Issues nach Team/Projekt |
| **Notion** | Keine (öffentlich) oder API Token (privat) | Seiten, Datenbanken |
| **Figma** | API Token | Design-Spezifikationen, Tokens, Assets und Inhaltsextraktion |
| **URLs** | Keine | Jedes öffentliche Markdown/HTML |
| **Dateien** | Keine | Lokales Markdown, PDF |

```bash
# Verfügbare Integrationen prüfen
ralph-starter integrations list

# Konnektivität testen
ralph-starter integrations test github
ralph-starter integrations test linear

# Daten vor der Ausführung in der Vorschau anzeigen
ralph-starter integrations fetch github owner/repo
```

> **Möchten Sie weitere Integrationen?** PRs sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) zum Einstieg.

---

## Inhaltsverzeichnis

- [Integrationen](#integrationen)
- [Schnellstart](#schnellstart)
- [Funktionen](#funktionen)
- [Befehle](#befehle)
- [Konfiguration](#api-schluessel-konfiguration)
- [Beitragen](#beitragen)

---

### Hauptfunktionen

| Funktion | Beschreibung |
|---------|-------------|
| **Integrationen** | Ziehen Sie Spezifikationen aus GitHub, Linear, Notion, Figma, URLs, Dateien |
| **Multi-Agent-Unterstützung** | Funktioniert mit Claude Code, Cursor, Copilot, Gemini CLI und mehr |
| **Interaktiver Assistent** | Geführte Projekterstellung mit KI-verfeinerten Spezifikationen |
| **16+ Workflow-Voreinstellungen** | Vorkonfigurierte Modi: feature, tdd, debug, review und mehr |
| **Circuit Breaker** | Stoppt automatisch festgefahrene Schleifen nach wiederholten Fehlern |
| **Kostenverfolgung** | Schätzt Token-Nutzung und Kosten pro Iteration |
| **Git-Automatisierung** | Auto-Commit, Push und PR-Erstellung |
| **Backpressure-Validierung** | Führt Tests/Lint/Build nach jeder Iteration aus |
| **MCP-Server** | Verwenden Sie von Claude Desktop oder jedem MCP-Client |

### Schnelles Beispiel

```bash
# Einfache Aufgabe
ralph-starter run "build a todo app" --commit --validate

# Mit Voreinstellung
ralph-starter run --preset tdd-red-green "add user authentication"

# Mit Sicherheitskontrollen
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# Interaktiver Assistent
ralph-starter
```

---

## Was ist Ralph Wiggum?

Erfahren Sie mehr über die Ralph Wiggum Technik auf [ghuntley.com/ralph](https://ghuntley.com/ralph/).

## Installation

```bash
npm install -g ralph-starter
# oder
npx ralph-starter
```

Nach der Installation führen Sie den Einrichtungsassistenten aus und überprüfen Sie Ihre Umgebung:

```bash
ralph-starter setup    # API-Schlüssel und Einstellungen konfigurieren
ralph-starter check    # Systemanforderungen und Konnektivität überprüfen
```

## Schnellstart

### Für Alle (Nicht-Entwickler Willkommen!)

Führen Sie einfach `ralph-starter` ohne Argumente aus, um den interaktiven Assistenten zu starten:

```bash
ralph-starter
```

Der Assistent wird:
1. Fragen, ob Sie eine Projektidee haben (oder Ihnen helfen, eine zu erstellen)
2. Ihre Idee mit KI verfeinern
3. Ihnen erlauben, den Tech-Stack anzupassen
4. Ihr Projekt automatisch erstellen

### Wissen Sie nicht, was Sie bauen sollen?

```bash
ralph-starter ideas
```

Dies startet den **Ideen-Modus** - eine Brainstorming-Sitzung, um Ihnen zu helfen, Projektideen zu entdecken:
- **Brainstorming mit KI** - Erhalten Sie kreative Vorschläge
- **Trending-Ideen ansehen** - Basierend auf Tech-Trends 2025-2026
- **Basierend auf meinen Fähigkeiten** - Personalisiert für Technologien, die Sie kennen
- **Ein Problem lösen** - Helfen Sie, etwas zu beheben, das Sie frustriert

### Für Entwickler

```bash
# Eine einzelne Aufgabe ausführen
ralph-starter run "build a todo app with React"

# Mit Git-Automatisierung
ralph-starter run "add user authentication" --commit --pr

# Mit Validierung (Backpressure)
ralph-starter run "refactor auth" --commit --validate

# Spezifikationen aus externen Quellen abrufen
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# Ein bestimmtes GitHub Issue abrufen
ralph-starter run --from github --project owner/repo --issue 123

# Ausgabeverzeichnis angeben (überspringt "Wo ausführen?" Eingabeaufforderung)
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### Mit Bestehenden Projekten Arbeiten

ralph-starter erkennt automatisch bestehende Projekte, wenn Sie den Assistenten ausführen:

**Ralph Playbook Projekt** (hat AGENTS.md, IMPLEMENTATION_PLAN.md, usw.):
```bash
cd my-ralph-project
ralph-starter
```
Der Assistent erkennt die Ralph Playbook Dateien und ermöglicht Ihnen:
- Weiterarbeiten (Build-Schleife ausführen)
- Implementierungsplan neu generieren
- Neue Spezifikationen hinzufügen

**Sprach-Projekt** (hat package.json, pyproject.toml, Cargo.toml, go.mod):
```bash
cd my-existing-app
ralph-starter
```
Der Assistent erkennt den Projekttyp und ermöglicht Ihnen:
- Funktionen zum bestehenden Projekt hinzufügen
- Ein neues Projekt in einem Unterordner erstellen

## Funktionen

### Interaktiver Assistent
Starten Sie mit `ralph-starter` (ohne Argumente) für eine geführte Erfahrung:
- Beschreiben Sie Ihre Idee in einfachem Deutsch
- KI verfeinert und schlägt Funktionen vor
- Wählen Sie Ihren Tech-Stack
- Führt automatisch init → plan → build aus

### Ideen-Modus
Für Benutzer, die noch nicht wissen, was sie bauen sollen:
```bash
ralph-starter ideas
```

### MCP-Server
Verwenden Sie ralph-starter von Claude Desktop oder jedem MCP-Client:

```bash
ralph-starter mcp
```

Zur Claude Desktop Konfiguration hinzufügen:
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

**Verfügbare MCP-Tools:**
- `ralph_init` - Ralph Playbook initialisieren
- `ralph_plan` - Implementierungsplan erstellen
- `ralph_run` - Coding-Schleife ausführen
- `ralph_status` - Fortschritt prüfen
- `ralph_validate` - Tests/Lint/Build ausführen

### Multi-Agent-Unterstützung
Funktioniert mit Ihren bevorzugten Coding-Agenten:
- **Claude Code** (empfohlen)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### LLM-Anbieter
ralph-starter unterstützt mehrere LLM-Anbieter für interne Funktionen:

| Anbieter | Umgebungsvariable | Beschreibung |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude Modelle (Standard) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 und GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ Modelle mit einer API |

Diese Schlüssel sind für die internen LLM-Aufrufe von ralph-starter. Coding-Agenten handhaben ihre eigene Authentifizierung.

### Git-Automatisierung
```bash
ralph-starter run "your task" --commit      # Auto-Commit nach Aufgaben
ralph-starter run "your task" --push        # Push zu Remote
ralph-starter run "your task" --pr          # PR erstellen, wenn fertig
```

### Backpressure-Validierung
```bash
ralph-starter run "your task" --validate    # Tests/Lint/Build nach jeder Iteration ausführen
```

Das `--validate` Flag führt Test-, Lint- und Build-Befehle (aus AGENTS.md oder package.json) nach jeder Iteration aus. Wenn die Validierung fehlschlägt, erhält der Agent Feedback, um die Probleme zu beheben.

### Workflow-Voreinstellungen

Vorkonfigurierte Einstellungen für gängige Entwicklungsszenarien:

```bash
# Alle 16+ Voreinstellungen auflisten
ralph-starter presets

# Eine Voreinstellung verwenden
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Verfügbare Voreinstellungen:**
| Kategorie | Voreinstellungen |
|----------|---------|
| Entwicklung | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Debugging | `debug`, `incident-response`, `code-archaeology` |
| Review | `review`, `pr-review`, `adversarial-review` |
| Dokumentation | `docs`, `documentation-first` |
| Spezialisiert | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Stoppt automatisch festgefahrene Schleifen:

```bash
# Nach 3 aufeinanderfolgenden Fehlern stoppen (Standard)
ralph-starter run "build X" --validate

# Benutzerdefinierte Schwellenwerte
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

Der Circuit Breaker überwacht:
- **Aufeinanderfolgende Fehler**: Stoppt nach N Validierungsfehlern hintereinander
- **Gleiche Fehleranzahl**: Stoppt, wenn sich derselbe Fehler N-mal wiederholt

### Fortschrittsverfolgung

Schreibt Iterationsprotokolle in `activity.md`:

```bash
# Standardmäßig aktiviert
ralph-starter run "build X"

# Deaktivieren, falls nicht benötigt
ralph-starter run "build X" --no-track-progress
```

Jede Iteration zeichnet auf:
- Zeitstempel und Dauer
- Status (abgeschlossen, fehlgeschlagen, blockiert)
- Validierungsergebnisse
- Commit-Info

### Dateibasierte Vervollständigung

Die Schleife prüft automatisch auf Vervollständigungssignale:
- `RALPH_COMPLETE` Datei im Projektstamm
- `.ralph-done` Markierungsdatei
- Alle Aufgaben in `IMPLEMENTATION_PLAN.md` als `[x]` markiert

### Rate Limiting

Steuern Sie die API-Aufruffrequenz zur Kostenverwaltung:

```bash
# Auf 50 Aufrufe pro Stunde begrenzen
ralph-starter run --rate-limit 50 "build X"
```

**Wenn Rate Limits erreicht werden**, zeigt ralph-starter detaillierte Statistiken an:

```
⚠ Claude Rate Limit erreicht

Rate Limit Statistiken:
  • Sitzungsnutzung: 100% (50K / 50K Tokens)
  • Durchgeführte Anfragen: 127 diese Stunde
  • Zeit bis zum Reset: ~47 Minuten (Reset um 04:30 UTC)

Sitzungsfortschritt:
  • Abgeschlossene Aufgaben: 3/5
  • Aktuelle Aufgabe: "Add swarm mode CLI flags"
  • Branch: auto/github-54
  • Abgeschlossene Iterationen: 12

Um fortzufahren, wenn das Limit zurückgesetzt wird:
  ralph-starter run

Tipp: Überprüfen Sie Ihre Limits unter https://claude.ai/settings
```

Das hilft Ihnen:
- Genau zu wissen, wann Sie fortfahren können
- Den Fortschritt Ihrer aktuellen Sitzung zu verfolgen
- Ihre Nutzungsmuster zu verstehen

### Kostenverfolgung

Verfolgen Sie die geschätzte Token-Nutzung und Kosten während der Schleifen:

```bash
# Kostenverfolgung ist standardmäßig aktiviert
ralph-starter run "build X"

# Kostenverfolgung deaktivieren
ralph-starter run "build X" --no-track-cost
```

Die Kostenverfolgung bietet:
- **Kosten pro Iteration** während der Schleife angezeigt
- **Laufende Summe** von Tokens und Kosten
- **Kostenzusammenfassung** am Ende der Schleife
- **Protokollierte Kosten** in `activity.md` für jede Iteration
- **Prognostizierte Kosten** für verbleibende Iterationen (nach 3+ Iterationen)

Unterstützte Modelle für Kostenschätzung:
- Claude 3 Opus ($15/$75 pro 1M Tokens)
- Claude 3.5 Sonnet ($3/$15 pro 1M Tokens)
- Claude 3.5 Haiku ($0.25/$1.25 pro 1M Tokens)
- GPT-4 ($30/$60 pro 1M Tokens)
- GPT-4 Turbo ($10/$30 pro 1M Tokens)

## Ralph Playbook Workflow

ralph-starter folgt der [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) Methodik:

```bash
# 1. Ralph Playbook Dateien initialisieren
ralph-starter init

# 2. Spezifikationen im specs/ Ordner schreiben

# 3. Implementierungsplan erstellen
ralph-starter plan

# 4. Den Plan ausführen
ralph-starter run --commit --validate
```

Dies erstellt:
- `AGENTS.md` - Agenten-Anweisungen und Validierungsbefehle
- `PROMPT_plan.md` - Planungs-Prompt-Vorlage
- `PROMPT_build.md` - Build-Prompt-Vorlage
- `IMPLEMENTATION_PLAN.md` - Priorisierte Aufgabenliste
- `specs/` - Spezifikationsdateien

## Befehle

| Befehl | Beschreibung |
|---------|-------------|
| `ralph-starter` | Interaktiven Assistenten starten |
| `ralph-starter run [task]` | Eine autonome Coding-Schleife ausführen |
| `ralph-starter auto` | Issues von GitHub/Linear stapelweise verarbeiten |
| `ralph-starter integrations <action>` | Integrationen verwalten (list, help, test, fetch) |
| `ralph-starter plan` | Implementierungsplan aus Spezifikationen erstellen |
| `ralph-starter init` | Ralph Playbook in einem Projekt initialisieren |
| `ralph-starter setup` | Umgebung und API-Schlüssel interaktiv konfigurieren |
| `ralph-starter check` | Systemanforderungen und Konnektivität überprüfen |
| `ralph-starter ideas` | Projektideen brainstormen |
| `ralph-starter presets` | Verfügbare Workflow-Voreinstellungen auflisten |
| `ralph-starter mcp` | Als MCP-Server starten |
| `ralph-starter config <action>` | Anmeldeinformationen verwalten |
| `ralph-starter source <action>` | Eingabequellen verwalten (Legacy) |
| `ralph-starter skill add <repo>` | Agenten-Fähigkeiten installieren |

## Optionen für `run`

### Hauptoptionen

| Flag | Beschreibung |
|------|-------------|
| `--auto` | Berechtigungsaufforderungen überspringen **(Standard: true)** |
| `--no-auto` | Manuelle Berechtigungsgenehmigung erforderlich |
| `--commit` | Auto-Commit nach Aufgaben |
| `--push` | Commits zu Remote pushen |
| `--pr` | Pull Request erstellen |
| `--validate` | Tests/Lint/Build ausführen (Backpressure) |
| `--agent <name>` | Zu verwendenden Agenten angeben |
| `--max-iterations <n>` | Maximale Schleifeniterationen (Standard: 50) |

### Debug-Modus

Verwenden Sie `RALPH_DEBUG=1`, um detaillierte Ausgaben während der Ausführung zu sehen:

```bash
# Detaillierte Agentenausgabe, Timing und Prompts anzeigen
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# Mit GitHub Issue debuggen
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

Der Debug-Modus zeigt:
- Exakte ausgeführte Befehle
- Agentenausgabe in Echtzeit
- Timing-Informationen
- Fehlerdetails

### Workflow-Voreinstellungen

| Flag | Beschreibung |
|------|-------------|
| `--preset <name>` | Eine Workflow-Voreinstellung verwenden (feature, tdd-red-green, debug, usw.) |

```bash
# Alle verfügbaren Voreinstellungen auflisten
ralph-starter presets

# Eine Voreinstellung verwenden
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Exit-Erkennung

| Flag | Beschreibung |
|------|-------------|
| `--completion-promise <string>` | Benutzerdefinierte Zeichenfolge zur Erkennung des Aufgabenabschlusses |
| `--require-exit-signal` | Explizites `EXIT_SIGNAL: true` für Abschluss erforderlich |

```bash
# Stoppen, wenn der Agent "FEATURE_DONE" ausgibt
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Explizites Exit-Signal erforderlich
ralph-starter run --require-exit-signal "build Y"
```

### Sicherheitskontrollen

| Flag | Beschreibung |
|------|-------------|
| `--rate-limit <n>` | Maximale API-Aufrufe pro Stunde (Standard: unbegrenzt) |
| `--circuit-breaker-failures <n>` | Maximale aufeinanderfolgende Fehler vor dem Stoppen (Standard: 3) |
| `--circuit-breaker-errors <n>` | Maximale Vorkommen desselben Fehlers vor dem Stoppen (Standard: 5) |
| `--track-progress` | Fortschritt in activity.md schreiben (Standard: true) |
| `--no-track-progress` | Fortschrittsverfolgung deaktivieren |
| `--track-cost` | Token-Nutzung und geschätzte Kosten verfolgen (Standard: true) |
| `--no-track-cost` | Kostenverfolgung deaktivieren |

```bash
# Auf 50 API-Aufrufe pro Stunde begrenzen
ralph-starter run --rate-limit 50 "build X"

# Nach 2 aufeinanderfolgenden Fehlern stoppen
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Quellenoptionen

| Flag | Beschreibung |
|------|-------------|
| `--from <source>` | Spezifikation aus Quelle abrufen |
| `--project <name>` | Projektfilter für Quellen |
| `--label <name>` | Label-Filter für Quellen |
| `--status <status>` | Statusfilter für Quellen |
| `--limit <n>` | Maximale Elemente aus Quelle |
| `--issue <n>` | Spezifische Issue-Nummer (GitHub) |
| `--output-dir <path>` | Verzeichnis zum Ausführen der Aufgabe (überspringt Eingabeaufforderung) |
| `--prd <file>` | Aufgaben aus Markdown lesen |

## Konfigurationsbefehle

```bash
# Anmeldeinformationen festlegen
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# Konfiguration anzeigen
ralph-starter config list
ralph-starter config get linear.apiKey

# Entfernen
ralph-starter config delete linear.apiKey
```

## Beispiel: Ein SaaS Dashboard Erstellen

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Sehen Sie die Magie geschehen...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## ralph-starter Testen

### Schnelltest (Keine API-Schlüssel)

Sie können ralph-starter mit öffentlichen URLs testen - keine API-Schlüssel erforderlich:

```bash
# Mit einem öffentlichen GitHub Gist oder rohem Markdown testen
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Mit GitHub Issues testen (erfordert gh CLI Login)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Den Assistenten Testen

```bash
# Den interaktiven Assistenten starten
ralph-starter

# Oder den Ideen-Modus testen
ralph-starter ideas
```

### Mit Ihren Eigenen Spezifikationen Testen

```bash
# Eine einfache Spezifikationsdatei erstellen
echo "Build a simple counter app with React" > my-spec.md

# Mit lokaler Datei ausführen
ralph-starter run --from ./my-spec.md
```

### Quellenkonnektivität Überprüfen

Bevor Sie eine Integration verwenden, überprüfen Sie, ob sie funktioniert:

```bash
# Verfügbare Integrationen prüfen
ralph-starter integrations list

# Jede Integration testen
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# Elemente in der Vorschau anzeigen (Dry Run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## API-Schlüssel-Konfiguration

### Option 1: Umgebungsvariablen (Empfohlen für Entwickler)

Setzen Sie Umgebungsvariablen in Ihrem Shell-Profil oder `.env` Datei:

```bash
# Zu ~/.bashrc, ~/.zshrc oder .env Datei hinzufügen
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Umgebungsvariablen haben Vorrang vor der Konfigurationsdatei.

### Option 2: Konfigurationsbefehl

Verwenden Sie die CLI zum Speichern von Anmeldeinformationen:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Anmeldeinformationen werden in `~/.ralph-starter/sources.json` gespeichert.

### Umgebungsvariablen-Referenz

| Quelle | Umgebungsvariable | Konfigurationsschlüssel |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## Anforderungen

- Node.js 18+
- Mindestens ein installierter Coding-Agent (Claude Code, Cursor, usw.)
- Git (für Automatisierungsfunktionen)
- GitHub CLI `gh` (für PR-Erstellung und GitHub-Quelle)

## Dokumentation

Vollständige Dokumentation verfügbar unter: https://ralphstarter.ai

## Beitragen

Beiträge sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Richtlinien.

- **Feature-Anfragen & Ideen**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **Projektvorlagen**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

Zum Erstellen benutzerdefinierter Integrationen, Agenten oder zur Verwendung der programmatischen API siehe den [Developer Extension Guide](https://ralphstarter.ai/docs/guides/extending-ralph-starter).

## Lizenz

MIT
