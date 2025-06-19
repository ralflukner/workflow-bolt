const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const api = require('@opentelemetry/api');
const { CloudTraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');

// ---------------------------------------------------------------------------
// Custom ID generator – if a correlationId is present on global.otelCorrelationId,
// it will be used as the traceId, enabling 1-to-1 mapping between our existing
// correlation IDs and OpenTelemetry traces. Otherwise a random traceId is used.
// ---------------------------------------------------------------------------
class CorrelationIdGenerator {
  generateSpanId() {
    // 16 hex chars
    return (Math.random().toString(16).slice(2) + '0000000000000000').substring(0, 16);
  }
  generateTraceId() {
    const corr = global.otelCorrelationId;
    if (typeof corr === 'string' && corr.length >= 16) {
      // Pad / slice to 32 hex chars (128-bit) as required by OTEL
      const hex = corr.replace(/[^a-fA-F0-9]/g, '').padEnd(32, '0').substring(0, 32);
      return hex;
    }
    // Fallback random 32 hex chars
    return (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + '0000000000000000').substring(0, 32);
  }
}

// ---------------------------------------------------------------------------
// Tracer provider & exporter registration
// ---------------------------------------------------------------------------
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'workflow-bolt-functions',
  }),
  idGenerator: new CorrelationIdGenerator(),
});
provider.addSpanProcessor(new SimpleSpanProcessor(new CloudTraceExporter()));
provider.register();

registerInstrumentations({
  instrumentations: [getNodeAutoInstrumentations()],
});

// Helper function used elsewhere to run code inside a root span that uses a
// specific correlationId. It sets global.otelCorrelationId so the custom ID
// generator picks it up.
module.exports.runWithCorrelation = async function runWithCorrelation(correlationId, fn) {
  const prev = global.otelCorrelationId;
  global.otelCorrelationId = correlationId;
  try {
    const tracer = api.trace.getTracer('workflow-bolt');
    return await tracer.startActiveSpan('correlation-root', { attributes: { correlationId } }, async (span) => {
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    });
  } finally {
    global.otelCorrelationId = prev; // restore
  }
}; 