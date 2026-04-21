// OTel PRIMERO — auto-instrumenta http, express antes de cargarlos.
import './tracing';
import { loadEnv } from './config/env';
import { logger } from './common/logger';
import { createLLMProvider } from './providers/factory';
import { LLMService } from './llm/llm.service';
import { createApp } from './app';

/**
 * Entry point. Unica responsabilidad: orquestar el arranque.
 * - Valida env.
 * - Construye provider (por env var).
 * - Monta la app.
 * - Escucha y gestiona shutdown elegante.
 */
const main = (): void => {
  const env = loadEnv();
  const provider = createLLMProvider(env);
  const service = new LLMService(provider);
  const app = createApp(service);

  const server = app.listen(env.LLM_WORKER_PORT, () => {
    logger.info(
      { port: env.LLM_WORKER_PORT, provider: provider.name },
      `llm-worker escuchando con provider="${provider.name}"`,
    );
  });

  // Shutdown graceful para k8s: SIGTERM -> dejar de aceptar, terminar requests en vuelo.
  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Apagando llm-worker');
    server.close(() => {
      logger.info('Servidor cerrado. Bye.');
      process.exit(0);
    });
    // Timeout de seguridad: si algo se cuelga, kill duro a los 10s.
    setTimeout(() => {
      logger.warn('Forzando cierre tras 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main();
