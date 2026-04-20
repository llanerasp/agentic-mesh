import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { fail, type ApiResponse } from '@llm-agent/shared';
import { isAppError } from '../errors/AppError';
import { logger } from '../logger';

/**
 * Handler global de errores. DEBE ir al final del pipeline de middleware
 * y tener 4 argumentos (aunque `next` no se use) para que Express lo reconozca.
 * Traduce AppError -> respuesta tipada ApiResponse<never>.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (isAppError(err)) {
    logger.warn({ err, path: req.path, method: req.method }, 'AppError capturado');
    const body: ApiResponse<never> = fail(err.code, err.message, err.details);
    res.status(err.statusCode).json(body);
    return;
  }

  // Error no controlado: log completo + respuesta generica.
  logger.error({ err, path: req.path, method: req.method }, 'Error no controlado');

  const isProd = process.env['NODE_ENV'] === 'production';
  const message = isProd ? 'Error interno del servidor' : err instanceof Error ? err.message : String(err);
  const body: ApiResponse<never> = fail('INTERNAL_ERROR', message);
  res.status(500).json(body);
};
