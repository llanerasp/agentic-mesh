import { Router } from 'express';
import { INTERNAL_ROUTES, ok } from '@llm-agent/shared';
import { asyncHandler } from '../common/middleware/asyncHandler';
import type { LLMService } from '../llm/llm.service';

/**
 * Health endpoints — distintos liveness y readiness.
 * - /health       : el proceso vive (responde rapido siempre).
 * - /health/ready : el proceso puede servir trafico (provider listo).
 * Kubernetes usa liveness para reiniciar pods y readiness para enrutar.
 */
export const createHealthRouter = (service: LLMService): Router => {
  const router = Router();

  router.get(INTERNAL_ROUTES.health.liveness, (_req, res) => {
    res.status(200).json(ok({ status: 'alive', uptime: process.uptime() }));
  });

  router.get(
    INTERNAL_ROUTES.health.readiness,
    asyncHandler(async (_req, res) => {
      const ready = await service.isProviderReady();
      const body = ok({
        status: ready ? 'ready' : 'not_ready',
        provider: service.getProviderName(),
      });
      res.status(ready ? 200 : 503).json(body);
    }),
  );

  return router;
};
