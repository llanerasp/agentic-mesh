import request from 'supertest';
import { createApp } from '../../app';
import type { ChatService } from '../chat.service';
import { UpstreamError, LLMError } from '../../common/errors/AppError';

const makeService = (): jest.Mocked<ChatService> =>
  ({
    chat: jest.fn(),
  }) as unknown as jest.Mocked<ChatService>;

describe('gateway HTTP integration', () => {
  describe('POST /chat', () => {
    it('200 con el resultado del chat', async () => {
      const service = makeService();
      service.chat.mockResolvedValue({
        conversationId: 'c1',
        userMessage: { id: 'm1', conversationId: 'c1', role: 'user', content: 'hola' },
        assistantMessage: { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'respuesta' },
        model: 'mock-v1',
      });
      const app = createApp(service);

      const res = await request(app).post('/chat').send({ userId: 'u1', message: 'hola' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversationId).toBe('c1');
      expect(res.body.data.assistantMessage.content).toBe('respuesta');
    });

    it('400 si message esta vacio', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).post('/chat').send({ userId: 'u1', message: '' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('400 si userId esta ausente', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).post('/chat').send({ message: 'hola' });
      expect(res.status).toBe(400);
    });

    it('400 si conversationId no es un cuid', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).post('/chat').send({ userId: 'u', message: 'x', conversationId: 'not-cuid' });
      expect(res.status).toBe(400);
    });

    it('502 si un upstream falla (UpstreamError)', async () => {
      const service = makeService();
      service.chat.mockRejectedValue(new UpstreamError('conversation caido'));
      const app = createApp(service);

      const res = await request(app).post('/chat').send({ userId: 'u', message: 'x' });
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('502 si el LLM falla (LLMError)', async () => {
      const service = makeService();
      service.chat.mockRejectedValue(new LLMError('llm caido'));
      const app = createApp(service);

      const res = await request(app).post('/chat').send({ userId: 'u', message: 'x' });
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('LLM_ERROR');
    });

    it('security headers presentes (helmet)', async () => {
      const service = makeService();
      service.chat.mockResolvedValue({
        conversationId: 'c1',
        userMessage: { id: 'm1', conversationId: 'c1', role: 'user', content: 'hi' },
        assistantMessage: { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'hi' },
        model: 'm',
      });
      const app = createApp(service);
      const res = await request(app).post('/chat').send({ userId: 'u', message: 'x' });
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });
  });

  describe('GET /health', () => {
    it('liveness 200', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('alive');
    });

    it('readiness 200', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ready');
    });
  });
});
