import type { ChatMessage } from '@llm-agent/shared';
import type { LLMProvider, GenerateOptions, GenerateResult } from './LLMProvider';
import { ServiceUnavailableError } from '../common/errors/AppError';

/**
 * Stub para AWS Bedrock. Se completa en Fase 7.
 * Mantiene el contrato LLMProvider para que el factory pueda instanciarlo,
 * pero lanza error en runtime hasta que se implemente.
 */
export class BedrockProvider implements LLMProvider {
  readonly name = 'bedrock';

  async generate(_messages: ChatMessage[], _options: GenerateOptions = {}): Promise<GenerateResult> {
    throw new ServiceUnavailableError('BedrockProvider aun no implementado (Fase 7).');
  }

  async isReady(): Promise<boolean> {
    return false;
  }
}
