import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Middleware generico de validacion con Zod.
 * Valida `body` (default), `params` o `query`, y REEMPLAZA la fuente
 * con los datos parseados (tipados e incluyendo coerciones / defaults).
 */
export const validate =
  (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ValidationError(`Input invalido (${source})`, {
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        }),
      );
    }
    // Reemplaza el source original con los datos parseados.
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
