import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  CONVERSATION_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().default('postgresql://llm_agent:llm_agent@localhost:5433/llm_agent?schema=public'),
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
