import { MockProvider } from '../MockProvider';

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('responde con saludo cuando el ultimo mensaje del usuario empieza por "hola"', async () => {
    // Arrange
    const messages = [{ role: 'user' as const, content: 'Hola!' }];
    // Act
    const result = await provider.generate(messages);
    // Assert
    expect(result.content).toMatch(/mock provider/i);
  });

  it('hace echo del mensaje cuando no es un saludo', async () => {
    const messages = [{ role: 'user' as const, content: 'como funcionas?' }];
    const result = await provider.generate(messages);
    expect(result.content).toContain('como funcionas?');
    expect(result.content).toMatch(/mock echo/i);
  });

  it('toma el ULTIMO mensaje del usuario aunque haya respuestas intermedias', async () => {
    const messages = [
      { role: 'user' as const, content: 'primer mensaje' },
      { role: 'assistant' as const, content: 'respuesta intermedia' },
      { role: 'user' as const, content: 'ultimo mensaje del user' },
    ];
    const result = await provider.generate(messages);
    expect(result.content).toContain('ultimo mensaje del user');
    expect(result.content).not.toContain('primer mensaje');
  });

  it('usa el model por defecto "mock-v1" si no se especifica', async () => {
    const result = await provider.generate([{ role: 'user', content: 'x' }]);
    expect(result.model).toBe('mock-v1');
  });

  it('respeta el model si se pasa en options', async () => {
    const result = await provider.generate([{ role: 'user', content: 'x' }], { model: 'custom-model' });
    expect(result.model).toBe('custom-model');
  });

  it('devuelve usage con tokens aproximados', async () => {
    const result = await provider.generate([{ role: 'user', content: 'hola' }]);
    expect(result.usage?.inputTokens).toBeGreaterThan(0);
    expect(result.usage?.outputTokens).toBeGreaterThan(0);
  });

  it('isReady siempre devuelve true', async () => {
    await expect(provider.isReady()).resolves.toBe(true);
  });
});
