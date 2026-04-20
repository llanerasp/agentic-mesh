import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  GATEWAY_PORT: z.coerce.number().int().positive().default(3001),
  CONVERSATION_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  LLM_WORKER_URL: z.string().url().default('http://localhost:3003'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  LLM_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuracion de entorno invalida:\n${issues}`);
  }
  return result.data;
};

let cachedEnv: Env | undefined;
export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    if (!cachedEnv) {
      cachedEnv = loadEnv();
    }
    return cachedEnv[prop];
  },
});
