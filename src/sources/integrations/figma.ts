import { FigmaIntegration } from '../../integrations/figma/index.js';
import type { FigmaIntegrationOptions } from '../../integrations/figma/types.js';
import { IntegrationSource } from '../base.js';
import type { SourceOptions, SourceResult } from '../types.js';

/**
 * Figma source - fetches design specs, tokens, components, assets, and content from Figma
 *
 * Delegates to FigmaIntegration for actual API calls
 */
export class FigmaSource extends IntegrationSource {
  name = 'figma';
  description = 'Fetch design specs, tokens, components, assets, and content from Figma';

  private integration = new FigmaIntegration();

  async isAvailable(): Promise<boolean> {
    return this.integration.isAvailable();
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    // Map source options to integration options
    const integrationOptions: FigmaIntegrationOptions = {
      mode: options?.figmaMode,
      tokenFormat: options?.figmaFormat,
      framework: options?.figmaFramework,
      nodeIds: options?.figmaNodes,
      scale: options?.figmaScale,
      target: options?.figmaTarget,
      preview: options?.figmaPreview,
      mapping: options?.figmaMapping,
      label: options?.label,
      status: options?.status,
      limit: options?.limit,
    };

    const result = await this.integration.fetch(identifier, integrationOptions);

    return {
      content: result.content,
      source: result.source,
      title: result.title,
      metadata: result.metadata,
    };
  }

  protected getRequiredCredentialKey(): string {
    return 'token';
  }

  getHelp(): string {
    return this.integration.getHelp();
  }
}
