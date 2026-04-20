import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '@llm-agent/shared';
import type { LLMProvider, GenerateOptions, GenerateResult } from './LLMProvider';
import { LLMError } from '../common/errors/AppError';

export interface AnthropicProviderConfig {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  systemPrompt: string;
}

/**
 * Provider que llama a la API de Anthropic (Claude).
 * La instancia del SDK se inyecta en el constructor para poder mockearla en tests.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private readonly client: Anthropic;
  private readonly config: AnthropicProviderConfig;

  constructor(config: AnthropicProviderConfig, client?: Anthropic) {
    this.config = config;
    this.client = client ?? new Anthropic({ apiKey: config.apiKey });
  }

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<GenerateResult> {
    const model = options.model ?? this.config.defaultModel;
    const maxTokens = options.maxTokens ?? this.config.maxTokens;

    // La API de Anthropic requiere messages SIN role: 'system'. El system prompt
    // va en un campo aparte. Filtramos los 'system' y usamos el configurado.
    const apiMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system: this.config.systemPrompt,
        messages: apiMessages,
      });

      // response.content es un array de bloques. Extraemos el texto concatenado.
      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        content,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      // Traducimos errores del SDK a nuestra jerarquia AppError.
      if (err instanceof Anthropic.APIError) {
        throw new LLMError(`Anthropic API error: ${err.message}`, {
          status: err.status,
          type: err.name,
        });
      }
      if (err instanceof Error) {
        throw new LLMError(`Error llamando a Anthropic: ${err.message}`);
      }
      throw new LLMError('Error desconocido llamando a Anthropic');
    }
  }

  async isReady(): Promise<boolean> {
    // No hay un endpoint /health oficial. Comprobamos que la API key tenga forma correcta
    // como verificacion basica. Un ping real gastaria tokens, asi que lo evitamos.
    return this.config.apiKey.startsWith('sk-ant-');
  }
}
