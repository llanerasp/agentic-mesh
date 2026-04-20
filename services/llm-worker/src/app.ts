import express, { type Express } from 'express';
import type { LLMService } from './llm/llm.service';
import { LLMController } from './llm/llm.controller';
import { createLLMRouter } from './llm/llm.routes';
import { createHealthRouter } from './health/health.routes';
import { errorHandler } from './common/middleware/errorHandler';

/**
 * Construye la Express app inyectando el LLMService. Se separa de server.ts
 * para que los tests de integracion puedan instanciarla sin escuchar en un puerto.
 */
export const createApp = (service: LLMService): Express => {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // Health primero (sin auth, sin body parsing caro).
  app.use(createHealthRouter(service));

  // Modulo LLM.
  const controller = new LLMController(service);
  app.use(createLLMRouter(controller));

  // Error handler SIEMPRE al final.
  app.use(errorHandler);

  return app;
};
