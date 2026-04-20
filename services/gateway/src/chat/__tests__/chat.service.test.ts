import { ChatService } from '../chat.service';
import type { ConversationClient } from '../../clients/ConversationClient';
import type { LLMClient } from '../../clients/LLMClient';

const makeConversationClient = (): jest.Mocked<ConversationClient> =>
  ({
    createConversation: jest.fn(),
    getConversation: jest.fn(),
    addMessage: jest.fn(),
    listMessages: jest.fn(),
  }) as unknown as jest.Mocked<ConversationClient>;

const makeLLMClient = (): jest.Mocked<LLMClient> =>
  ({
    generate: jest.fn(),
  }) as unknown as jest.Mocked<LLMClient>;

describe('ChatService', () => {
  describe('sin conversationId (primera interaccion)', () => {
    it('crea conversacion, persiste user msg, llama al LLM, persiste assistant msg', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      conv.createConversation.mockResolvedValue({ id: 'c1', userId: 'u1', title: null });
      conv.addMessage
        .mockResolvedValueOnce({ id: 'm1', conversationId: 'c1', role: 'user', content: 'hola' })
        .mockResolvedValueOnce({ id: 'm2', conversationId: 'c1', role: 'assistant', content: 'respuesta' });
      llm.generate.mockResolvedValue({ content: 'respuesta', model: 'mock-v1' });

      const service = new ChatService(conv, llm);
      const result = await service.chat({ userId: 'ext1', message: 'hola' });

      expect(conv.createConversation).toHaveBeenCalledWith('ext1', 'hola');
      expect(conv.listMessages).not.toHaveBeenCalled();
      expect(conv.addMessage).toHaveBeenNthCalledWith(1, 'c1', 'user', 'hola');
      expect(llm.generate).toHaveBeenCalledWith([{ role: 'user', content: 'hola' }], {});
      expect(conv.addMessage).toHaveBeenNthCalledWith(2, 'c1', 'assistant', 'respuesta');
      expect(result.conversationId).toBe('c1');
      expect(result.assistantMessage.content).toBe('respuesta');
    });

    it('trunca el titulo a 80 chars', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      const longMessage = 'a'.repeat(200);
      conv.createConversation.mockResolvedValue({ id: 'c1', userId: 'u1', title: null });
      conv.addMessage.mockResolvedValue({ id: 'm', conversationId: 'c1', role: 'user', content: longMessage });
      llm.generate.mockResolvedValue({ content: 'r', model: 'x' });

      const service = new ChatService(conv, llm);
      await service.chat({ userId: 'u', message: longMessage });

      expect(conv.createConversation).toHaveBeenCalledWith('u', 'a'.repeat(80));
    });
  });

  describe('con conversationId (continuacion)', () => {
    it('carga historial y lo pasa al LLM', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      const cid = 'cjld2cjxh0000qzrmn831i7rn';
      conv.getConversation.mockResolvedValue({ id: cid, userId: 'u', title: null });
      conv.listMessages.mockResolvedValue([
        { id: 'm0', conversationId: cid, role: 'user', content: 'hola previo' },
        { id: 'm1', conversationId: cid, role: 'assistant', content: 'respuesta previa' },
      ]);
      conv.addMessage
        .mockResolvedValueOnce({ id: 'm2', conversationId: cid, role: 'user', content: 'segundo turno' })
        .mockResolvedValueOnce({ id: 'm3', conversationId: cid, role: 'assistant', content: 'r' });
      llm.generate.mockResolvedValue({ content: 'r', model: 'x' });

      const service = new ChatService(conv, llm);
      await service.chat({ userId: 'u', message: 'segundo turno', conversationId: cid });

      expect(conv.createConversation).not.toHaveBeenCalled();
      expect(llm.generate).toHaveBeenCalledWith(
        [
          { role: 'user', content: 'hola previo' },
          { role: 'assistant', content: 'respuesta previa' },
          { role: 'user', content: 'segundo turno' },
        ],
        {},
      );
    });
  });

  describe('propagacion de model y maxTokens', () => {
    it('pasa model y maxTokens al LLM si vienen en el input', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      conv.createConversation.mockResolvedValue({ id: 'c1', userId: 'u', title: null });
      conv.addMessage.mockResolvedValue({ id: 'm', conversationId: 'c1', role: 'user', content: 'x' });
      llm.generate.mockResolvedValue({ content: 'r', model: 'claude-sonnet-4-6' });

      const service = new ChatService(conv, llm);
      await service.chat({
        userId: 'u',
        message: 'x',
        model: 'claude-sonnet-4-6',
        maxTokens: 200,
      });

      expect(llm.generate).toHaveBeenCalledWith([{ role: 'user', content: 'x' }], {
        model: 'claude-sonnet-4-6',
        maxTokens: 200,
      });
    });
  });

  describe('propagacion de errores', () => {
    it('si falla conversation-client, propaga sin envolver', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      conv.createConversation.mockRejectedValue(new Error('conv caido'));
      const service = new ChatService(conv, llm);

      await expect(service.chat({ userId: 'u', message: 'x' })).rejects.toThrow(/conv caido/);
    });

    it('si falla el LLM despues de persistir el user msg, propaga', async () => {
      const conv = makeConversationClient();
      const llm = makeLLMClient();
      conv.createConversation.mockResolvedValue({ id: 'c1', userId: 'u', title: null });
      conv.addMessage.mockResolvedValue({ id: 'm', conversationId: 'c1', role: 'user', content: 'x' });
      llm.generate.mockRejectedValue(new Error('llm caido'));

      const service = new ChatService(conv, llm);
      await expect(service.chat({ userId: 'u', message: 'x' })).rejects.toThrow(/llm caido/);
    });
  });
});
