import type { ErrorCode } from '@llm-agent/shared';

export abstract class AppError extends Error {
  public abstract readonly code: ErrorCode;
  public abstract readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly statusCode = 400;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND' as const;
  readonly statusCode = 404;
}

export class UpstreamError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE' as const;
  readonly statusCode = 502;
}

export class LLMError extends AppError {
  readonly code = 'LLM_ERROR' as const;
  readonly statusCode = 502;
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
