# TODO — Agente Conversacional Distribuido

Checklist detallada por fase. Marcar elementos a medida que avanzamos. Al final de cada fase, hacer auto-review y actualizar `lessons.md` si surge algo digno.

---

## Fase 0 — Setup, decisiones y tooling (0.5 días)

### Decisiones de proyecto

- [ ] Obtener API key de Anthropic (ver `setup-claude-api.md`) y añadir $5 de crédito inicial.
- [ ] Decidir sobre AWS: crear cuenta free tier (Bedrock requiere cuenta) vs dejar manifests EKS sin desplegar.
- [x] Nombre del proyecto: `llm-agent-mesh`.

### Herramientas a instalar (Windows)

- [ ] Docker Desktop (con Kubernetes habilitado o instalar minikube aparte).
- [ ] `kubectl` (CLI de Kubernetes).
- [ ] `minikube` (cluster local).
- [ ] `helm` (para instalar Jaeger, Linkerd, Istio).
- [ ] `linkerd` CLI.
- [ ] `istioctl` CLI.
- [ ] Verificar que todas las versiones son compatibles con Windows.

### Estructura del monorepo

- [ ] `package.json` raíz con workspaces: `services/*`, `packages/*`.
- [ ] `tsconfig.base.json` con strict: true, target ES2022, NodeNext, paths `@/*`.
- [ ] `.prettierrc` y `.prettierignore`.
- [ ] `eslint.config.mjs` flat config con `@typescript-eslint/no-explicit-any: 'error'`.
- [ ] `.gitignore` (node_modules, dist, .env, coverage).
- [ ] `.env.example` con todas las vars.
- [ ] `README.md` inicial con diagrama.
- [ ] Husky + lint-staged configurado.

### Git y CI

- [ ] `git init` + primer commit con el scaffold.
- [ ] Repo en GitHub (privado mientras se desarrolla).
- [ ] `.github/workflows/ci.yml` con typecheck + test + lint.

---

## Fase 1 — Los 3 microservicios básicos (1 día)

### `packages/shared`

- [ ] Tipos compartidos: `ApiResponse<T>`, `ApiError`, `ChatMessage`, `ConversationId`.
- [ ] Constantes: rutas internas, nombres de colas, códigos de error.
- [ ] Exportado como `@llm-agent/shared`.

### `services/gateway` — entrada HTTP pública

- [ ] Scaffold Express + TS.
- [ ] Clean Architecture: `routes/`, `controllers/`, `services/`, `common/middleware/`.
- [ ] `POST /chat` — recibe `{ userId, message, conversationId? }`.
- [ ] Middleware: `helmet`, `cors`, `pino-http`, `rateLimit`.
- [ ] Zod validation en body.
- [ ] Llamada interna a `conversation-service` (guarda mensaje) y `llm-worker` (genera respuesta).
- [ ] Error handler global con `AppError` tipado.
- [ ] Tests: supertest sobre `/chat` con servicios mockeados.

### `services/conversation` — persistencia de conversaciones

- [ ] Scaffold Express + Prisma + Postgres.
- [ ] Schema Prisma: `User`, `Conversation`, `Message` (role: user|assistant).
- [ ] Migración inicial con nombre descriptivo.
- [ ] Endpoints internos: `POST /conversations`, `POST /conversations/:id/messages`, `GET /conversations/:id`.
- [ ] Service + repository separados.
- [ ] Tests: service con repo mockeado + integration con supertest.

### `services/llm-worker` — llamada al LLM

- [ ] Scaffold Express + TS.
- [ ] Definir interfaz `LLMProvider` con método `generate(messages): Promise<string>` (Strategy Pattern + DIP).
- [ ] **`MockProvider` primero**: respuestas hardcoded/echo para desarrollo sin API key. Provider por defecto.
- [ ] `AnthropicProvider`: SDK oficial de Anthropic con Claude Haiku 4.5 por defecto (se activa cuando haya key).
- [ ] `BedrockProvider`: stub, se completa en Fase 7.
- [ ] Factory que elige provider por env var `LLM_PROVIDER=mock|anthropic|bedrock`.
- [ ] Endpoint interno: `POST /generate` con `{ messages: ChatMessage[], model?: string }`.
- [ ] Prompt system configurable por env.
- [ ] Tests: `MockProvider` probado directamente; `AnthropicProvider` con HTTP mockeado (no se llama a la API real en tests).

### Orquestación local (pre-k8s)

- [ ] `docker-compose.yml` con: postgres, gateway, conversation, llm-worker.
- [ ] `.env` con `ANTHROPIC_API_KEY` y URLs internas.
- [ ] `npm run dev` en raíz arranca los 3 servicios con concurrently.
- [ ] Probar flujo end-to-end con curl/Postman.

---

## Fase 2 — Kubernetes local (minikube) (0.5 días)

### Contenedores

- [ ] Dockerfile multi-stage para cada servicio (build → production).
- [ ] `docker build` para los 3 servicios con tags consistentes (`llm-agent/gateway:0.1.0`, etc.).
- [ ] Cargar imágenes en minikube (`minikube image load`).

### Manifests

- [ ] `k8s/namespace.yaml` — namespace `llm-agent`.
- [ ] `k8s/postgres/` — StatefulSet + Service + PersistentVolumeClaim.
- [ ] `k8s/gateway/` — Deployment + Service + ConfigMap.
- [ ] `k8s/conversation/` — Deployment + Service + ConfigMap.
- [ ] `k8s/llm-worker/` — Deployment + Service + Secret (para API key).
- [ ] `k8s/ingress.yaml` — expone gateway en un host local (`llm-agent.local`).

### Deploy y verificación

- [ ] `minikube start --driver=docker`.
- [ ] `kubectl apply -f k8s/`.
- [ ] `kubectl get pods -n llm-agent` — todos Running.
- [ ] `minikube tunnel` + hosts file → probar `POST llm-agent.local/chat`.
- [ ] Script `scripts/deploy-local.sh` que hace build + load + apply.

---

## Fase 3 — Observabilidad (tracing + logs estructurados) (1 día)

### OpenTelemetry

- [ ] Instalar `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, exporter OTLP.
- [ ] Fichero `tracing.ts` en cada servicio, importado ANTES que nada.
- [ ] Nombres de servicio: `gateway`, `conversation`, `llm-worker`.
- [ ] Propagación de trace context en llamadas HTTP internas (automático con auto-instrumentations).
- [ ] Spans manuales en operaciones clave (`llm.generate`, `db.saveMessage`).

### Jaeger

- [ ] Desplegar Jaeger all-in-one en k8s (`jaeger-operator` o manifest simple).
- [ ] Exponer UI por port-forward o ingress en `jaeger.local`.
- [ ] Configurar OTLP endpoint en cada servicio apuntando al collector.
- [ ] Verificar trace end-to-end: `POST /chat` → gateway → conversation → llm-worker → Claude API.

### Logs estructurados

- [ ] `pino` en cada servicio, JSON por defecto.
- [ ] `pino-http` para request logging.
- [ ] Correlation ID generado en gateway y propagado por headers.
- [ ] `pino.redact` para campos sensibles (`authorization`, `*.apiKey`, `*.password`).
- [ ] Log level configurable por env (`LOG_LEVEL`).

### Healthchecks

- [ ] `GET /health` (liveness) — responde `{ status: 'ok' }` siempre que el proceso vive.
- [ ] `GET /health/ready` (readiness) — chequea DB (en conversation) y Anthropic (en llm-worker).
- [ ] Configurar `livenessProbe` y `readinessProbe` en los Deployments.

---

## Fase 4 — Resiliencia (circuit breakers + retries + timeouts) (0.5 días)

### opossum circuit breakers

- [ ] Breaker en `gateway` → `conversation-service`.
- [ ] Breaker en `gateway` → `llm-worker`.
- [ ] Breaker en `llm-worker` → Claude API (el más crítico: rate limits, timeouts, caídas).
- [ ] Parámetros: `timeout`, `errorThresholdPercentage`, `resetTimeout`.
- [ ] Fallback function para cada breaker (respuesta degradada).
- [ ] Eventos emitidos a logs: `open`, `halfOpen`, `close`, `fallback`.

### Retries con backoff

- [ ] Retries exponenciales en llamadas al LLM (errores transitorios 429, 503).
- [ ] NO reintentar en errores 4xx de input.

### Timeouts

- [ ] Timeout HTTP global en cada cliente interno (3-5s).
- [ ] Timeout específico largo para LLM (30s).

### Tests

- [ ] Test de circuit breaker: simular fallos repetidos y verificar que abre.
- [ ] Test de fallback.

---

## Fase 5 — Linkerd service mesh (1 día)

### Instalación

- [ ] `linkerd install --crds | kubectl apply -f -`.
- [ ] `linkerd install | kubectl apply -f -`.
- [ ] `linkerd check` — todo verde.
- [ ] Instalar extensión viz: `linkerd viz install | kubectl apply -f -`.

### Inyección en el namespace

- [ ] Anotar namespace `llm-agent` con `linkerd.io/inject: enabled`.
- [ ] Reiniciar deployments para inyectar el sidecar.
- [ ] Verificar con `linkerd -n llm-agent check --proxy`.

### Funcionalidades

- [ ] Verificar mTLS automático: `linkerd -n llm-agent viz edges deploy`.
- [ ] Configurar `ServiceProfile` con retries y timeouts declarativos.
- [ ] Traffic splitting: dos versiones de `llm-worker` (v1 Haiku, v2 Sonnet) con `TrafficSplit`.
- [ ] Abrir `linkerd viz dashboard` y observar métricas en tiempo real.

### Entender qué aporta

- [ ] Anotar en `lessons.md`: qué cambia con el mesh, qué código eliminaría si confiara 100% en el mesh para retries/timeouts, por qué sigo queriendo breakers en código (fallbacks específicos al dominio).

---

## Fase 6 — Istio lab en namespace separado (1 día)

### Instalación aislada

- [ ] Crear namespace `istio-lab`.
- [ ] `istioctl install --set profile=demo -y`.
- [ ] Etiquetar namespace: `kubectl label namespace istio-lab istio-injection=enabled`.

### Demo Bookinfo

- [ ] Desplegar Bookinfo oficial en `istio-lab`.
- [ ] Gateway + VirtualService para exponer `productpage`.
- [ ] Verificar que funciona.

### Experimentos mínimos pero representativos

- [ ] `VirtualService` con traffic splitting 80/20 entre `reviews-v1` y `reviews-v3`.
- [ ] `DestinationRule` con `loadBalancer` y `outlierDetection`.
- [ ] Fault injection: `abort` 50% en `ratings` y observar el comportamiento.
- [ ] Mirroring de tráfico a una versión sombra.

### Comparación documentada

- [ ] Escribir en `lessons.md` una tabla Linkerd vs Istio: simplicidad, features, overhead, cuándo elegir cada uno.

---

## Fase 7 — AWS touch (0.5 días)

Dos caminos según disponibilidad de cuenta AWS:

### Camino A — Con cuenta AWS (si conseguimos free tier)

- [ ] Habilitar Bedrock en la región (p. ej. `us-east-1`), request access a modelos Anthropic.
- [ ] Implementar `BedrockProvider` en `llm-worker` (AWS SDK v3).
- [ ] Variable de entorno `LLM_PROVIDER=anthropic|bedrock` para alternar.
- [ ] Test local del provider Bedrock.
- [ ] Documentar diferencias entre los dos caminos (API directa vs Bedrock).

### Camino B — Sin cuenta AWS (manifests preparados)

- [ ] Crear `k8s/eks/` con manifests listos para EKS (diferencias con minikube documentadas).
- [ ] README con los pasos de `eksctl create cluster`, IAM roles para Bedrock, IRSA.
- [ ] Diagrama de cómo quedaría desplegado en AWS.

---

## Fase 8 — Cierre (README, diagramas, demo) (0.5 días)

- [ ] `README.md` con: diagrama de arquitectura (ASCII o mermaid), instrucciones de arranque local, de despliegue en minikube, de activar Linkerd, de correr el lab de Istio.
- [ ] Sección "¿Qué he aprendido?" en el README con un párrafo por cada tecnología tocada.
- [ ] GIF o vídeo corto (opcional) mostrando: llamada a `/chat` → trace completo en Jaeger → dashboard de Linkerd → Bookinfo con traffic split.
- [ ] Revisar coste total gastado en Claude API (debe ser <$5).
- [ ] Commit final y push al repo público (pasar de privado a público cuando esté presentable).

---

## Workflow obligatorio (recordatorio de CLAUDE.md)

Para cada fase:

1. **Implementar** los puntos.
2. **Auto-review**: releer el diff completo como si fuera otro dev.
3. **Verificar**: `tsc --noEmit` + tests + lint limpio.
4. **Tests obligatorios**: todo código nuevo lleva tests en el mismo commit. Sin tests = fase no cerrada.
5. **Actualizar `lessons.md`** si hay corrección o aprendizaje no obvio.
6. **Commit convencional** por tarea lógica (no big-bang).
