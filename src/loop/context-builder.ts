/**
 * Context builder for intelligent prompt trimming across loop iterations.
 *
 * Reduces input tokens by progressively narrowing the context sent to the agent:
 * - Iteration 1: Full spec + skills + full implementation plan
 * - Iterations 2-3: Abbreviated spec + current task only + compressed feedback
 * - Iterations 4+: Current task only + error summary
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { estimateTokens } from './cost-tracker.js';
import type { PlanTask, TaskCount } from './task-counter.js';

export interface ContextBuildOptions {
  /** The full task/spec content (original prompt) */
  fullTask: string;
  /** Task with skills appended */
  taskWithSkills: string;
  /** Current task from IMPLEMENTATION_PLAN.md */
  currentTask: PlanTask | null;
  /** Task count info */
  taskInfo: TaskCount;
  /** Current iteration number (1-based) */
  iteration: number;
  /** Max iterations for this loop */
  maxIterations: number;
  /** Validation feedback from previous iteration */
  validationFeedback?: string;
  /** Maximum input tokens budget (0 = unlimited) */
  maxInputTokens?: number;
  /** Abbreviated spec summary for later iterations (avoids agent re-reading specs/) */
  specSummary?: string;
  /** Skip IMPLEMENTATION_PLAN.md instructions in preamble (used by fix --design) */
  skipPlanInstructions?: boolean;
  /** Iteration log content from .ralph/iteration-log.md (previous iteration summaries) */
  iterationLog?: string;
  /** Source integration type (github, linear, figma, notion, file) for source-specific prompts */
  sourceType?: string;
  /** Whether Figma images were downloaded to public/images/ */
  figmaImagesDownloaded?: boolean;
  /** Font substitutions applied (original → Google Fonts alternative) */
  figmaFontSubstitutions?: Array<{ original: string; substitute: string }>;
}

export interface BuiltContext {
  /** The assembled prompt to send to the agent */
  prompt: string;
  /** Estimated token count */
  estimatedTokens: number;
  /** Whether the context was trimmed */
  wasTrimmed: boolean;
  /** Debug info about what was included/excluded */
  debugInfo: string;
}

/**
 * Strip ANSI escape codes from text
 */
function stripAnsi(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI escape codes requires control chars
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Compress validation feedback to reduce token usage.
 * Keeps only the failing command names and truncated error output.
 */
export function compressValidationFeedback(feedback: string, maxChars: number = 2000): string {
  if (!feedback) return '';

  const stripped = stripAnsi(feedback);

  // Already under budget
  if (stripped.length <= maxChars) return stripped;

  const lines = stripped.split('\n');
  const compressed: string[] = ['## Validation Failed\n'];
  let currentLength = compressed[0].length;
  let sectionCount = 0;
  let totalSections = 0;

  // Count total ### sections for the omission summary
  for (const line of lines) {
    if (line.startsWith('### ')) totalSections++;
  }

  for (const line of lines) {
    // Track section headers (### command name)
    if (line.startsWith('### ')) {
      // If we already have one complete section and are over budget, stop
      if (sectionCount >= 1 && currentLength + line.length + 1 > maxChars - 100) {
        const remaining = totalSections - sectionCount;
        if (remaining > 0) {
          compressed.push(`\n[${remaining} more failing section(s) omitted]`);
        }
        break;
      }
      sectionCount++;
    }

    // Always include ## and ### headers
    if (line.startsWith('### ') || line.startsWith('## ')) {
      compressed.push(line);
      currentLength += line.length + 1;
      continue;
    }

    // Include error lines up to budget
    if (currentLength + line.length + 1 <= maxChars - 50) {
      compressed.push(line);
      currentLength += line.length + 1;
    }
  }

  compressed.push('\nPlease fix the above issues before continuing.');
  return compressed.join('\n');
}

/**
 * Build an abbreviated spec summary from the specs/ directory.
 * Gives later iterations a quick design reference without requiring
 * the agent to re-read spec files via tool calls.
 */
export function buildSpecSummary(cwd: string, maxChars: number = 1500): string | undefined {
  const specsDir = join(cwd, 'specs');
  if (!existsSync(specsDir)) return undefined;

  try {
    const specFiles = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
    if (specFiles.length === 0) return undefined;

    const parts: string[] = [];
    let totalLength = 0;

    for (const file of specFiles) {
      const content = readFileSync(join(specsDir, file), 'utf-8');
      const available = maxChars - totalLength;
      if (available <= 100) {
        parts.push(`\n[${specFiles.length - parts.length} more spec file(s) omitted]`);
        break;
      }
      const truncated =
        content.length > available
          ? `${content.slice(0, available)}\n[... truncated ...]`
          : content;
      parts.push(truncated);
      totalLength += truncated.length;
    }

    return parts.join('\n---\n');
  } catch {
    return undefined;
  }
}

/**
 * Build a trimmed implementation plan context showing only the current task
 * with a summary of completed and pending tasks.
 */
export function buildTrimmedPlanContext(currentTask: PlanTask, taskInfo: TaskCount): string {
  const completedCount = taskInfo.completed;
  const pendingCount = taskInfo.pending;
  const taskNum = completedCount + 1;

  const subtasksList =
    currentTask.subtasks
      ?.map((st) => {
        const checkbox = st.completed ? '[x]' : '[ ]';
        return `- ${checkbox} ${st.name}`;
      })
      .join('\n') || '';

  const lines: string[] = [];

  if (completedCount > 0) {
    lines.push(`> ${completedCount} task(s) already completed.`);
  }

  lines.push(`\n## Current Task (${taskNum}/${taskInfo.total}): ${currentTask.name}\n`);

  if (subtasksList) {
    lines.push('Subtasks:');
    lines.push(subtasksList);
  }

  if (pendingCount > 1) {
    lines.push(`\n> ${pendingCount - 1} more task(s) remaining after this one.`);
  }

  lines.push(
    '\nComplete these subtasks, then mark them done in IMPLEMENTATION_PLAN.md by changing [ ] to [x].'
  );

  return lines.join('\n');
}

/**
 * Build the iteration context with intelligent trimming.
 */
export function buildIterationContext(opts: ContextBuildOptions): BuiltContext {
  const {
    fullTask: _fullTask,
    taskWithSkills,
    currentTask,
    taskInfo,
    iteration,
    validationFeedback,
    maxInputTokens = 0,
    specSummary,
    skipPlanInstructions = false,
  } = opts;

  const totalTasks = taskInfo.total;
  const completedTasks = taskInfo.completed;
  const debugParts: string[] = [];
  let prompt: string;
  let wasTrimmed = false;

  // Plan-related rules — omitted for fix/design passes where IMPLEMENTATION_PLAN.md is irrelevant
  const planRules = skipPlanInstructions
    ? '- This is a fix/review pass. Focus on the specific instructions in the task below.'
    : `- Study IMPLEMENTATION_PLAN.md and work on ONE task at a time
- Mark each subtask [x] in IMPLEMENTATION_PLAN.md immediately when done
- Study specs/ directory for original requirements`;

  // Loop-aware preamble — gives the agent behavioral context per Ralph Playbook patterns
  const preamble = `You are a coding agent in an autonomous development loop (iteration ${iteration}/${opts.maxIterations}).

Rules:
- IMPORTANT: The current working directory IS the project root. Create ALL files here — do NOT create a subdirectory for the project (e.g., do NOT run \`mkdir my-app\` or \`npx create-vite my-app\`). If you use a scaffolding tool, run it with \`.\` as the target (e.g., \`npm create vite@latest . -- --template react\`).
${planRules}
- Don't assume functionality is not already implemented — search the codebase first
- Implement completely — no placeholders or stubs
- Create files before importing them — never import components or modules that don't exist yet
- Do NOT run build or dev server commands yourself — the loop automatically runs lint checks between iterations and a full build on the final iteration. NEVER start a dev server (\`npm run dev\`, \`npx vite\`, etc.) — it blocks forever and wastes resources. (Exception: if explicitly told to do visual verification, you may briefly start a dev server and MUST kill it when done.)
${skipPlanInstructions ? '- Follow the completion instructions in the task below' : '- When ALL tasks are complete, explicitly state "All tasks completed"'}
- If you learn how to run/build the project, update AGENTS.md

Technology gotchas (CRITICAL — follow these exactly):
- Tailwind CSS v4 (current version): The setup has changed significantly from v3.
  * For Vite projects: use \`@tailwindcss/vite\` plugin (NOT PostCSS). For non-Vite: use \`@tailwindcss/postcss\` with \`plugins: { '@tailwindcss/postcss': {} }\`
  * CSS file must use: \`@import "tailwindcss";\` (NOT \`@tailwind base/components/utilities\` — those are v3 directives)
  * Do NOT create tailwind.config.js — Tailwind v4 uses CSS-based configuration
  * CUSTOM COLORS/FONTS: Use \`@theme inline { }\` in your CSS to define design tokens. Example:
    \`@theme inline { --color-brand: #C8943E; --color-cream: #FDF6EC; --font-display: 'DM Serif Display', serif; }\`
    This auto-generates ALL utility variants (bg-brand, text-brand/50, from-brand, ring-brand, fill-brand, etc.)
    NEVER manually define utility classes like \`.bg-brand { background-color: ... }\` — that breaks opacity modifiers and gradient utilities
  * Use \`bg-brand/80\` syntax for opacity (NOT \`bg-opacity-80\` — removed in v4)
  * For animations: use \`tw-animate-css\` (NOT \`tailwindcss-animate\`)
  * Do NOT add manual CSS resets (\`* { margin: 0 }\`) — Tailwind's Preflight handles this
- JSX: Never put unescaped quotes inside attribute strings. For SVG backgrounds or data URLs, use a CSS file or encodeURIComponent().
- Do NOT run \`npm run build\` or \`npm run dev\` manually — the loop handles validation automatically (lint between tasks, full build at the end).

Design quality (IMPORTANT):
- FIRST PRIORITY: If specs/ contains a design specification, follow it EXACTLY — match the described colors, spacing, layout, typography, and visual style faithfully. The spec is the source of truth.
- If no spec exists, choose ONE clear design direction (bold/minimal/retro/editorial/playful) and commit to it
- Use a specific color palette with max 3-4 colors, not rainbow gradients
- Avoid generic AI aesthetics: no purple-blue gradient backgrounds/text, no glass morphism/neumorphism, no Inter/Roboto defaults — pick distinctive typography (e.g. DM Sans, Playfair Display, Space Mono)
${
  opts.sourceType === 'figma'
    ? `
Figma-to-code guidelines (CRITICAL — your spec comes from a Figma design file):
- AUTO-LAYOUT → FLEXBOX/GRID: "horizontal" = \`display: flex; flex-direction: row\`. "Vertical" = \`flex-direction: column\`. "Wrap" = \`flex-wrap: wrap\`. Use \`gap\` for item spacing. Never use margin for gap spacing in flex containers.
- COLORS: Match colors EXACTLY as specified — copy hex/rgba values from design tokens verbatim. For opacity, use the exact value (e.g. \`/80\` not \`/75\`). If the spec includes a "Design Tokens" section with CSS variables, put them in \`@theme inline { }\` and use Tailwind utilities (e.g. \`bg-primary\`, \`text-accent/80\`). If not, extract colors from the spec and create the @theme block yourself.
- TYPOGRAPHY: ${opts.figmaFontSubstitutions?.length ? 'The spec includes a "Font Substitutions" section — use the substitute Google Fonts listed there. Import them via Google Fonts `<link>` tag.' : 'Use the EXACT font names from the spec. Add Google Fonts `<link>` import in the HTML head. Do NOT substitute with generic fonts.'} Apply exact font-size, font-weight, line-height, and letter-spacing values from the spec — do NOT round or approximate these values.
- SIZING: The spec shows explicit sizing modes per element: "fill container" = \`flex: 1\` (or \`width: 100%\` for block elements). "Hug contents" = \`width: fit-content\`. "Fixed" = exact px dimensions. These are more reliable than constraints — always use them when present.
- WRAP: When the spec shows "Wrap: flex-wrap: wrap", add \`flex-wrap: wrap\`. Use the "Row gap" value for \`row-gap\` in wrapped layouts.
- ABSOLUTE CHILDREN: Elements marked "Positioning: absolute" are absolutely positioned within their auto-layout parent. Use \`position: absolute\` with coordinates from the spec.
- OVERFLOW: "Overflow: hidden" = \`overflow: hidden\`. "Scrollable" = \`overflow-x: auto\` or \`overflow-y: auto\` as indicated.
- STICKY/FIXED: "Scroll behavior: position: sticky" = \`position: sticky; top: 0\`. "position: fixed" = \`position: fixed\`.
- SIZE CONSTRAINTS: Apply \`min-width\`/\`max-width\`/\`min-height\`/\`max-height\` EXACTLY as shown in the spec for responsive behavior.
- SPACING: Apply padding and margin EXACTLY as specified (top right bottom left notation). Do not simplify shorthand if values differ per side. Match gap values exactly.
- BORDER RADIUS: Use exact border-radius values from the spec (e.g., 12px means \`rounded-[12px]\` in Tailwind, not \`rounded-xl\`). For per-corner radii, apply each corner value individually.
- BORDERS: When the spec shows individual border sides (border-top, border-right, etc.), apply them individually — do NOT combine into shorthand \`border\`. For dashed borders, use \`border-style: dashed\`.
- SHADOWS: Reproduce box-shadow values exactly (x, y, blur, spread, color) from the design tokens. Do not substitute with generic Tailwind shadow utilities unless they match the exact spec values.
- EFFECTS: Implement ALL visible effects (blur, shadow, opacity). For \`backdrop-filter: blur()\`, apply exact values. Do not skip subtle effects like background blur or low-opacity overlays.
- ROTATION: Apply \`transform: rotate(Xdeg)\` exactly as specified. Set \`transform-origin\` if the element is positioned.
- IMAGE FILTERS: When the spec includes a "Filters" line (e.g. \`filter: brightness(1.10) contrast(0.90)\`), apply it to the image element exactly.
- RESPONSIVE: The Figma spec shows a single breakpoint. Add responsive breakpoints: stack columns on mobile, adjust font sizes, add appropriate padding.
${
  opts.figmaImagesDownloaded
    ? `- IMAGES: Design images have been downloaded to \`public/images/\`. Use the local file paths referenced in the spec (e.g. \`/images/abc123.png\`). For any missing images, fall back to \`https://placehold.co\` with exact dimensions.
- IMAGE IMPLEMENTATION: The spec marks each image with its Figma element name, scale mode, and CSS hints. Follow these rules:
  * "Image (Background)" or "Image (Hero Background)" = container with content on top. Use \`position: relative\` on container, then either:
    - CSS \`background-image\` + \`background-size: cover\`, OR
    - \`<img>\` with \`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0\` + content with \`position: relative; z-index: 1\`
  * Scale mode FILL = \`object-fit: cover\` (crop to fill). FIT = \`object-fit: contain\`. STRETCH = \`object-fit: fill\`
  * For hero sections ("Hero Background"): the image MUST fill the entire section. Use \`min-height\` from the spec or \`100vh\`. Never let the image leave gaps.
  * Match the image to the correct element by checking the "Element:" name in the spec
- IMAGE CROPPING: When the spec includes a "Crop position" line (e.g. \`object-position: 30% 20%\` or \`background-position: 30% 20%\`), you MUST apply it. This controls which part of the image is visible when cropped by \`object-fit: cover\`. Without it, CSS defaults to centering which may show the wrong region of the image.
- ICONS: Icon SVGs have been downloaded to \`public/images/icons/\`. The spec marks each icon with an "Icon (SVG)" section. Use \`<img src="/images/icons/filename.svg">\` or inline the SVG for color control. Size icons to match the spec dimensions.`
    : '- IMAGES: Use placeholder images from https://placehold.co with exact dimensions from the spec (e.g. `https://placehold.co/400x300`). Match the aspect ratio exactly.\n- ICONS: If the spec references icon SVGs in `/images/icons/`, use those paths. Otherwise, use a popular icon library (Lucide, Heroicons) to match the icon intent described in the spec.'
}
- POSITIONING: The spec includes (x, y) positions for each element. Use these for:
  * Elements that overlap or layer on top of each other (use \`position: absolute\` + \`top/left\` or \`inset\`)
  * Verifying element order and spacing within flex/grid containers
  * The spec includes \`z-index\` comments for overlapping siblings — apply them as CSS z-index values
- NAVIGATION: If the design has a fixed header/nav bar, implement it with \`position: fixed; top: 0; width: 100%; z-index: 50\` and add \`scroll-padding-top\` on \`<html>\` equal to the nav height so anchor links don't hide content behind the nav. For scroll-linked navigation (active section highlighting), use \`IntersectionObserver\` to detect which section is in view.
- FIDELITY: Match the design EXACTLY — pixel-perfect implementation is the goal. Do not add extra elements, animations, hover effects, or decorations not described in the spec. Do not "improve" the design. The Figma spec is the single source of truth.
- LAYER ORDER: The spec includes z-index comments (back/middle/front) for overlapping elements. Implement stacking with CSS z-index. Later elements in the spec = higher z-index = rendered on top.
- SCREENSHOTS: Frame screenshots are in \`public/images/screenshots/\` — use them as visual reference to verify your implementation matches the design.
`
    : ''
}`;

  // Inject iteration log for iterations 2+ (gives agent memory of what happened before)
  const iterationLogSection =
    iteration > 1 && opts.iterationLog
      ? `\n## Previous Iterations\n${opts.iterationLog}\nUse this history to avoid repeating failed approaches.\n`
      : '';

  // No structured tasks — pass the task with preamble
  if (!currentTask || totalTasks === 0) {
    if (iteration > 1) {
      // Later iterations without structured tasks — remind agent to create a plan
      prompt = `${preamble}${iterationLogSection}
Continue working on the project.
If you haven't already, create an IMPLEMENTATION_PLAN.md with structured tasks.
Study the specs/ directory for the original specification.

${taskWithSkills}`;
    } else {
      prompt = `${preamble}\n${taskWithSkills}`;
    }
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback);
      prompt = `${prompt}\n\n${compressed}`;
    }
    debugParts.push('mode=raw (no structured tasks)');
  } else if (iteration === 1) {
    // Iteration 1: Full context — preamble + spec + skills + full current task details
    const taskNum = completedTasks + 1;
    const subtasksList = currentTask.subtasks?.map((st) => `- [ ] ${st.name}`).join('\n') || '';

    prompt = `${preamble}
${taskWithSkills}

## Current Task (${taskNum}/${totalTasks}): ${currentTask.name}

Subtasks:
${subtasksList}

Complete these subtasks, then mark them done in IMPLEMENTATION_PLAN.md by changing [ ] to [x].`;

    debugParts.push('mode=full (iteration 1)');
    debugParts.push(`included: preamble + full spec + skills + task ${taskNum}/${totalTasks}`);
  } else if (iteration <= 3) {
    // Iterations 2-3: Preamble + trimmed plan context + spec summary
    const planContext = buildTrimmedPlanContext(currentTask, taskInfo);
    const specRef = specSummary
      ? `\n## Spec Summary (reference — follow this faithfully)\n${specSummary}\n`
      : '\nStudy specs/ for requirements if needed.';

    prompt = `${preamble}${iterationLogSection}
Continue working on the project. Check IMPLEMENTATION_PLAN.md for full progress.
${specRef}
${planContext}`;

    // Add compressed validation feedback if present
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback, 2000);
      prompt = `${prompt}\n\n${compressed}`;
      debugParts.push('included: compressed validation feedback');
    }

    wasTrimmed = true;
    debugParts.push(`mode=trimmed (iteration ${iteration})`);
    debugParts.push(`excluded: full spec, skills`);
  } else {
    // Iterations 4+: Preamble + minimal context + truncated spec hint
    const planContext = buildTrimmedPlanContext(currentTask, taskInfo);
    const specHint = specSummary
      ? `\nSpec key points:\n${specSummary.slice(0, 500)}${specSummary.length > 500 ? '\n[... see specs/ for full details ...]' : ''}\n`
      : '\nSpecs in specs/.';

    prompt = `${preamble}${iterationLogSection}
Continue working on the project. Check IMPLEMENTATION_PLAN.md for progress.
${specHint}
${planContext}`;

    // Add heavily compressed validation feedback if present
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback, 500);
      prompt = `${prompt}\n\n${compressed}`;
      debugParts.push('included: minimal validation feedback (500 chars)');
    }

    wasTrimmed = true;
    debugParts.push(`mode=minimal (iteration ${iteration})`);
    debugParts.push('excluded: spec, skills, plan history');
  }

  // Apply token budget if set
  const estimatedTokens = estimateTokens(prompt);

  if (maxInputTokens > 0 && estimatedTokens > maxInputTokens) {
    // Semantic trimming: cut at paragraph/line boundaries instead of mid-instruction
    const targetChars = maxInputTokens * 3.5; // rough chars-per-token
    if (prompt.length > targetChars) {
      // Find the last paragraph break before the budget
      let cutPoint = prompt.lastIndexOf('\n\n', targetChars);
      if (cutPoint < targetChars * 0.5) {
        // No paragraph break in the second half — fall back to last line break
        cutPoint = prompt.lastIndexOf('\n', targetChars);
      }
      if (cutPoint < targetChars * 0.5) {
        // No suitable break found — hard cut (rare edge case)
        cutPoint = targetChars;
      }
      prompt = `${prompt.slice(0, cutPoint)}\n\n[Context truncated to fit ${maxInputTokens} token budget]`;
      wasTrimmed = true;
      debugParts.push(`truncated: ${estimatedTokens} -> ~${maxInputTokens} tokens`);
    }
  }

  const finalTokens = estimateTokens(prompt);
  debugParts.push(`tokens: ~${finalTokens}`);

  return {
    prompt,
    estimatedTokens: finalTokens,
    wasTrimmed,
    debugInfo: debugParts.join(' | '),
  };
}
