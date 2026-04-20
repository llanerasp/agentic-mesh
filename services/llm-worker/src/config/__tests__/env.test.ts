import { loadEnv } from '../env';

describe('loadEnv', () => {
  it('aplica defaults cuando el env esta vacio', () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.LLM_WORKER_PORT).toBe(3002);
    expect(env.LLM_PROVIDER).toBe('mock');
    expect(env.ANTHROPIC_MODEL).toBe('claude-haiku-4-5');
  });

  it('coerciona LLM_WORKER_PORT de string a number', () => {
    const env = loadEnv({ LLM_WORKER_PORT: '4000' });
    expect(env.LLM_WORKER_PORT).toBe(4000);
    expect(typeof env.LLM_WORKER_PORT).toBe('number');
  });

  it('rechaza LOG_LEVEL invalido', () => {
    expect(() => loadEnv({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('rechaza LLM_PROVIDER desconocido', () => {
    expect(() => loadEnv({ LLM_PROVIDER: 'openai' })).toThrow(/LLM_PROVIDER/);
  });

  it('exige ANTHROPIC_API_KEY cuando LLM_PROVIDER=anthropic', () => {
    expect(() => loadEnv({ LLM_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('acepta LLM_PROVIDER=anthropic con apiKey', () => {
    const env = loadEnv({ LLM_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'sk-ant-x' });
    expect(env.LLM_PROVIDER).toBe('anthropic');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-x');
  });

  it('NO exige apiKey cuando LLM_PROVIDER=mock', () => {
    const env = loadEnv({ LLM_PROVIDER: 'mock' });
    expect(env.LLM_PROVIDER).toBe('mock');
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('rechaza LLM_WORKER_PORT no numerico', () => {
    expect(() => loadEnv({ LLM_WORKER_PORT: 'abc' })).toThrow();
  });

  it('rechaza LLM_WORKER_PORT negativo', () => {
    expect(() => loadEnv({ LLM_WORKER_PORT: '-1' })).toThrow();
  });
});
