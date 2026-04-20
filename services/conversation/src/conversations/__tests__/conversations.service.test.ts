import { ConversationsService } from '../conversations.service';
import type { ConversationsRepository } from '../conversations.repository';
import { NotFoundError } from '../../common/errors/AppError';

const makeRepo = (): jest.Mocked<ConversationsRepository> =>
  ({
    findOrCreateUser: jest.fn(),
    createConversation: jest.fn(),
    getConversationById: jest.fn(),
    addMessage: jest.fn(),
    listMessages: jest.fn(),
  }) as unknown as jest.Mocked<ConversationsRepository>;

describe('ConversationsService', () => {
  describe('createConversation', () => {
    it('upsertea el usuario y crea la conversacion', async () => {
      const repo = makeRepo();
      repo.findOrCreateUser.mockResolvedValue({ id: 'u1' });
      repo.createConversation.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        title: 'test',
      } as never);

      const service = new ConversationsService(repo);
      const result = await service.createConversation({ externalUserId: 'ext1', title: 'test' });

      expect(repo.findOrCreateUser).toHaveBeenCalledWith('ext1');
      expect(repo.createConversation).toHaveBeenCalledWith('u1', 'test');
      expect(result.id).toBe('c1');
    });
  });

  describe('addMessage', () => {
    it('anyade mensaje si la conversacion existe', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue({ id: 'c1' } as never);
      repo.addMessage.mockResolvedValue({ id: 'm1', content: 'hola' } as never);

      const service = new ConversationsService(repo);
      const msg = await service.addMessage('c1', { role: 'user', content: 'hola' });

      expect(repo.addMessage).toHaveBeenCalledWith('c1', 'user', 'hola');
      expect(msg.id).toBe('m1');
    });

    it('lanza NotFoundError si la conversacion no existe', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue(null);

      const service = new ConversationsService(repo);
      await expect(service.addMessage('nope', { role: 'user', content: 'x' })).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.addMessage).not.toHaveBeenCalled();
    });
  });

  describe('getConversation', () => {
    it('devuelve la conversacion si existe', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue({ id: 'c1' } as never);
      const service = new ConversationsService(repo);
      const c = await service.getConversation('c1');
      expect(c.id).toBe('c1');
    });

    it('lanza NotFoundError si no existe', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue(null);
      const service = new ConversationsService(repo);
      await expect(service.getConversation('nope')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('listMessages', () => {
    it('pagina correctamente con meta completa', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue({ id: 'c1' } as never);
      repo.listMessages.mockResolvedValue({
        items: [
          { id: 'm1', role: 'user', content: 'a' },
          { id: 'm2', role: 'assistant', content: 'b' },
        ] as never,
        total: 5,
      });

      const service = new ConversationsService(repo);
      const { items, meta } = await service.listMessages('c1', { page: 1, pageSize: 2 });

      expect(items).toHaveLength(2);
      expect(meta).toEqual({
        total: 5,
        page: 1,
        pageSize: 2,
        totalPages: 3,
        hasMore: true,
      });
    });

    it('hasMore=false en la ultima pagina', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue({ id: 'c1' } as never);
      repo.listMessages.mockResolvedValue({ items: [], total: 5 });
      const service = new ConversationsService(repo);
      const { meta } = await service.listMessages('c1', { page: 3, pageSize: 2 });
      expect(meta.hasMore).toBe(false);
    });

    it('lanza NotFoundError si la conversacion no existe', async () => {
      const repo = makeRepo();
      repo.getConversationById.mockResolvedValue(null);
      const service = new ConversationsService(repo);
      await expect(service.listMessages('nope', { page: 1, pageSize: 10 })).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
