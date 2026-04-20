import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from '../AnthropicProvider';
import { LLMError } from '../../common/errors/AppError';

describe('AnthropicProvider', () => {
  const baseConfig = {
    apiKey: 'sk-ant-test-key',
    defaultModel: 'claude-haiku-4-5',
    maxTokens: 512,
    systemPrompt: 'test system prompt',
  };

  // Helper: crea un mock del client Anthropic con create() configurable.
  const mockClient = (createImpl: jest.Mock): Anthropic => {
    return { messages: { create: createImpl } } as unknown as Anthropic;
  };

  describe('generate()', () => {
    it('llama al SDK con los parametros correctos y devuelve el texto concatenado', async () => {
      const createMock = jest.fn().mockResolvedValue({
        model: 'claude-haiku-4-5',
        content: [
          { type: 'text', text: 'Hola,' },
          { type: 'text', text: ' buenas.' },
        ],
        usage: { input_tokens: 10, output_tokens: 5 },
      });
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      const result = await provider.generate([{ role: 'user', content: 'hi' }]);

      expect(createMock).toHaveBeenCalledWith({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: 'test system prompt',
        messages: [{ role: 'user', content: 'hi' }],
      });
      expect(result.content).toBe('Hola, buenas.');
      expect(result.model).toBe('claude-haiku-4-5');
      expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    });

    it('filtra mensajes role=system (Anthropic los recibe aparte)', async () => {
      const createMock = jest.fn().mockResolvedValue({
        model: 'claude-haiku-4-5',
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      await provider.generate([
        { role: 'system', content: 'ignora esto' },
        { role: 'user', content: 'hola' },
      ]);

      const callArgs = createMock.mock.calls[0]?.[0] as { messages: Array<{ role: string }> };
      expect(callArgs.messages).toEqual([{ role: 'user', content: 'hola' }]);
    });

    it('usa model y maxTokens de options si se proporcionan', async () => {
      const createMock = jest.fn().mockResolvedValue({
        model: 'claude-sonnet-4-6',
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      await provider.generate([{ role: 'user', content: 'hi' }], { model: 'claude-sonnet-4-6', maxTokens: 100 });

      const args = createMock.mock.calls[0]?.[0] as { model: string; max_tokens: number };
      expect(args.model).toBe('claude-sonnet-4-6');
      expect(args.max_tokens).toBe(100);
    });

    it('ignora bloques no-text en la respuesta', async () => {
      const createMock = jest.fn().mockResolvedValue({
        model: 'claude-haiku-4-5',
        content: [
          { type: 'text', text: 'texto' },
          { type: 'tool_use', id: 'x', name: 'y', input: {} },
        ],
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      const result = await provider.generate([{ role: 'user', content: 'x' }]);
      expect(result.content).toBe('texto');
    });

    it('traduce errores del SDK a LLMError', async () => {
      const apiError = new Anthropic.APIError(429, { error: { message: 'rate limit' } }, 'rate limit', {});
      const createMock = jest.fn().mockRejectedValue(apiError);
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      await expect(provider.generate([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(LLMError);
    });

    it('traduce errores genericos a LLMError', async () => {
      const createMock = jest.fn().mockRejectedValue(new Error('conexion caida'));
      const provider = new AnthropicProvider(baseConfig, mockClient(createMock));

      await expect(provider.generate([{ role: 'user', content: 'hi' }])).rejects.toThrow(/conexion caida/);
    });
  });

  describe('isReady()', () => {
    it('true si la apiKey empieza por "sk-ant-"', async () => {
      const provider = new AnthropicProvider(baseConfig, mockClient(jest.fn()));
      await expect(provider.isReady()).resolves.toBe(true);
    });

    it('false si la apiKey no tiene formato Anthropic', async () => {
      const provider = new AnthropicProvider({ ...baseConfig, apiKey: 'wrong' }, mockClient(jest.fn()));
      await expect(provider.isReady()).resolves.toBe(false);
    });
  });
});
