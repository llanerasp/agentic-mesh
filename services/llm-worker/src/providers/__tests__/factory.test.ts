import { createLLMProvider } from '../factory';
import { MockProvider } from '../MockProvider';
import { AnthropicProvider } from '../AnthropicProvider';
import { BedrockProvider } from '../BedrockProvider';
import type { Env } from '../../config/env';

const baseEnv: Env = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  LLM_WORKER_PORT: 3003,
  LLM_PROVIDER: 'mock',
  ANTHROPIC_MODEL: 'claude-haiku-4-5',
  ANTHROPIC_MAX_TOKENS: 512,
  SYSTEM_PROMPT: 'test',
};

describe('createLLMProvider', () => {
  it('devuelve MockProvider cuando LLM_PROVIDER=mock', () => {
    const provider = createLLMProvider({ ...baseEnv, LLM_PROVIDER: 'mock' });
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe('mock');
  });

  it('devuelve AnthropicProvider cuando LLM_PROVIDER=anthropic y hay apiKey', () => {
    const provider = createLLMProvider({
      ...baseEnv,
      LLM_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-ant-x',
    });
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider.name).toBe('anthropic');
  });

  it('devuelve BedrockProvider cuando LLM_PROVIDER=bedrock', () => {
    const provider = createLLMProvider({ ...baseEnv, LLM_PROVIDER: 'bedrock' });
    expect(provider).toBeInstanceOf(BedrockProvider);
    expect(provider.name).toBe('bedrock');
  });

  it('lanza si LLM_PROVIDER=anthropic sin apiKey (fallback defensivo: Zod deberia haberlo evitado)', () => {
    expect(() => createLLMProvider({ ...baseEnv, LLM_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/);
  });
});
