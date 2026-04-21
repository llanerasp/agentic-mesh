/**
 * Inicializacion de OpenTelemetry.
 * DEBE importarse ANTES que cualquier otro modulo en server.ts, porque la
 * auto-instrumentacion parchea express, http, axios, etc. en el momento de
 * carga. Si algun modulo se importa antes, se pierde su instrumentacion.
 *
 * Configuracion via env vars (convencion OTel):
 *   OTEL_SERVICE_NAME             - nombre que aparece en Jaeger.
 *   OTEL_EXPORTER_OTLP_ENDPOINT   - base URL del collector (ej. http://jaeger:4318).
 *   OTEL_RESOURCE_ATTRIBUTES      - atributos extra (ej. environment=prod).
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Reducimos ruido de instrumentaciones que no aportan valor aqui.
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});

sdk.start();

// Flush + shutdown del SDK al cerrar el proceso (para no perder spans pendientes).
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.info('[otel] tracer cerrado'))
    .catch((err) => console.error('[otel] error al cerrar tracer', err));
});
