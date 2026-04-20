import type { ErrorCode } from '@llm-agent/shared';

/**
 * Jerarquia base de errores del dominio.
 * Los services lanzan subclases especificas. El errorHandler middleware
 * las traduce a status HTTP + ApiResponse<never> de forma unica.
 */
export abstract class AppError extends Error {
  public abstract readonly code: ErrorCode;
  public abstract readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    // Mantener la pila de llamadas correcta (Node/V8).
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly statusCode = 400;
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED' as const;
  readonly statusCode = 401;
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN' as const;
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND' as const;
  readonly statusCode = 404;
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT' as const;
  readonly statusCode = 409;
}

export class LLMError extends AppError {
  readonly code = 'LLM_ERROR' as const;
  readonly statusCode = 502;
}

export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE' as const;
  readonly statusCode = 503;
}

// Type guard para discriminar AppError de errores genericos de Node.
export const isAppError = (e: unknown): e is AppError => {
  return e instanceof AppError;
};
