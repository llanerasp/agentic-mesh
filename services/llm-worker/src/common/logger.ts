import pino from 'pino';
import { env } from '../config/env';

/**
 * Logger estructurado JSON (pino).
 * - redact oculta campos sensibles en cualquier objeto logueado.
 * - transport pretty solo en dev; prod emite JSON limpio para agregadores.
 */
export const logger = pino({
  // En tests silenciamos logs para que la salida de jest sea limpia.
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  base: { service: 'llm-worker' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      '*.apiKey',
      '*.api_key',
      '*.password',
      '*.token',
      'ANTHROPIC_API_KEY',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }
    : {}),
});
