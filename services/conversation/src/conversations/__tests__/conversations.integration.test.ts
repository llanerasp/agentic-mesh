import request from 'supertest';
import { createApp } from '../../app';
import type { ConversationsService } from '../conversations.service';
import { NotFoundError } from '../../common/errors/AppError';

// Test de integration del pipeline HTTP: routes -> middleware -> controller -> service mock.
// No hay DB real aqui. La capa repo se testea en otro test (cuando haya DB levantada).

const makeService = (): jest.Mocked<ConversationsService> =>
  ({
    createConversation: jest.fn(),
    addMessage: jest.fn(),
    getConversation: jest.fn(),
    listMessages: jest.fn(),
  }) as unknown as jest.Mocked<ConversationsService>;

describe('conversation service HTTP integration', () => {
  describe('POST /conversations', () => {
    it('201 con la conversacion creada', async () => {
      const service = makeService();
      service.createConversation.mockResolvedValue({ id: 'c1', userId: 'u1', title: 'hola' } as never);
      const app = createApp(service);

      const res = await request(app).post('/conversations').send({ externalUserId: 'ext1', title: 'hola' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('c1');
      expect(service.createConversation).toHaveBeenCalledWith({ externalUserId: 'ext1', title: 'hola' });
    });

    it('400 si externalUserId vacio', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).post('/conversations').send({ externalUserId: '' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /conversations/:id', () => {
    it('200 con la conversacion', async () => {
      const service = makeService();
      // cuid real para pasar validacion del params schema
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      service.getConversation.mockResolvedValue({ id: cid } as never);
      const app = createApp(service);

      const res = await request(app).get(`/conversations/${cid}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(cid);
    });

    it('400 si el conversationId no es un cuid', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).get('/conversations/not-a-cuid');
      expect(res.status).toBe(400);
    });

    it('404 si la conversacion no existe (service lanza NotFoundError)', async () => {
      const service = makeService();
      service.getConversation.mockRejectedValue(new NotFoundError('nope'));
      const app = createApp(service);
      const res = await request(app).get('/conversations/cjld2cjxh0000qzrmn831i7rn');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /conversations/:id/messages', () => {
    it('201 con el mensaje creado', async () => {
      const service = makeService();
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      service.addMessage.mockResolvedValue({ id: 'm1', content: 'hola' } as never);
      const app = createApp(service);

      const res = await request(app).post(`/conversations/${cid}/messages`).send({ role: 'user', content: 'hola' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('m1');
    });

    it('400 si role invalido', async () => {
      const service = makeService();
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      const app = createApp(service);
      const res = await request(app).post(`/conversations/${cid}/messages`).send({ role: 'bot', content: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /conversations/:id/messages', () => {
    it('200 con paginacion', async () => {
      const service = makeService();
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      service.listMessages.mockResolvedValue({
        items: [{ id: 'm1' }, { id: 'm2' }] as never,
        meta: { total: 2, page: 1, pageSize: 50, totalPages: 1, hasMore: false },
      });
      const app = createApp(service);
      const res = await request(app).get(`/conversations/${cid}/messages`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('respeta el query page/pageSize', async () => {
      const service = makeService();
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      service.listMessages.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 2, pageSize: 10, totalPages: 0, hasMore: false },
      });
      const app = createApp(service);
      await request(app).get(`/conversations/${cid}/messages?page=2&pageSize=10`);
      expect(service.listMessages).toHaveBeenCalledWith(cid, { page: 2, pageSize: 10 });
    });
  });

  describe('GET /health', () => {
    it('liveness 200 siempre', async () => {
      const service = makeService();
      const app = createApp(service);
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('alive');
    });
  });
});
