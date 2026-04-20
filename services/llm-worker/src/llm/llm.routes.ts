import { Router } from 'express';
import { INTERNAL_ROUTES } from '@llm-agent/shared';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { validate } from '../common/middleware/validate';
import { generateSchema } from './llm.schemas';
import type { LLMController } from './llm.controller';

/**
 * Mapping de routes al controller. Cero logica aqui.
 */
export const createLLMRouter = (controller: LLMController): Router => {
  const router = Router();

  router.post(INTERNAL_ROUTES.llm.generate, validate(generateSchema), asyncHandler(controller.generate));

  return router;
};
