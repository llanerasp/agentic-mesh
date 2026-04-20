import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'content no puede estar vacio'),
});

export const generateSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'messages no puede estar vacio'),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

export type GenerateInput = z.infer<typeof generateSchema>;
