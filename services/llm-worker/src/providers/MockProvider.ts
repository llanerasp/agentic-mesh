import type { ChatMessage } from '@llm-agent/shared';
import type { LLMProvider, GenerateOptions, GenerateResult } from './LLMProvider';

/**
 * Provider por defecto — NO llama a ningun LLM real.
 * Devuelve respuestas deterministas basadas en el ultimo mensaje del usuario.
 * Util para:
 *   - Desarrollo sin consumir creditos de Anthropic.
 *   - Tests de integracion del pipeline (gateway -> conversation -> llm-worker).
 *   - Demos en entornos offline.
 */
export class MockProvider implements LLMProvider {
  readonly name = 'mock';

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<GenerateResult> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMsg?.content ?? '';

    // Respuestas canned para saludos tipicos.
    const lower = userText.trim().toLowerCase();
    let reply: string;

    if (/^(hola|hi|hello|hey|buenas)/.test(lower)) {
      reply = 'Hola. Soy un mock provider. Responde algo mas y te devolvere un echo.';
    } else if (lower === '') {
      reply = 'No he recibido ningun mensaje del usuario.';
    } else {
      reply = `[mock echo] Recibi tu mensaje ("${userText.slice(0, 80)}${userText.length > 80 ? '…' : ''}") y lo procese en ${messages.length} turno(s).`;
    }

    // Simular latencia baja pero no 0, para que los tests de resiliencia
    // puedan observar el circuit breaker.
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      content: reply,
      model: options.model ?? 'mock-v1',
      usage: {
        inputTokens: messages.reduce((acc, m) => acc + m.content.length, 0),
        outputTokens: reply.length,
      },
    };
  }

  async isReady(): Promise<boolean> {
    // Mock siempre esta listo.
    return true;
  }
}
