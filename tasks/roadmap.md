# Roadmap — LLM Agent Mesh

Proyecto de aprendizaje para una candidatura de **Node.js Software Engineer**. Objetivo: construir un mini-agente conversacional basado en LLM, arquitectura de microservicios, desplegado en Kubernetes, con observabilidad, resiliencia y service mesh. Toca las 4 áreas del stack que nunca he trabajado: **microservicios, Kubernetes, cloud (AWS), LLMs/Generative AI**.

## Visión del sistema

```
                    ┌──────────────┐
  Cliente HTTP ───► │   gateway    │  (auth stub, routing, rate limit)
                    └──────┬───────┘
                           │
                   ┌───────┴────────┐
                   ▼                ▼
           ┌──────────────┐  ┌──────────────┐
           │ conversation │  │  llm-worker  │──► Claude API (Anthropic)
           │ + Postgres   │  │              │    / AWS Bedrock (opcional)
           └──────────────┘  └──────────────┘

  Observabilidad: OpenTelemetry → Jaeger (traces), pino (logs), Prometheus (metrics)
  Resiliencia:    opossum circuit breakers, retries, timeouts, /health y /health/ready
  Mesh:           Linkerd inyectado en el namespace principal
  Lab:            Istio + Bookinfo en namespace/perfil separado
```

## Stack

| Área            | Tecnología                                                |
| --------------- | --------------------------------------------------------- |
| Runtime         | Node.js 20 + TypeScript strict                            |
| HTTP            | Express                                                   |
| DB              | PostgreSQL + Prisma                                       |
| Validación      | Zod                                                       |
| Logs            | pino                                                      |
| Tests           | Jest + supertest                                          |
| Monorepo        | npm workspaces                                            |
| Contenedores    | Docker multi-stage                                        |
| Orquestación    | Kubernetes (minikube)                                     |
| Tracing         | OpenTelemetry + Jaeger                                    |
| Circuit breaker | opossum                                                   |
| Service mesh    | Linkerd (principal) + Istio (lab)                         |
| LLM             | Claude API (Anthropic) — con abstracción para AWS Bedrock |
| CI/CD           | GitHub Actions + Husky + lint-staged                      |

## Fases

| Fase      | Título                                   | Estimación              |
| --------- | ---------------------------------------- | ----------------------- |
| 0         | Setup, decisiones y tooling              | 0.5 días                |
| 1         | Los 3 microservicios básicos             | 1 día                   |
| 2         | Kubernetes local (minikube)              | 0.5 días                |
| 3         | Observabilidad (tracing + logs)          | 1 día                   |
| 4         | Resiliencia (circuit breakers + health)  | 0.5 días                |
| 5         | Linkerd service mesh                     | 1 día                   |
| 6         | Istio lab (Bookinfo + traffic splitting) | 1 día                   |
| 7         | AWS touch (Bedrock o manifests EKS)      | 0.5 días                |
| 8         | Cierre (README, diagramas, demo)         | 0.5 días                |
| **Total** |                                          | **~6-7 días realistas** |

## Criterio de éxito

Al acabar, puedo contar en una entrevista técnica:

1. Qué es un microservicio, cuándo tiene sentido y qué problemas trae (vs monorepo).
2. Cómo funciona Kubernetes a nivel práctico: Deployment, Service, Ingress, ConfigMap, Secret.
3. Cómo se instrumenta un servicio con OpenTelemetry y qué aporta un trace distribuido.
4. Qué patrón resuelve un circuit breaker y cuándo es imprescindible.
5. Qué es un service mesh, qué aporta Linkerd, por qué elegirlo sobre Istio (o al revés).
6. Cómo se integra un LLM en una arquitectura de microservicios (latencia, streaming, errores, coste).
7. Qué es AWS Bedrock y cómo se despliega en EKS a nivel conceptual.

## Decisiones pendientes (a confirmar antes de empezar)

- [ ] **Claude API key**: obtener créditos en `console.anthropic.com` (ver `setup-claude-api.md`).
- [ ] **AWS**: ¿creamos cuenta free tier para Bedrock, o nos quedamos solo con Claude API directa y dejamos los manifests EKS preparados sin deploy real?
- [ ] **Modelo LLM por defecto**: Claude Haiku 4.5 para dev (muy barato) y Sonnet 4.6 solo en demo final.

## Estructura de archivos de tareas

- `roadmap.md` — este documento (visión alto nivel).
- `todo.md` — checklist detallada de cada fase.
- `lessons.md` — errores y aprendizajes durante la ejecución.
- `setup-claude-api.md` — guía paso a paso para obtener la API key y controlar coste.
