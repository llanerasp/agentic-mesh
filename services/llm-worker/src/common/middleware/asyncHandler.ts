import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper que captura promesas rechazadas en controllers async.
 * Evita tener que repetir try/catch en cada controller.
 *
 * Uso: router.post('/x', asyncHandler(async (req, res) => {...}))
 */
export const asyncHandler =
  <Req extends Request = Request, Res extends Response = Response>(
    fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
