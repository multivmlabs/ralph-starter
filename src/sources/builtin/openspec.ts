import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BuiltinSource } from '../base.js';
import type { SourceOptions, SourceResult } from '../types.js';

/**
 * OpenSpec source - reads specs from OpenSpec change directories
 *
 * Supports:
 * - Listing available changes: openspec:list (or no identifier)
 * - Fetching a specific change: openspec:my-feature
 * - Fetching all active changes: openspec:all
 * - Fetching global specs: openspec:specs
 */
export class OpenSpecSource extends BuiltinSource {
  name = 'openspec';
  description = 'Read specs from OpenSpec change directories';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async fetch(identifier: string, _options?: SourceOptions): Promise<SourceResult> {
    const openspecDir = this.resolveOpenSpecDir();

    const id = identifier.trim().toLowerCase();

    if (!id || id === 'list') {
      return this.listChanges(openspecDir);
    }

    if (id === 'specs' || id === 'global') {
      return this.fetchGlobalSpecs(openspecDir);
    }

    if (id === 'all') {
      return this.fetchAllChanges(openspecDir);
    }

    // Specific change name (use original identifier for case-sensitivity)
    return this.fetchChange(openspecDir, identifier.trim());
  }

  getHelp(): string {
    return [
      'openspec: Read specs from OpenSpec change directories',
      '',
      'Usage:',
      '  --from openspec              List all available changes',
      '  --from openspec:list         List all available changes',
      '  --from openspec:<name>       Fetch a specific change by name',
      '  --from openspec:all          Fetch all active changes',
      '  --from openspec:specs        Fetch global specs only',
      '',
      'Expects an openspec/ directory in the project root.',
    ].join('\n');
  }

  private resolveOpenSpecDir(): string {
    const cwd = process.cwd();
    const dir = resolve(cwd, 'openspec');

    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      this.error(`No openspec/ directory found in ${cwd}`);
    }

    return dir;
  }

  private getActiveChanges(openspecDir: string): string[] {
    const changesDir = join(openspecDir, 'changes');
    if (!existsSync(changesDir)) {
      return [];
    }

    return readdirSync(changesDir)
      .filter((name) => {
        if (name === 'archive' || name.startsWith('.')) return false;
        const fullPath = join(changesDir, name);
        return statSync(fullPath).isDirectory();
      })
      .sort();
  }

  private listChanges(openspecDir: string): SourceResult {
    const changes = this.getActiveChanges(openspecDir);

    if (changes.length === 0) {
      return {
        content: '# OpenSpec Changes\n\nNo active changes found.',
        source: 'openspec:list',
        title: 'OpenSpec Changes',
        metadata: { type: 'openspec', mode: 'list', count: 0 },
      };
    }

    const lines = changes.map((name) => {
      const changePath = join(openspecDir, 'changes', name);
      const hasProposal = existsSync(join(changePath, 'proposal.md'));
      const hasDesign = existsSync(join(changePath, 'design.md'));
      const hasTasks = existsSync(join(changePath, 'tasks.md'));
      const specsDir = join(changePath, 'specs');
      const specCount = existsSync(specsDir)
        ? readdirSync(specsDir).filter((d) => statSync(join(specsDir, d)).isDirectory()).length
        : 0;

      const parts = [];
      if (hasProposal) parts.push('proposal');
      if (hasDesign) parts.push('design');
      if (hasTasks) parts.push('tasks');
      if (specCount > 0) parts.push(`${specCount} spec${specCount > 1 ? 's' : ''}`);

      return `- **${name}** (${parts.join(', ') || 'empty'})`;
    });

    const content = `# OpenSpec Changes\n\n${changes.length} active change${changes.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}`;

    return {
      content,
      source: 'openspec:list',
      title: 'OpenSpec Changes',
      metadata: { type: 'openspec', mode: 'list', count: changes.length },
    };
  }

  private fetchChange(openspecDir: string, changeName: string): SourceResult {
    const changePath = join(openspecDir, 'changes', changeName);

    if (!existsSync(changePath) || !statSync(changePath).isDirectory()) {
      this.error(`Change not found: ${changeName}`);
    }

    const sections: string[] = [`# OpenSpec Change: ${changeName}`];
    const files: string[] = [];

    // Read proposal.md
    const proposalPath = join(changePath, 'proposal.md');
    if (existsSync(proposalPath)) {
      sections.push('\n## Proposal\n');
      sections.push(readFileSync(proposalPath, 'utf-8').trim());
      files.push('proposal.md');
    }

    // Read design.md
    const designPath = join(changePath, 'design.md');
    if (existsSync(designPath)) {
      sections.push('\n## Design\n');
      sections.push(readFileSync(designPath, 'utf-8').trim());
      files.push('design.md');
    }

    // Read tasks.md
    const tasksPath = join(changePath, 'tasks.md');
    if (existsSync(tasksPath)) {
      sections.push('\n## Tasks\n');
      sections.push(readFileSync(tasksPath, 'utf-8').trim());
      files.push('tasks.md');
    }

    // Read specs/*/spec.md
    const specsDir = join(changePath, 'specs');
    const specAreas: string[] = [];
    if (existsSync(specsDir)) {
      const areas = readdirSync(specsDir)
        .filter((d) => statSync(join(specsDir, d)).isDirectory())
        .sort();

      if (areas.length > 0) {
        sections.push('\n## Specs\n');
      }

      for (const area of areas) {
        const specPath = join(specsDir, area, 'spec.md');
        if (existsSync(specPath)) {
          sections.push(`### ${area}\n`);
          sections.push(readFileSync(specPath, 'utf-8').trim());
          files.push(`specs/${area}/spec.md`);
          specAreas.push(area);
        }
      }
    }

    return {
      content: sections.join('\n'),
      source: `openspec:${changeName}`,
      title: `OpenSpec: ${changeName}`,
      metadata: {
        type: 'openspec',
        changeName,
        files,
        hasProposal: files.includes('proposal.md'),
        hasDesign: files.includes('design.md'),
        hasTasks: files.includes('tasks.md'),
        specAreas,
      },
    };
  }

  private fetchAllChanges(openspecDir: string): SourceResult {
    const changes = this.getActiveChanges(openspecDir);

    if (changes.length === 0) {
      this.error('No active changes found in openspec/changes/');
    }

    const results = changes.map((name) => this.fetchChange(openspecDir, name));
    const content = results.map((r) => r.content).join('\n\n---\n\n');

    return {
      content,
      source: 'openspec:all',
      title: `OpenSpec: ${changes.length} changes`,
      metadata: {
        type: 'openspec',
        mode: 'all',
        changes,
        count: changes.length,
      },
    };
  }

  private fetchGlobalSpecs(openspecDir: string): SourceResult {
    const specsDir = join(openspecDir, 'specs');

    if (!existsSync(specsDir)) {
      this.error('No openspec/specs/ directory found');
    }

    const specDirs = readdirSync(specsDir)
      .filter((d) => statSync(join(specsDir, d)).isDirectory())
      .sort();

    if (specDirs.length === 0) {
      return {
        content: '# OpenSpec Global Specs\n\nNo global specs found.',
        source: 'openspec:specs',
        title: 'OpenSpec Global Specs',
        metadata: { type: 'openspec', mode: 'specs', count: 0 },
      };
    }

    const sections: string[] = ['# OpenSpec Global Specs\n'];
    const files: string[] = [];

    for (const dir of specDirs) {
      const specPath = join(specsDir, dir, 'spec.md');
      if (existsSync(specPath)) {
        sections.push(`## ${dir}\n`);
        sections.push(readFileSync(specPath, 'utf-8').trim());
        files.push(`specs/${dir}/spec.md`);
      }
    }

    return {
      content: sections.join('\n'),
      source: 'openspec:specs',
      title: 'OpenSpec Global Specs',
      metadata: {
        type: 'openspec',
        mode: 'specs',
        count: files.length,
        specs: specDirs,
      },
    };
  }
}
