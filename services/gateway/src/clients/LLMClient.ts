import axios, { type AxiosInstance, AxiosError } from 'axios';
import { INTERNAL_ROUTES, type ApiResponse, type ChatMessage } from '@llm-agent/shared';
import { LLMError } from '../common/errors/AppError';

export interface GenerateResultDTO {
  content: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export class LLMClient {
  private readonly http: AxiosInstance;

  constructor(baseURL: string, timeout: number) {
    this.http = axios.create({ baseURL, timeout });
  }

  async generate(
    messages: ChatMessage[],
    options: { model?: string; maxTokens?: number } = {},
  ): Promise<GenerateResultDTO> {
    try {
      const res = await this.http.post<ApiResponse<GenerateResultDTO>>(INTERNAL_ROUTES.llm.generate, {
        messages,
        ...(options.model !== undefined && { model: options.model }),
        ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
      });
      if (!res.data.success) {
        throw new LLMError(res.data.error.message);
      }
      return res.data.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        const upstreamMsg =
          (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ?? err.message;
        throw new LLMError(`[llm-worker] ${upstreamMsg}`);
      }
      if (err instanceof Error) {
        throw new LLMError(`[llm-worker] ${err.message}`);
      }
      throw new LLMError('[llm-worker] error desconocido');
    }
  }
}
