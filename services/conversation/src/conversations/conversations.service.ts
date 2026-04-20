import type { Message, Conversation } from '@prisma/client';
import type { ConversationsRepository } from './conversations.repository';
import { NotFoundError } from '../common/errors/AppError';
import type { CreateConversationInput, AddMessageInput, ListMessagesQuery } from './conversations.schemas';

export class ConversationsService {
  constructor(private readonly repo: ConversationsRepository) {}

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const user = await this.repo.findOrCreateUser(input.externalUserId);
    return this.repo.createConversation(user.id, input.title);
  }

  async addMessage(conversationId: string, input: AddMessageInput): Promise<Message> {
    const conversation = await this.repo.getConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError(`Conversacion ${conversationId} no encontrada`);
    }
    return this.repo.addMessage(conversationId, input.role, input.content);
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.repo.getConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError(`Conversacion ${conversationId} no encontrada`);
    }
    return conversation;
  }

  async listMessages(
    conversationId: string,
    query: ListMessagesQuery,
  ): Promise<{
    items: Message[];
    meta: { total: number; page: number; pageSize: number; totalPages: number; hasMore: boolean };
  }> {
    // Verificamos que la conversacion existe (si no, 404 claro en lugar de lista vacia).
    await this.getConversation(conversationId);
    const { items, total } = await this.repo.listMessages(conversationId, query.page, query.pageSize);
    const totalPages = Math.ceil(total / query.pageSize);
    return {
      items,
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
        hasMore: query.page < totalPages,
      },
    };
  }
}
