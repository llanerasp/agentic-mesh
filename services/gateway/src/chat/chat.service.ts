import type { ChatMessage } from '@llm-agent/shared';
import type { ConversationClient, MessageDTO } from '../clients/ConversationClient';
import type { LLMClient } from '../clients/LLMClient';
import type { ChatInput } from './chat.schemas';

export interface ChatResult {
  conversationId: string;
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

/**
 * Flujo orquestado del gateway:
 *   1. Si no hay conversationId -> crear conversacion nueva.
 *   2. Cargar historial (para contexto del LLM).
 *   3. Guardar mensaje del usuario.
 *   4. Pedir al LLM la respuesta pasandole el historial.
 *   5. Guardar la respuesta del asistente.
 *   6. Devolver el conjunto al cliente.
 */
export class ChatService {
  constructor(
    private readonly conversationClient: ConversationClient,
    private readonly llmClient: LLMClient,
  ) {}

  async chat(input: ChatInput): Promise<ChatResult> {
    // 1. Obtener o crear conversacion.
    const conversationId = input.conversationId
      ? (await this.conversationClient.getConversation(input.conversationId)).id
      : (await this.conversationClient.createConversation(input.userId, input.message.slice(0, 80))).id;

    // 2. Historial actual (si hay).
    const history = input.conversationId ? await this.conversationClient.listMessages(conversationId) : [];

    // 3. Persistir mensaje del usuario.
    const userMessage = await this.conversationClient.addMessage(conversationId, 'user', input.message);

    // 4. Construir payload para el LLM con el historial + el nuevo mensaje.
    const llmMessages: ChatMessage[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: input.message },
    ];

    const llmResult = await this.llmClient.generate(llmMessages, {
      ...(input.model !== undefined && { model: input.model }),
      ...(input.maxTokens !== undefined && { maxTokens: input.maxTokens }),
    });

    // 5. Persistir respuesta del asistente.
    const assistantMessage = await this.conversationClient.addMessage(conversationId, 'assistant', llmResult.content);

    return {
      conversationId,
      userMessage,
      assistantMessage,
      model: llmResult.model,
      ...(llmResult.usage && { usage: llmResult.usage }),
    };
  }
}
