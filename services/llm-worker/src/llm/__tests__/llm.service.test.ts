import { LLMService } from '../llm.service';
import type { LLMProvider } from '../../providers/LLMProvider';

describe('LLMService', () => {
  const makeMockProvider = (overrides: Partial<LLMProvider> = {}): jest.Mocked<LLMProvider> =>
    ({
      name: 'fake',
      generate: jest.fn().mockResolvedValue({ content: 'ok', model: 'x' }),
      isReady: jest.fn().mockResolvedValue(true),
      ...overrides,
    }) as unknown as jest.Mocked<LLMProvider>;

  it('delega generate al provider con messages y options', async () => {
    const provider = makeMockProvider();
    const service = new LLMService(provider);

    await service.generate({
      messages: [{ role: 'user', content: 'hola' }],
      model: 'claude-haiku-4-5',
      maxTokens: 100,
    });

    expect(provider.generate).toHaveBeenCalledWith([{ role: 'user', content: 'hola' }], {
      model: 'claude-haiku-4-5',
      maxTokens: 100,
    });
  });

  it('no pasa model ni maxTokens si son undefined', async () => {
    const provider = makeMockProvider();
    const service = new LLMService(provider);

    await service.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(provider.generate).toHaveBeenCalledWith([{ role: 'user', content: 'hi' }], {});
  });

  it('propaga errores del provider sin envolver', async () => {
    const provider = makeMockProvider({
      generate: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const service = new LLMService(provider);

    await expect(service.generate({ messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow('boom');
  });

  it('isProviderReady delega al provider', async () => {
    const provider = makeMockProvider({ isReady: jest.fn().mockResolvedValue(false) });
    const service = new LLMService(provider);
    await expect(service.isProviderReady()).resolves.toBe(false);
  });

  it('getProviderName devuelve el name del provider', () => {
    const provider = makeMockProvider();
    const service = new LLMService(provider);
    expect(service.getProviderName()).toBe('fake');
  });
});
