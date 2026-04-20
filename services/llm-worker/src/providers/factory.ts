import type { LLMProvider } from './LLMProvider';
import { MockProvider } from './MockProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { BedrockProvider } from './BedrockProvider';
import type { Env } from '../config/env';

/**
 * Crea la implementacion de LLMProvider correcta segun la configuracion.
 * UNICO punto del codigo que conoce todos los providers existentes (Factory Pattern).
 * El resto de la app depende solo de la interfaz LLMProvider.
 */
export const createLLMProvider = (env: Env): LLMProvider => {
  switch (env.LLM_PROVIDER) {
    case 'mock':
      return new MockProvider();

    case 'anthropic':
      // El env schema ya garantiza que ANTHROPIC_API_KEY existe cuando provider=anthropic.
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY ausente. Deberia haber fallado la validacion Zod al arrancar.');
      }
      return new AnthropicProvider({
        apiKey: env.ANTHROPIC_API_KEY,
        defaultModel: env.ANTHROPIC_MODEL,
        maxTokens: env.ANTHROPIC_MAX_TOKENS,
        systemPrompt: env.SYSTEM_PROMPT,
      });

    case 'bedrock':
      return new BedrockProvider();
  }
};
