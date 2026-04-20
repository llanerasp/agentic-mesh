import express, { type Express } from 'express';
import type { ConversationsService } from './conversations/conversations.service';
import { ConversationsController } from './conversations/conversations.controller';
import { createConversationsRouter } from './conversations/conversations.routes';
import { createHealthRouter } from './health/health.routes';
import { errorHandler } from './common/middleware/errorHandler';

export const createApp = (service: ConversationsService): Express => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(createHealthRouter());

  const controller = new ConversationsController(service);
  app.use(createConversationsRouter(controller));

  app.use(errorHandler);
  return app;
};
