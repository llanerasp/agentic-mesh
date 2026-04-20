import { Router } from 'express';
import { PUBLIC_ROUTES } from '@llm-agent/shared';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { validate } from '../common/middleware/validate';
import { chatSchema } from './chat.schemas';
import type { ChatController } from './chat.controller';

export const createChatRouter = (controller: ChatController): Router => {
  const router = Router();
  router.post(PUBLIC_ROUTES.chat, validate(chatSchema), asyncHandler(controller.chat));
  return router;
};
