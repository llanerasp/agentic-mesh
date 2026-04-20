/**
 * Rutas HTTP internas entre microservicios. Cambio aqui = cambio coordinado en los 3 servicios.
 * Centralizarlas en shared evita strings hardcoded repetidos.
 */

export const INTERNAL_ROUTES = {
  conversation: {
    createConversation: '/conversations',
    addMessage: (conversationId: string): string => `/conversations/${conversationId}/messages`,
    getConversation: (conversationId: string): string => `/conversations/${conversationId}`,
    listMessages: (conversationId: string): string => `/conversations/${conversationId}/messages`,
  },
  llm: {
    generate: '/generate',
  },
  health: {
    liveness: '/health',
    readiness: '/health/ready',
  },
} as const;

export const PUBLIC_ROUTES = {
  chat: '/chat',
} as const;

// Headers de correlacion entre servicios (se usara en Fase 3 con OpenTelemetry).
export const CORRELATION_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
