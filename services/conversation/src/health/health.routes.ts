import { Router } from 'express';
import { INTERNAL_ROUTES, ok } from '@llm-agent/shared';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { prisma } from '../common/db';

export const createHealthRouter = (): Router => {
  const router = Router();

  router.get(INTERNAL_ROUTES.health.liveness, (_req, res) => {
    res.status(200).json(ok({ status: 'alive', uptime: process.uptime() }));
  });

  router.get(
    INTERNAL_ROUTES.health.readiness,
    asyncHandler(async (_req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json(ok({ status: 'ready', db: 'up' }));
      } catch {
        res.status(503).json(ok({ status: 'not_ready', db: 'down' }));
      }
    }),
  );

  return router;
};
