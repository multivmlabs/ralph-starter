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
  <strong>Conecta tus herramientas. Ejecuta bucles de codificación con IA. Entrega más rápido.</strong>
</h3>

<p align="center">
  <em>Extrae especificaciones de GitHub, Linear, Notion, Figma y más — luego deja que la IA lo construya de forma autónoma.</em>
</p>

<p align="center">
  <a href="#integraciones">Integraciones</a> •
  <a href="#inicio-rapido">Inicio Rápido</a> •
  <a href="#caracteristicas">Características</a> •
  <a href="https://ralphstarter.ai">Documentación</a>
</p>

---


La mayoría de las herramientas de codificación con IA trabajan de forma aislada. Describes una tarea, la IA la construye, listo.

**ralph-starter** es diferente. Se **conecta a tu flujo de trabajo existente** — extrayendo especificaciones de issues de GitHub, tickets de Linear, documentos de Notion o cualquier URL — y luego ejecuta bucles autónomos de IA hasta que la tarea esté completa.

```bash
# Construir desde un issue de GitHub
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Construir desde un ticket de Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Construir desde una especificación de Notion
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# O simplemente describe lo que quieres
ralph-starter run "build a todo app with React" --commit
```

---

## Integraciones

ralph-starter se integra con tus herramientas favoritas de forma nativa:

| Integración | Método de Autenticación | Qué Extrae |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (recomendado) o token API | Issues, PRs, archivos |
| **Linear** | `linear` CLI o clave API | Issues por equipo/proyecto |
| **Notion** | Ninguno (público) o token API (privado) | Páginas, bases de datos |
| **Figma** | Token API | Especificaciones de diseño, tokens, activos y extracción de contenido |
| **URLs** | Ninguno | Cualquier markdown/HTML público |
| **Archivos** | Ninguno | Markdown local, PDF |

```bash
# Verificar integraciones disponibles
ralph-starter integrations list

# Probar conectividad
ralph-starter integrations test github
ralph-starter integrations test linear

# Vista previa de datos antes de ejecutar
ralph-starter integrations fetch github owner/repo
```

> **¿Quieres más integraciones?** ¡Los PRs son bienvenidos! Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para comenzar.

---

## Tabla de Contenidos

- [Integraciones](#integraciones)
- [Inicio Rápido](#inicio-rapido)
- [Características](#caracteristicas)
- [Comandos](#comandos)
- [Configuración](#configuracion-de-clave-api)
- [Contribuyendo](#contribuyendo)

---

### Características Principales

| Característica | Descripción |
|---------|-------------|
| **Integraciones** | Extrae especificaciones de GitHub, Linear, Notion, Figma, URLs, archivos |
| **Soporte Multi-Agente** | Funciona con Claude Code, Cursor, Copilot, Gemini CLI y más |
| **Asistente Interactivo** | Creación de proyecto guiada con especificaciones refinadas por IA |
| **16+ Preajustes de Flujo** | Modos preconfigurados: feature, tdd, debug, review y más |
| **Circuit Breaker** | Detiene automáticamente bucles atascados después de fallos repetidos |
| **Seguimiento de Costos** | Estima uso de tokens y costo por iteración |
| **Automatización Git** | Auto-commit, push y creación de PR |
| **Validación de Backpressure** | Ejecuta pruebas/lint/build después de cada iteración |
| **Servidor MCP** | Usa desde Claude Desktop o cualquier cliente MCP |

### Ejemplo Rápido

```bash
# Tarea simple
ralph-starter run "build a todo app" --commit --validate

# Con preajuste
ralph-starter run --preset tdd-red-green "add user authentication"

# Con controles de seguridad
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# Asistente interactivo
ralph-starter
```

---

## ¿Qué es Ralph Wiggum?

Aprende sobre la técnica Ralph Wiggum en [ghuntley.com/ralph](https://ghuntley.com/ralph/).

## Instalación

```bash
npm install -g ralph-starter
# o
npx ralph-starter
```

Después de instalar, ejecuta el asistente de configuración y verifica tu entorno:

```bash
ralph-starter setup    # Configurar claves API y preferencias
ralph-starter check    # Verificar requisitos del sistema y conectividad
```

## Inicio Rápido

### Para Todos (¡No Desarrolladores Bienvenidos!)

Simplemente ejecuta `ralph-starter` sin argumentos para iniciar el asistente interactivo:

```bash
ralph-starter
```

El asistente:
1. Preguntará si tienes una idea de proyecto (o te ayudará a crear una)
2. Refinará tu idea con IA
3. Te permitirá personalizar el stack tecnológico
4. Construirá tu proyecto automáticamente

### ¿No Sabes Qué Construir?

```bash
ralph-starter ideas
```

Esto inicia el **Modo de Ideas** - una sesión de lluvia de ideas para ayudarte a descubrir ideas de proyecto:
- **Lluvia de ideas con IA** - Obtén sugerencias creativas
- **Ver ideas en tendencia** - Basadas en tendencias tecnológicas 2025-2026
- **Basado en mis habilidades** - Personalizado para tecnologías que conoces
- **Resolver un problema** - Ayuda a arreglar algo que te frustra

### Para Desarrolladores

```bash
# Ejecutar una sola tarea
ralph-starter run "build a todo app with React"

# Con automatización git
ralph-starter run "add user authentication" --commit --pr

# Con validación (backpressure)
ralph-starter run "refactor auth" --commit --validate

# Obtener especificaciones de fuentes externas
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# Obtener un issue específico de GitHub
ralph-starter run --from github --project owner/repo --issue 123

# Especificar directorio de salida (omite el prompt "¿dónde ejecutar?")
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### Trabajando con Proyectos Existentes

ralph-starter detecta automáticamente proyectos existentes cuando ejecutas el asistente:

**Proyecto Ralph Playbook** (tiene AGENTS.md, IMPLEMENTATION_PLAN.md, etc.):
```bash
cd my-ralph-project
ralph-starter
```
El asistente detectará los archivos de Ralph Playbook y te permitirá:
- Continuar trabajando (ejecutar el bucle de construcción)
- Regenerar el plan de implementación
- Agregar nuevas especificaciones

**Proyecto de Lenguaje** (tiene package.json, pyproject.toml, Cargo.toml, go.mod):
```bash
cd my-existing-app
ralph-starter
```
El asistente detectará el tipo de proyecto y te permitirá:
- Agregar características al proyecto existente
- Crear un nuevo proyecto en una subcarpeta

## Características

### Asistente Interactivo
Inicia con `ralph-starter` (sin argumentos) para una experiencia guiada:
- Describe tu idea en lenguaje sencillo
- La IA refina y sugiere características
- Elige tu stack tecnológico
- Ejecuta automáticamente init → plan → build

### Modo de Ideas
Para usuarios que aún no saben qué construir:
```bash
ralph-starter ideas
```

### Servidor MCP
Usa ralph-starter desde Claude Desktop o cualquier cliente MCP:

```bash
ralph-starter mcp
```

Agrega a la configuración de Claude Desktop:
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

**Herramientas MCP Disponibles:**
- `ralph_init` - Inicializar Ralph Playbook
- `ralph_plan` - Crear plan de implementación
- `ralph_run` - Ejecutar bucle de codificación
- `ralph_status` - Verificar progreso
- `ralph_validate` - Ejecutar pruebas/lint/build

### Soporte Multi-Agente
Funciona con tus agentes de codificación favoritos:
- **Claude Code** (recomendado)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### Proveedores LLM
ralph-starter soporta múltiples proveedores LLM para características internas:

| Proveedor | Variable de Entorno | Descripción |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Modelos Claude (por defecto) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 y GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ modelos con una API |

Estas claves son para llamadas LLM internas de ralph-starter. Los agentes de codificación manejan su propia autenticación.

### Automatización Git
```bash
ralph-starter run "your task" --commit      # Auto-commit después de tareas
ralph-starter run "your task" --push        # Push a remoto
ralph-starter run "your task" --pr          # Crear PR cuando termine
```

### Validación de Backpressure
```bash
ralph-starter run "your task" --validate    # Ejecutar pruebas/lint/build después de cada iteración
```

La bandera `--validate` ejecuta comandos de prueba, lint y build (desde AGENTS.md o package.json) después de cada iteración. Si la validación falla, el agente recibe retroalimentación para corregir los problemas.

### Preajustes de Flujo

Configuraciones predefinidas para escenarios comunes de desarrollo:

```bash
# Listar todos los 16+ preajustes
ralph-starter presets

# Usar un preajuste
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Preajustes Disponibles:**
| Categoría | Preajustes |
|----------|---------|
| Desarrollo | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Depuración | `debug`, `incident-response`, `code-archaeology` |
| Revisión | `review`, `pr-review`, `adversarial-review` |
| Documentación | `docs`, `documentation-first` |
| Especializado | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Detiene automáticamente bucles que están atascados:

```bash
# Detener después de 3 fallos consecutivos (por defecto)
ralph-starter run "build X" --validate

# Umbrales personalizados
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

El circuit breaker monitorea:
- **Fallos consecutivos**: Detiene después de N fallos de validación seguidos
- **Conteo del mismo error**: Detiene si el mismo error se repite N veces

### Seguimiento de Progreso

Escribe registros de iteración en `activity.md`:

```bash
# Habilitado por defecto
ralph-starter run "build X"

# Deshabilitar si no es necesario
ralph-starter run "build X" --no-track-progress
```

Cada iteración registra:
- Marca de tiempo y duración
- Estado (completado, fallido, bloqueado)
- Resultados de validación
- Información de commit

### Finalización Basada en Archivos

El bucle verifica automáticamente señales de finalización:
- Archivo `RALPH_COMPLETE` en la raíz del proyecto
- Archivo marcador `.ralph-done`
- Todas las tareas marcadas `[x]` en `IMPLEMENTATION_PLAN.md`

### Limitación de Tasa

Controla la frecuencia de llamadas API para gestionar costos:

```bash
# Limitar a 50 llamadas por hora
ralph-starter run --rate-limit 50 "build X"
```

**Cuando se alcanzan los límites de tasa**, ralph-starter muestra estadísticas detalladas:

```
⚠ Límite de tasa de Claude alcanzado

Estadísticas de Límite de Tasa:
  • Uso de sesión: 100% (50K / 50K tokens)
  • Solicitudes realizadas: 127 esta hora
  • Tiempo hasta reinicio: ~47 minutos (reinicia a las 04:30 UTC)

Progreso de la Sesión:
  • Tareas completadas: 3/5
  • Tarea actual: "Add swarm mode CLI flags"
  • Rama: auto/github-54
  • Iteraciones completadas: 12

Para reanudar cuando el límite se reinicie:
  ralph-starter run

Consejo: Verifica tus límites en https://claude.ai/settings
```

Esto te ayuda a:
- Saber exactamente cuándo puedes reanudar
- Seguir el progreso de tu sesión actual
- Entender tus patrones de uso

### Seguimiento de Costos

Rastrea el uso estimado de tokens y costos durante los bucles:

```bash
# Seguimiento de costos está habilitado por defecto
ralph-starter run "build X"

# Deshabilitar seguimiento de costos
ralph-starter run "build X" --no-track-cost
```

El seguimiento de costos proporciona:
- **Costo por iteración** mostrado durante el bucle
- **Total acumulado** de tokens y costo
- **Resumen de costo** al final del bucle
- **Costo registrado** en `activity.md` para cada iteración
- **Costo proyectado** para iteraciones restantes (después de 3+ iteraciones)

Modelos soportados para estimación de costos:
- Claude 3 Opus ($15/$75 por 1M tokens)
- Claude 3.5 Sonnet ($3/$15 por 1M tokens)
- Claude 3.5 Haiku ($0.25/$1.25 por 1M tokens)
- GPT-4 ($30/$60 por 1M tokens)
- GPT-4 Turbo ($10/$30 por 1M tokens)

## Flujo de Trabajo Ralph Playbook

ralph-starter sigue la metodología [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/):

```bash
# 1. Inicializar archivos de Ralph Playbook
ralph-starter init

# 2. Escribir especificaciones en la carpeta specs/

# 3. Crear plan de implementación
ralph-starter plan

# 4. Ejecutar el plan
ralph-starter run --commit --validate
```

Esto crea:
- `AGENTS.md` - Instrucciones del agente y comandos de validación
- `PROMPT_plan.md` - Plantilla de prompt de planificación
- `PROMPT_build.md` - Plantilla de prompt de construcción
- `IMPLEMENTATION_PLAN.md` - Lista de tareas priorizadas
- `specs/` - Archivos de especificación

## Comandos

| Comando | Descripción |
|---------|-------------|
| `ralph-starter` | Iniciar asistente interactivo |
| `ralph-starter run [task]` | Ejecutar un bucle de codificación autónomo |
| `ralph-starter auto` | Procesar issues en lote desde GitHub/Linear |
| `ralph-starter integrations <action>` | Gestionar integraciones (list, help, test, fetch) |
| `ralph-starter plan` | Crear plan de implementación desde especificaciones |
| `ralph-starter init` | Inicializar Ralph Playbook en un proyecto |
| `ralph-starter setup` | Configurar entorno y claves API de forma interactiva |
| `ralph-starter check` | Verificar requisitos del sistema y conectividad |
| `ralph-starter ideas` | Lluvia de ideas de proyectos |
| `ralph-starter presets` | Listar preajustes de flujo disponibles |
| `ralph-starter mcp` | Iniciar como servidor MCP |
| `ralph-starter config <action>` | Gestionar credenciales |
| `ralph-starter source <action>` | Gestionar fuentes de entrada (legacy) |
| `ralph-starter skill add <repo>` | Instalar habilidades de agente |

## Opciones para `run`

### Opciones Principales

| Bandera | Descripción |
|------|-------------|
| `--auto` | Omitir prompts de permiso **(por defecto: true)** |
| `--no-auto` | Requerir aprobación manual de permiso |
| `--commit` | Auto-commit después de tareas |
| `--push` | Push de commits a remoto |
| `--pr` | Crear pull request |
| `--validate` | Ejecutar pruebas/lint/build (backpressure) |
| `--agent <name>` | Especificar agente a usar |
| `--max-iterations <n>` | Máximo de iteraciones del bucle (por defecto: 50) |

### Modo de Depuración

Usa `RALPH_DEBUG=1` para ver salida detallada durante la ejecución:

```bash
# Ver salida detallada del agente, tiempos y prompts
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# Depurar con issue de GitHub
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

El modo de depuración muestra:
- Comandos exactos que se están ejecutando
- Salida del agente en tiempo real
- Información de tiempos
- Detalles de errores

### Preajustes de Flujo

| Bandera | Descripción |
|------|-------------|
| `--preset <name>` | Usar un preajuste de flujo (feature, tdd-red-green, debug, etc.) |

```bash
# Listar todos los preajustes disponibles
ralph-starter presets

# Usar un preajuste
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Detección de Salida

| Bandera | Descripción |
|------|-------------|
| `--completion-promise <string>` | Cadena personalizada para detectar finalización de tarea |
| `--require-exit-signal` | Requerir `EXIT_SIGNAL: true` explícito para finalización |

```bash
# Detener cuando el agente emita "FEATURE_DONE"
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Requerir señal de salida explícita
ralph-starter run --require-exit-signal "build Y"
```

### Controles de Seguridad

| Bandera | Descripción |
|------|-------------|
| `--rate-limit <n>` | Máximo de llamadas API por hora (por defecto: ilimitado) |
| `--circuit-breaker-failures <n>` | Máximo de fallos consecutivos antes de detenerse (por defecto: 3) |
| `--circuit-breaker-errors <n>` | Máximo de ocurrencias del mismo error antes de detenerse (por defecto: 5) |
| `--track-progress` | Escribir progreso en activity.md (por defecto: true) |
| `--no-track-progress` | Deshabilitar seguimiento de progreso |
| `--track-cost` | Rastrear uso de tokens y costo estimado (por defecto: true) |
| `--no-track-cost` | Deshabilitar seguimiento de costos |

```bash
# Limitar a 50 llamadas API por hora
ralph-starter run --rate-limit 50 "build X"

# Detener después de 2 fallos consecutivos
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Opciones de Fuente

| Bandera | Descripción |
|------|-------------|
| `--from <source>` | Obtener especificación de la fuente |
| `--project <name>` | Filtro de proyecto para fuentes |
| `--label <name>` | Filtro de etiqueta para fuentes |
| `--status <status>` | Filtro de estado para fuentes |
| `--limit <n>` | Máximo de elementos de la fuente |
| `--issue <n>` | Número de issue específico (GitHub) |
| `--output-dir <path>` | Directorio para ejecutar tarea (omite prompt) |
| `--prd <file>` | Leer tareas desde markdown |

## Comandos de Configuración

```bash
# Establecer credenciales
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# Ver configuración
ralph-starter config list
ralph-starter config get linear.apiKey

# Eliminar
ralph-starter config delete linear.apiKey
```

## Ejemplo: Construir un Dashboard SaaS

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Observa la magia suceder...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## Probando ralph-starter

### Prueba Rápida (Sin Claves API)

Puedes probar ralph-starter con URLs públicas - no se requieren claves API:

```bash
# Probar con un gist público de GitHub o markdown raw
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Probar con issues de GitHub (requiere inicio de sesión gh CLI)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Probando el Asistente

```bash
# Iniciar el asistente interactivo
ralph-starter

# O probar el modo de ideas
ralph-starter ideas
```

### Probando con Tus Propias Especificaciones

```bash
# Crear un archivo de especificación simple
echo "Build a simple counter app with React" > my-spec.md

# Ejecutar con archivo local
ralph-starter run --from ./my-spec.md
```

### Verificando Conectividad de Fuentes

Antes de usar una integración, verifica que esté funcionando:

```bash
# Verificar qué integraciones están disponibles
ralph-starter integrations list

# Probar cada integración
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# Vista previa de elementos (dry run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## Configuración de Clave API

### Opción 1: Variables de Entorno (Recomendado para Desarrolladores)

Establece variables de entorno en tu perfil de shell o archivo `.env`:

```bash
# Agregar a ~/.bashrc, ~/.zshrc, o archivo .env
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Las variables de entorno tienen precedencia sobre el archivo de configuración.

### Opción 2: Comando de Configuración

Usa el CLI para almacenar credenciales:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Las credenciales se almacenan en `~/.ralph-starter/sources.json`.

### Referencia de Variable de Entorno

| Fuente | Variable de Entorno | Clave de Configuración |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## Requisitos

- Node.js 18+
- Al menos un agente de codificación instalado (Claude Code, Cursor, etc.)
- Git (para características de automatización)
- GitHub CLI `gh` (para creación de PR y fuente GitHub)

## Documentación

Documentación completa disponible en: https://ralphstarter.ai

## Contribuyendo

¡Las contribuciones son bienvenidas! Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para obtener pautas.

- **Solicitudes de características e ideas**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **Plantillas de proyecto**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

Para crear integraciones personalizadas, agentes o usar la API programática, consulta la [Guía de Extensión para Desarrolladores](https://ralphstarter.ai/docs/guides/extending-ralph-starter).

## Licencia

MIT
