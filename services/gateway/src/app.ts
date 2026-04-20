import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { ChatService } from './chat/chat.service';
import { ChatController } from './chat/chat.controller';
import { createChatRouter } from './chat/chat.routes';
import { createHealthRouter } from './health/health.routes';
import { errorHandler } from './common/middleware/errorHandler';
import { env } from './config/env';

/**
 * Express app con los middleware de seguridad OWASP (helmet, cors, rate-limit).
 * Separada de server.ts para que supertest pueda instanciarla sin abrir puerto.
 */
export const createApp = (service: ChatService): Express => {
  const app = express();

  // Security headers.
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));

  app.use(express.json({ limit: '100kb' }));

  // Health SIN rate limit (k8s lo llama constantemente).
  app.use(createHealthRouter());

  // Rate limit solo en la API publica.
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use('/chat', limiter);

  const controller = new ChatController(service);
  app.use(createChatRouter(controller));

  app.use(errorHandler);
  return app;
};
