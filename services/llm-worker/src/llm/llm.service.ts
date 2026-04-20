import type { LLMProvider, GenerateResult } from '../providers/LLMProvider';
import type { GenerateInput } from './llm.schemas';

/**
 * Capa de negocio. NO sabe de HTTP (no recibe req/res).
 * Delega la generacion al provider inyectado. En un futuro aqui iria:
 * - Truncado/resumen de historial largo.
 * - Post-procesado del contenido (filtros de contenido, redaccion, etc.).
 * - Metricas de negocio (tokens consumidos por usuario, etc.).
 */
export class LLMService {
  constructor(private readonly provider: LLMProvider) {}

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const options = {
      ...(input.model !== undefined && { model: input.model }),
      ...(input.maxTokens !== undefined && { maxTokens: input.maxTokens }),
    };
    return this.provider.generate(input.messages, options);
  }

  async isProviderReady(): Promise<boolean> {
    return this.provider.isReady();
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
