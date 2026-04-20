import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LLM_WORKER_PORT: z.coerce.number().int().positive().default(3002),

    LLM_PROVIDER: z.enum(['mock', 'anthropic', 'bedrock']).default('mock'),

    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5'),
    ANTHROPIC_MAX_TOKENS: z.coerce.number().int().positive().default(512),

    SYSTEM_PROMPT: z.string().default('Eres un asistente util, conciso y en espanol.'),
  })
  .superRefine((data, ctx) => {
    // Cuando el provider es 'anthropic', la key debe existir.
    if (data.LLM_PROVIDER === 'anthropic' && !data.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ANTHROPIC_API_KEY es obligatoria cuando LLM_PROVIDER=anthropic',
        path: ['ANTHROPIC_API_KEY'],
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    // Fallo temprano. Que el proceso muera con un mensaje claro.
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuracion de entorno invalida:\n${issues}`);
  }
  return result.data;
};

// Singleton lazy-cargado. No se evalua hasta que alguien importa `env`.
let cachedEnv: Env | undefined;
export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    if (!cachedEnv) {
      cachedEnv = loadEnv();
    }
    return cachedEnv[prop];
  },
});
