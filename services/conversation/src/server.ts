// OTel PRIMERO — auto-instrumenta http, express, prisma antes de cargarlos.
import './tracing';
import { loadEnv } from './config/env';
import { logger } from './common/logger';
import { prisma, disconnectDb } from './common/db';
import { ConversationsRepository } from './conversations/conversations.repository';
import { ConversationsService } from './conversations/conversations.service';
import { createApp } from './app';

const main = async (): Promise<void> => {
  const env = loadEnv();
  const repo = new ConversationsRepository(prisma);
  const service = new ConversationsService(repo);
  const app = createApp(service);

  const server = app.listen(env.CONVERSATION_PORT, () => {
    logger.info({ port: env.CONVERSATION_PORT }, 'conversation service escuchando');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Apagando conversation service');
    server.close(async () => {
      await disconnectDb();
      logger.info('Servidor cerrado y DB desconectada. Bye.');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Forzando cierre tras 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
};

main().catch((err) => {
  logger.error({ err }, 'Error fatal al arrancar');
  process.exit(1);
});
