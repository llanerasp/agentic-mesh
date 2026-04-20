import { z } from 'zod';

export const createConversationSchema = z.object({
  externalUserId: z.string().min(1).max(128),
  title: z.string().max(200).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});
export type AddMessageInput = z.infer<typeof addMessageSchema>;

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().cuid(),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
