import type { ChatMessage } from '@llm-agent/shared';

/**
 * Contrato unico que todo provider debe cumplir.
 * El resto del codigo depende de esta interfaz, nunca de una implementacion concreta.
 * Strategy Pattern + Dependency Inversion.
 */
export interface LLMProvider {
  readonly name: string;
  generate(messages: ChatMessage[], options?: GenerateOptions): Promise<GenerateResult>;
  // Para readiness probes: responde rapido si el provider esta operativo.
  isReady(): Promise<boolean>;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
}

export interface GenerateResult {
  content: string;
  model: string;
  // Metadata opcional util para metrics y debug.
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
