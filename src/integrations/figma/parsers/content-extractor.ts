/**
 * Content Extractor
 *
 * Extracts text content and information architecture from Figma designs.
 * Organizes content by frame/page hierarchy and identifies semantic roles.
 */

import type { FigmaNode, TypeStyle } from '../types.js';

/**
 * Semantic roles for text content
 */
export type SemanticRole =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'button'
  | 'label'
  | 'link'
  | 'caption'
  | 'placeholder'
  | 'navigation'
  | 'footer'
  | 'cta'
  | 'title'
  | 'description'
  | 'unknown';

/**
 * Extracted text item with metadata
 */
export interface ExtractedText {
  /** Unique identifier for the text node */
  id: string;
  /** The text content */
  text: string;
  /** Detected semantic role */
  role: SemanticRole;
  /** Node name from Figma */
  nodeName: string;
  /** Frame path (e.g., "Home / Hero / Title") */
  framePath: string[];
  /** Typography style info */
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlign?: string;
  };
  /** Bounding box dimensions */
  bounds?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  /** Parent frame info */
  parentFrame?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Content structure for a frame/section
 */
export interface ContentSection {
  /** Section identifier */
  id: string;
  /** Section name */
  name: string;
  /** Frame type */
  type: string;
  /** Child sections */
  children: ContentSection[];
  /** Text items in this section */
  textItems: ExtractedText[];
  /** Semantic groupings (e.g., hero, features, navigation) */
  semanticGroup?: string;
}

/**
 * Page content structure
 */
export interface PageContent {
  /** Page name */
  name: string;
  /** Page identifier */
  id: string;
  /** Top-level sections */
  sections: ContentSection[];
  /** All text items flattened */
  allText: ExtractedText[];
  /** Navigation items detected */
  navigation: {
    primary: string[];
    secondary: string[];
    footer: string[];
  };
}

/**
 * Full extracted content from a Figma file
 */
export interface ExtractedContent {
  /** File name */
  fileName: string;
  /** Extracted pages */
  pages: Record<string, PageContent>;
  /** Content organized by semantic role */
  byRole: Record<SemanticRole, ExtractedText[]>;
  /** Navigation structure */
  navigation: {
    primary: string[];
    footer: string[];
  };
  /** Summary statistics */
  stats: {
    totalTextItems: number;
    totalPages: number;
    totalSections: number;
    roleBreakdown: Record<SemanticRole, number>;
  };
}

/**
 * Extract all content from Figma nodes
 */
export function extractContent(nodes: FigmaNode[], fileName: string): ExtractedContent {
  const pages: Record<string, PageContent> = {};
  const allTextItems: ExtractedText[] = [];
  const byRole: Record<SemanticRole, ExtractedText[]> = {
    heading: [],
    subheading: [],
    body: [],
    button: [],
    label: [],
    link: [],
    caption: [],
    placeholder: [],
    navigation: [],
    footer: [],
    cta: [],
    title: [],
    description: [],
    unknown: [],
  };

  // Process each node (usually pages/canvases)
  for (const node of nodes) {
    if (node.visible === false) continue;

    if (node.type === 'CANVAS') {
      // This is a page
      const pageContent = extractPageContent(node);
      pages[node.name] = pageContent;

      // Add to flattened list and role groupings
      for (const text of pageContent.allText) {
        allTextItems.push(text);
        byRole[text.role].push(text);
      }
    } else {
      // Process as a section
      const section = extractSection(node, []);
      const pageContent: PageContent = {
        name: node.name,
        id: node.id,
        sections: [section],
        allText: collectTextItems(section),
        navigation: detectNavigation(section),
      };
      pages[node.name] = pageContent;

      for (const text of pageContent.allText) {
        allTextItems.push(text);
        byRole[text.role].push(text);
      }
    }
  }

  // Build navigation from detected items
  const navigation = buildGlobalNavigation(allTextItems, pages);

  // Calculate statistics
  const roleBreakdown: Record<SemanticRole, number> = {} as Record<SemanticRole, number>;
  for (const role of Object.keys(byRole) as SemanticRole[]) {
    roleBreakdown[role] = byRole[role].length;
  }

  return {
    fileName,
    pages,
    byRole,
    navigation,
    stats: {
      totalTextItems: allTextItems.length,
      totalPages: Object.keys(pages).length,
      totalSections: countSections(pages),
      roleBreakdown,
    },
  };
}

/**
 * Extract content from a page (CANVAS node)
 */
function extractPageContent(node: FigmaNode): PageContent {
  const sections: ContentSection[] = [];

  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      sections.push(extractSection(child, [node.name]));
    }
  }

  const allText = sections.flatMap((s) => collectTextItems(s));
  const navigation = detectNavigation({ children: sections } as ContentSection);

  return {
    name: node.name,
    id: node.id,
    sections,
    allText,
    navigation,
  };
}

/**
 * Extract a section and its children recursively
 */
function extractSection(node: FigmaNode, parentPath: string[]): ContentSection {
  const framePath = [...parentPath, node.name];
  const textItems: ExtractedText[] = [];
  const children: ContentSection[] = [];

  // Extract text from this node if it's a TEXT node
  if (node.type === 'TEXT' && node.characters) {
    textItems.push(createTextItem(node, framePath, undefined));
  }

  // Process children
  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;

      if (child.type === 'TEXT' && child.characters) {
        textItems.push(createTextItem(child, framePath, node));
      } else if (isContainer(child.type)) {
        children.push(extractSection(child, framePath));
      } else if (child.children) {
        // For non-container types with children, extract text directly
        const nestedText = extractNestedText(child, framePath, node);
        textItems.push(...nestedText);
      }
    }
  }

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    children,
    textItems,
    semanticGroup: detectSemanticGroup(node.name, textItems),
  };
}

/**
 * Extract text from nested non-container nodes
 */
function extractNestedText(
  node: FigmaNode,
  framePath: string[],
  parentFrame?: FigmaNode
): ExtractedText[] {
  const items: ExtractedText[] = [];

  if (node.type === 'TEXT' && node.characters) {
    items.push(createTextItem(node, framePath, parentFrame));
  }

  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      items.push(...extractNestedText(child, framePath, parentFrame));
    }
  }

  return items;
}

/**
 * Create an extracted text item from a Figma TEXT node
 */
function createTextItem(
  node: FigmaNode,
  framePath: string[],
  parentFrame?: FigmaNode
): ExtractedText {
  const style = node.style ? extractStyle(node.style) : undefined;
  const role = identifySemanticRole(node, style, framePath, parentFrame);

  return {
    id: node.id,
    text: node.characters || '',
    role,
    nodeName: node.name,
    framePath,
    style,
    bounds: node.absoluteBoundingBox
      ? {
          width: node.absoluteBoundingBox.width,
          height: node.absoluteBoundingBox.height,
          x: node.absoluteBoundingBox.x,
          y: node.absoluteBoundingBox.y,
        }
      : undefined,
    parentFrame: parentFrame
      ? {
          id: parentFrame.id,
          name: parentFrame.name,
          type: parentFrame.type,
        }
      : undefined,
  };
}

/**
 * Extract style information from TypeStyle
 */
function extractStyle(style: TypeStyle): ExtractedText['style'] {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeightPx,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlignHorizontal?.toLowerCase(),
  };
}

/**
 * Identify the semantic role of a text node
 */
function identifySemanticRole(
  node: FigmaNode,
  style: ExtractedText['style'] | undefined,
  framePath: string[],
  parentFrame?: FigmaNode
): SemanticRole {
  const nodeName = node.name.toLowerCase();
  const text = (node.characters || '').toLowerCase();
  const parentName = parentFrame?.name.toLowerCase() || '';
  const pathStr = framePath.join('/').toLowerCase();

  // Check node name patterns first (most reliable)
  if (matchesPattern(nodeName, ['heading', 'title', 'headline', 'h1', 'h2', 'h3'])) {
    return 'heading';
  }
  if (matchesPattern(nodeName, ['subheading', 'subtitle', 'tagline', 'sub-heading'])) {
    return 'subheading';
  }
  if (matchesPattern(nodeName, ['button', 'btn', 'cta'])) {
    if (
      matchesPattern(nodeName, ['cta']) ||
      matchesPattern(text, ['get started', 'sign up', 'try', 'start'])
    ) {
      return 'cta';
    }
    return 'button';
  }
  if (matchesPattern(nodeName, ['label', 'field-label', 'input-label', 'form-label'])) {
    return 'label';
  }
  if (matchesPattern(nodeName, ['link', 'anchor', 'href'])) {
    return 'link';
  }
  if (matchesPattern(nodeName, ['caption', 'hint', 'helper'])) {
    return 'caption';
  }
  if (matchesPattern(nodeName, ['placeholder', 'input-placeholder'])) {
    return 'placeholder';
  }
  if (matchesPattern(nodeName, ['nav', 'navigation', 'menu-item', 'nav-item', 'nav-link'])) {
    return 'navigation';
  }
  if (matchesPattern(nodeName, ['footer', 'footer-link', 'footer-text'])) {
    return 'footer';
  }
  if (matchesPattern(nodeName, ['description', 'desc', 'body', 'paragraph', 'text', 'content'])) {
    return style && style.fontSize && style.fontSize >= 18 ? 'body' : 'description';
  }

  // Check parent frame patterns
  if (matchesPattern(parentName, ['nav', 'navigation', 'menu', 'header'])) {
    return 'navigation';
  }
  if (matchesPattern(parentName, ['footer'])) {
    return 'footer';
  }
  if (matchesPattern(parentName, ['button', 'btn', 'cta'])) {
    return 'button';
  }
  if (matchesPattern(parentName, ['hero'])) {
    // In hero sections, large text is likely a heading
    if (style?.fontSize && style.fontSize >= 32) {
      return 'heading';
    }
    if (style?.fontSize && style.fontSize >= 20) {
      return 'subheading';
    }
  }

  // Check frame path for context
  if (matchesPattern(pathStr, ['nav', 'navigation', 'menu', 'header'])) {
    return 'navigation';
  }
  if (matchesPattern(pathStr, ['footer'])) {
    return 'footer';
  }

  // Infer from typography
  if (style?.fontSize) {
    if (style.fontSize >= 32 && style.fontWeight && style.fontWeight >= 600) {
      return 'heading';
    }
    if (style.fontSize >= 24 && style.fontWeight && style.fontWeight >= 500) {
      return 'subheading';
    }
    if (style.fontSize <= 12) {
      return 'caption';
    }
  }

  // Check text content patterns
  if (
    text.length < 30 &&
    matchesPattern(text, ['get started', 'sign up', 'learn more', 'try', 'start', 'subscribe'])
  ) {
    return 'cta';
  }

  // Long text is likely body content
  if (text.length > 100) {
    return 'body';
  }

  // Default based on text length
  if (text.length < 50) {
    return 'label';
  }

  return 'body';
}

/**
 * Check if a string matches any of the patterns
 */
function matchesPattern(str: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) =>
      str.includes(pattern) ||
      str === pattern ||
      str.startsWith(pattern + '-') ||
      str.endsWith('-' + pattern)
  );
}

/**
 * Check if a node type is a container
 */
function isContainer(type: string): boolean {
  return ['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
}

/**
 * Detect semantic group for a section based on name and content
 */
function detectSemanticGroup(name: string, textItems: ExtractedText[]): string | undefined {
  const nameLower = name.toLowerCase();

  // Common section patterns
  const sectionPatterns: Record<string, string[]> = {
    hero: ['hero', 'banner', 'jumbotron', 'splash'],
    navigation: ['nav', 'navigation', 'menu', 'header'],
    features: ['features', 'benefits', 'highlights', 'capabilities'],
    testimonials: ['testimonials', 'reviews', 'quotes', 'social-proof'],
    pricing: ['pricing', 'plans', 'packages', 'tiers'],
    cta: ['cta', 'call-to-action', 'signup', 'get-started'],
    footer: ['footer', 'bottom'],
    about: ['about', 'story', 'mission'],
    contact: ['contact', 'reach', 'get-in-touch'],
    faq: ['faq', 'questions', 'help'],
  };

  for (const [group, patterns] of Object.entries(sectionPatterns)) {
    if (patterns.some((p) => nameLower.includes(p))) {
      return group;
    }
  }

  return undefined;
}

/**
 * Collect all text items from a section and its children
 */
function collectTextItems(section: ContentSection): ExtractedText[] {
  const items = [...section.textItems];
  for (const child of section.children) {
    items.push(...collectTextItems(child));
  }
  return items;
}

/**
 * Detect navigation items from a section
 */
function detectNavigation(section: ContentSection): PageContent['navigation'] {
  const primary: string[] = [];
  const secondary: string[] = [];
  const footer: string[] = [];

  function processSection(s: ContentSection, isFooter: boolean = false) {
    const isNav =
      s.semanticGroup === 'navigation' ||
      s.name.toLowerCase().includes('nav') ||
      s.name.toLowerCase().includes('menu');
    const isFooterSection =
      isFooter || s.semanticGroup === 'footer' || s.name.toLowerCase().includes('footer');

    for (const text of s.textItems) {
      if (text.role === 'navigation' || isNav) {
        if (isFooterSection) {
          footer.push(text.text);
        } else {
          primary.push(text.text);
        }
      } else if (text.role === 'footer') {
        footer.push(text.text);
      }
    }

    for (const child of s.children) {
      processSection(child, isFooterSection);
    }
  }

  if (section.children) {
    for (const child of section.children) {
      processSection(child);
    }
  }

  return { primary, secondary, footer };
}

/**
 * Build global navigation from all extracted text
 */
function buildGlobalNavigation(
  allText: ExtractedText[],
  pages: Record<string, PageContent>
): ExtractedContent['navigation'] {
  const primary: Set<string> = new Set();
  const footer: Set<string> = new Set();

  // Collect from role-based items
  for (const text of allText) {
    if (text.role === 'navigation') {
      primary.add(text.text);
    } else if (text.role === 'footer') {
      footer.add(text.text);
    }
  }

  // Also collect from page-level navigation
  for (const page of Object.values(pages)) {
    for (const item of page.navigation.primary) {
      primary.add(item);
    }
    for (const item of page.navigation.footer) {
      footer.add(item);
    }
  }

  return {
    primary: Array.from(primary),
    footer: Array.from(footer),
  };
}

/**
 * Count total sections across all pages
 */
function countSections(pages: Record<string, PageContent>): number {
  let count = 0;

  function countInSection(section: ContentSection) {
    count++;
    for (const child of section.children) {
      countInSection(child);
    }
  }

  for (const page of Object.values(pages)) {
    for (const section of page.sections) {
      countInSection(section);
    }
  }

  return count;
}

/**
 * Format extracted content as JSON for output
 */
export function formatContentAsJson(content: ExtractedContent): string {
  // Build a simplified structure matching the spec example
  const pages: Record<string, Record<string, unknown>> = {};

  for (const [pageName, pageContent] of Object.entries(content.pages)) {
    const pageData: Record<string, unknown> = {};

    for (const section of pageContent.sections) {
      pageData[toCamelCase(section.name)] = formatSection(section);
    }

    pages[toCamelCase(pageName)] = pageData;
  }

  return JSON.stringify(
    {
      pages,
      navigation: content.navigation,
    },
    null,
    2
  );
}

/**
 * Format a section for JSON output
 */
function formatSection(section: ContentSection): unknown {
  // If section has multiple text items that look like a list, return as array
  if (section.textItems.length > 1 && section.children.length === 0) {
    const items = section.textItems.map((t) => ({
      [t.role]: t.text,
    }));

    // Check if all items have the same structure
    const roles = new Set(section.textItems.map((t) => t.role));
    if (roles.size === 1) {
      return section.textItems.map((t) => t.text);
    }

    return items;
  }

  // Build object from text items
  const result: Record<string, unknown> = {};

  for (const text of section.textItems) {
    const key = toCamelCase(text.nodeName) || text.role;
    result[key] = text.text;
  }

  // Add children
  for (const child of section.children) {
    const key = toCamelCase(child.name);
    const childData = formatSection(child);

    // Merge if key exists
    if (result[key] && typeof result[key] === 'object' && typeof childData === 'object') {
      result[key] = { ...(result[key] as object), ...(childData as object) };
    } else {
      result[key] = childData;
    }
  }

  return result;
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, (chr) => chr.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Format extracted content as Markdown
 */
export function formatContentAsMarkdown(content: ExtractedContent): string {
  const sections: string[] = [`# Extracted Content: ${content.fileName}\n`];

  // Summary
  sections.push('## Summary\n');
  sections.push(`- **Total Text Items:** ${content.stats.totalTextItems}`);
  sections.push(`- **Pages:** ${content.stats.totalPages}`);
  sections.push(`- **Sections:** ${content.stats.totalSections}\n`);

  // Role breakdown
  sections.push('### Content by Role\n');
  for (const [role, count] of Object.entries(content.stats.roleBreakdown)) {
    if (count > 0) {
      sections.push(`- **${role}:** ${count}`);
    }
  }
  sections.push('');

  // Navigation
  if (content.navigation.primary.length > 0 || content.navigation.footer.length > 0) {
    sections.push('## Navigation\n');

    if (content.navigation.primary.length > 0) {
      sections.push('### Primary Navigation');
      for (const item of content.navigation.primary) {
        sections.push(`- ${item}`);
      }
      sections.push('');
    }

    if (content.navigation.footer.length > 0) {
      sections.push('### Footer Navigation');
      for (const item of content.navigation.footer) {
        sections.push(`- ${item}`);
      }
      sections.push('');
    }
  }

  // Pages and content
  sections.push('## Content by Page\n');

  for (const [pageName, pageContent] of Object.entries(content.pages)) {
    sections.push(`### ${pageName}\n`);

    for (const section of pageContent.sections) {
      sections.push(formatSectionAsMarkdown(section, 4));
    }
  }

  // JSON structure
  sections.push('## Content Structure (JSON)\n');
  sections.push('```json');
  sections.push(formatContentAsJson(content));
  sections.push('```\n');

  return sections.join('\n');
}

/**
 * Format a section as markdown
 */
function formatSectionAsMarkdown(section: ContentSection, headingLevel: number): string {
  const lines: string[] = [];
  const heading = '#'.repeat(Math.min(headingLevel, 6));

  lines.push(`${heading} ${section.name}`);

  if (section.semanticGroup) {
    lines.push(`*Semantic: ${section.semanticGroup}*\n`);
  }

  // Text items
  if (section.textItems.length > 0) {
    for (const text of section.textItems) {
      lines.push(
        `- **[${text.role}]** ${text.text.substring(0, 100)}${text.text.length > 100 ? '...' : ''}`
      );
    }
    lines.push('');
  }

  // Children
  for (const child of section.children) {
    lines.push(formatSectionAsMarkdown(child, headingLevel + 1));
  }

  return lines.join('\n');
}
