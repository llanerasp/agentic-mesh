import request from 'supertest';
import { createApp } from '../../app';
import { LLMService } from '../llm.service';
import { MockProvider } from '../../providers/MockProvider';

describe('POST /generate (integration, MockProvider)', () => {
  // Usamos el MockProvider real: es determinista y no llama a red externa.
  const service = new LLMService(new MockProvider());
  const app = createApp(service);

  it('200 y devuelve respuesta del mock con estructura ApiResponse correcta', async () => {
    const res = await request(app)
      .post('/generate')
      .send({ messages: [{ role: 'user', content: 'hola' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      content: expect.any(String),
      model: 'mock-v1',
    });
  });

  it('400 cuando messages esta vacio', async () => {
    const res = await request(app).post('/generate').send({ messages: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 cuando un mensaje tiene role invalido', async () => {
    const res = await request(app)
      .post('/generate')
      .send({ messages: [{ role: 'robot', content: 'hola' }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 cuando un mensaje tiene content vacio', async () => {
    const res = await request(app)
      .post('/generate')
      .send({ messages: [{ role: 'user', content: '' }] });
    expect(res.status).toBe(400);
  });

  it('400 cuando maxTokens supera el limite', async () => {
    const res = await request(app)
      .post('/generate')
      .send({
        messages: [{ role: 'user', content: 'x' }],
        maxTokens: 99999,
      });
    expect(res.status).toBe(400);
  });

  it('acepta model custom en el body', async () => {
    const res = await request(app)
      .post('/generate')
      .send({
        messages: [{ role: 'user', content: 'x' }],
        model: 'custom-model-x',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.model).toBe('custom-model-x');
  });
});

describe('GET /health endpoints', () => {
  const service = new LLMService(new MockProvider());
  const app = createApp(service);

  it('GET /health -> 200 con status alive', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('alive');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('GET /health/ready -> 200 con provider=mock cuando el mock esta listo', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.provider).toBe('mock');
  });
});
