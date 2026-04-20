import { z } from 'zod';

export const chatSchema = z.object({
  userId: z.string().min(1).max(128),
  message: z.string().min(1).max(10_000),
  // Si no se pasa, el gateway crea una conversacion nueva y devuelve su id.
  conversationId: z.string().cuid().optional(),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});
export type ChatInput = z.infer<typeof chatSchema>;
