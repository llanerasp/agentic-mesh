# Setup de Claude API — Guía paso a paso

## Claude Pro/Max ≠ Claude API

Son productos distintos con facturación separada:

| Producto | Para qué sirve | Cómo se paga |
| --- | --- | --- |
| **Claude Pro / Max** | Usar claude.ai en el navegador y Claude Code con suscripción | Suscripción mensual fija |
| **Claude API** | Llamar a Claude desde tu código (SDK, HTTP) | Pay-per-token, con créditos prepago |

La suscripción Pro/Max **no te da acceso a la API**. Necesitas crear una cuenta en `console.anthropic.com` y añadir créditos aparte. Es una cuenta distinta (aunque puedes usar el mismo email).

## Pasos para obtener la API key

1. Entra en https://console.anthropic.com y regístrate o inicia sesión.
2. Ve a **Settings → Billing** y añade un método de pago.
3. Compra el mínimo de créditos: **$5 es más que suficiente para todo el proyecto**.
4. Ve a **Settings → API Keys** → **Create Key**. Dale un nombre descriptivo (p. ej. `conversa-mesh-dev`).
5. **Copia la key al momento** — solo se muestra una vez. Empieza por `sk-ant-api03-...`.
6. Guárdala en el `.env` local como `ANTHROPIC_API_KEY=sk-ant-...` y **verifica que `.env` está en `.gitignore`**.

## Estimación de coste real del proyecto

Pricing de Anthropic (modelos principales, tarifas públicas):

| Modelo | Input ($/M tokens) | Output ($/M tokens) |
| --- | --- | --- |
| Claude Haiku 4.5 | ~$1 | ~$5 |
| Claude Sonnet 4.6 | ~$3 | ~$15 |
| Claude Opus 4.7 | ~$15 | ~$75 |

**Cálculo para este proyecto** (conversación media: ~500 input + ~500 output = 1K tokens por request):

- Desarrollo/tests: ~500 requests durante todo el proyecto = 500K tokens ≈ **$1.50 con Haiku**.
- Demo final con Sonnet: 50 requests ≈ $0.75.
- **Total estimado: $2-3**. Los $5 de crédito sobran y queda saldo para futuras pruebas.

## Estrategia para no gastar mucho

1. **Modelo por defecto: Haiku 4.5**. Es más que capaz para un agente conversacional básico y cuesta 3-15× menos que los otros.
2. **Max tokens de salida limitado**: configurar `max_tokens: 512` en los tests. No necesitamos respuestas largas para validar.
3. **Mockear el LLM en tests unitarios**. Solo hacer llamadas reales en tests de integración (y pocos).
4. **Cachear respuestas en desarrollo**: si el mismo prompt ya se probó, devolver respuesta cacheada local (evitar llamadas repetidas mientras se depura).
5. **Prompt system corto**: cada token del system prompt cuenta en cada llamada. Menos tokens = menos coste.
6. **Monitorizar el dashboard de usage** en console.anthropic.com semanalmente.

## Dónde guardar la API key

- **Dev local**: `.env` del monorepo (en `.gitignore`).
- **Docker Compose**: inyectada por `env_file: .env`.
- **Kubernetes**: `Secret` de k8s montado como variable de entorno.
- **NUNCA**: commiteada, ni en logs, ni en el frontend (aunque aquí no hay frontend público, ojo en el futuro).

## Qué hacer si la API key se filtra

1. Revocar inmediatamente en **Settings → API Keys → Revoke**.
2. Crear una nueva.
3. Rotar en todos los entornos (dev, staging, k8s secrets).
4. Revisar en **Settings → Usage** si hay consumo anómalo.

## Verificación de que funciona

Prueba rápida con curl (reemplaza `$ANTHROPIC_API_KEY` por tu key):

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-haiku-4-5",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hola, ¿funcionas?"}]
  }'
```

Si devuelve un JSON con `content`, todo listo. Coste de esta llamada: <$0.001.
