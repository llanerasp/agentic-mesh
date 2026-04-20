import axios, { type AxiosInstance, AxiosError } from 'axios';
import { INTERNAL_ROUTES, type ApiResponse } from '@llm-agent/shared';
import { UpstreamError, NotFoundError } from '../common/errors/AppError';

export interface ConversationDTO {
  id: string;
  userId: string;
  title: string | null;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Cliente HTTP hacia conversation-service. Encapsula axios y traduce errores
 * HTTP (404, 5xx) a AppError para que el gateway no exponga detalles de su
 * implementacion interna.
 */
export class ConversationClient {
  private readonly http: AxiosInstance;

  constructor(baseURL: string, timeout: number) {
    this.http = axios.create({ baseURL, timeout });
  }

  async createConversation(externalUserId: string, title?: string): Promise<ConversationDTO> {
    try {
      const res = await this.http.post<ApiResponse<ConversationDTO>>(INTERNAL_ROUTES.conversation.createConversation, {
        externalUserId,
        ...(title !== undefined && { title }),
      });
      if (!res.data.success) {
        throw new UpstreamError(res.data.error.message);
      }
      return res.data.data;
    } catch (err) {
      throw translateAxiosError(err, 'conversation');
    }
  }

  async getConversation(conversationId: string): Promise<ConversationDTO> {
    try {
      const res = await this.http.get<ApiResponse<ConversationDTO>>(
        INTERNAL_ROUTES.conversation.getConversation(conversationId),
      );
      if (!res.data.success) {
        throw new UpstreamError(res.data.error.message);
      }
      return res.data.data;
    } catch (err) {
      throw translateAxiosError(err, 'conversation');
    }
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<MessageDTO> {
    try {
      const res = await this.http.post<ApiResponse<MessageDTO>>(
        INTERNAL_ROUTES.conversation.addMessage(conversationId),
        { role, content },
      );
      if (!res.data.success) {
        throw new UpstreamError(res.data.error.message);
      }
      return res.data.data;
    } catch (err) {
      throw translateAxiosError(err, 'conversation');
    }
  }

  async listMessages(conversationId: string): Promise<MessageDTO[]> {
    try {
      const res = await this.http.get<ApiResponse<MessageDTO[]>>(
        INTERNAL_ROUTES.conversation.listMessages(conversationId),
      );
      if (!res.data.success) {
        throw new UpstreamError(res.data.error.message);
      }
      return res.data.data;
    } catch (err) {
      throw translateAxiosError(err, 'conversation');
    }
  }
}

/**
 * Traduce errores de axios a AppError tipado.
 * 404 del upstream -> NotFoundError aqui. El resto -> UpstreamError.
 */
const translateAxiosError = (err: unknown, upstream: string): Error => {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const upstreamMsg =
      (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ?? err.message;
    if (status === 404) {
      return new NotFoundError(`[${upstream}] ${upstreamMsg}`);
    }
    return new UpstreamError(`[${upstream}] ${upstreamMsg}`, { status });
  }
  if (err instanceof Error) {
    return new UpstreamError(`[${upstream}] ${err.message}`);
  }
  return new UpstreamError(`[${upstream}] error desconocido`);
};
