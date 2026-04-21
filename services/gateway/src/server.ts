// OTel PRIMERO — auto-instrumenta http, axios, express antes de cargarlos.
import './tracing';
import { loadEnv } from './config/env';
import { logger } from './common/logger';
import { ConversationClient } from './clients/ConversationClient';
import { LLMClient } from './clients/LLMClient';
import { ChatService } from './chat/chat.service';
import { createApp } from './app';

const main = (): void => {
  const env = loadEnv();
  const conversationClient = new ConversationClient(env.CONVERSATION_SERVICE_URL, env.HTTP_TIMEOUT_MS);
  const llmClient = new LLMClient(env.LLM_WORKER_URL, env.LLM_HTTP_TIMEOUT_MS);
  const service = new ChatService(conversationClient, llmClient);
  const app = createApp(service);

  const server = app.listen(env.GATEWAY_PORT, () => {
    logger.info(
      {
        port: env.GATEWAY_PORT,
        conversation: env.CONVERSATION_SERVICE_URL,
        llm: env.LLM_WORKER_URL,
      },
      'gateway escuchando',
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Apagando gateway');
    server.close(() => {
      logger.info('Servidor cerrado. Bye.');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Forzando cierre tras 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main();
