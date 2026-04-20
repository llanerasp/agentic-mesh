import { Router } from 'express';
import { INTERNAL_ROUTES, ok } from '@llm-agent/shared';

export const createHealthRouter = (): Router => {
  const router = Router();

  router.get(INTERNAL_ROUTES.health.liveness, (_req, res) => {
    res.status(200).json(ok({ status: 'alive', uptime: process.uptime() }));
  });

  // Readiness del gateway: para la Fase 1 basta con alive.
  // En Fase 3 pingeara upstreams (conversation, llm-worker).
  router.get(INTERNAL_ROUTES.health.readiness, (_req, res) => {
    res.status(200).json(ok({ status: 'ready' }));
  });

  return router;
};
