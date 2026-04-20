import type { PrismaClient, Role, Message, Conversation } from '@prisma/client';

/**
 * Repositorio: unica capa que conoce Prisma y queries SQL.
 * Services dependen de esta interface (via clase concreta), no de PrismaClient.
 */
export class ConversationsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findOrCreateUser(externalId: string): Promise<{ id: string }> {
    return this.db.user.upsert({
      where: { externalId },
      update: {},
      create: { externalId },
      select: { id: true },
    });
  }

  async createConversation(userId: string, title?: string): Promise<Conversation> {
    return this.db.conversation.create({
      data: { userId, title: title ?? null },
    });
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    return this.db.conversation.findUnique({ where: { id } });
  }

  async addMessage(conversationId: string, role: Role, content: string): Promise<Message> {
    // Transaccion: inserta el mensaje y bumpea updatedAt de la conversacion.
    return this.db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: { conversationId, role, content },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return msg;
    });
  }

  async listMessages(
    conversationId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Message[]; total: number }> {
    const [items, total] = await Promise.all([
      this.db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.message.count({ where: { conversationId } }),
    ]);
    return { items, total };
  }
}
