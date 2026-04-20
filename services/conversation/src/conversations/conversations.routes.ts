import { Router } from 'express';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { validate } from '../common/middleware/validate';
import {
  createConversationSchema,
  addMessageSchema,
  conversationIdParamsSchema,
  listMessagesQuerySchema,
} from './conversations.schemas';
import type { ConversationsController } from './conversations.controller';

export const createConversationsRouter = (controller: ConversationsController): Router => {
  const router = Router();

  router.post('/conversations', validate(createConversationSchema), asyncHandler(controller.create));

  router.get(
    '/conversations/:conversationId',
    validate(conversationIdParamsSchema, 'params'),
    asyncHandler(controller.getById),
  );

  router.post(
    '/conversations/:conversationId/messages',
    validate(conversationIdParamsSchema, 'params'),
    validate(addMessageSchema),
    asyncHandler(controller.addMessage),
  );

  router.get(
    '/conversations/:conversationId/messages',
    validate(conversationIdParamsSchema, 'params'),
    validate(listMessagesQuerySchema, 'query'),
    asyncHandler(controller.listMessages),
  );

  return router;
};
