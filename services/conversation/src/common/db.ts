import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { env } from '../config/env';

/**
 * Prisma singleton. Una instancia por proceso. Se expone tambien el tipo
 * TransactionClient por si el service necesita envolver operaciones en $transaction.
 */
export const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [{ emit: 'event', level: 'error' }],
});

if (env.NODE_ENV === 'development') {
  (prisma as unknown as { $on: (event: string, cb: (e: { query?: string; duration?: number }) => void) => void }).$on(
    'query',
    (e) => {
      logger.debug({ query: e.query, durationMs: e.duration }, 'prisma query');
    },
  );
}

export const disconnectDb = async (): Promise<void> => {
  await prisma.$disconnect();
};
