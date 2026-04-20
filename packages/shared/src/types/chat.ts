/**
 * Tipos del dominio conversacional. Los comparten los 3 microservicios
 * (gateway, conversation, llm-worker) para que el contrato sea unico.
 */

export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
}

// Branded types (nominal typing): previenen pasar un `UserId` donde se espera un `ConversationId`,
// aunque ambos sean string en runtime. Protege contra bugs tipicos con IDs.
export type UserId = string & { readonly __brand: 'UserId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };

// Helpers de construccion (casting controlado — unico lugar donde aceptamos el cast).
export const asUserId = (s: string): UserId => s as UserId;
export const asConversationId = (s: string): ConversationId => s as ConversationId;
export const asMessageId = (s: string): MessageId => s as MessageId;
