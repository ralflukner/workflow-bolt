const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const api = require('@opentelemetry/api');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const crypto = require('crypto');

// Only enable specific instrumentations to avoid memory bloat
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

// Custom ID generator for correlation
class CorrelationIdGenerator {
  generateSpanId() {
    const randomBytes = crypto.randomBytes(8);
    return randomBytes.toString('hex');
  }

  generateTraceId() {
    const corr = global.otelCorrelationId;
    
    if (typeof corr === 'string' && corr.length > 0) {
      const sanitized = corr.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      
      if (sanitized.length >= 16) {
        return sanitized.padEnd(32, '0').substring(0, 32);
      } else {
        const randomBytes = crypto.randomBytes(16 - Math.ceil(sanitized.length / 2));
        const randomHex = randomBytes.toString('hex');
        const paddedCorr = sanitized.padEnd(32, '0');
        return (paddedCorr + randomHex).substring(0, 32);
      }
    }
    
    const randomBytes = crypto.randomBytes(16);
    return randomBytes.toString('hex');
  }
}

// Initialize tracer provider
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'workflow-bolt-functions',
  }),
  idGenerator: new CorrelationIdGenerator(),
});

// Only add exporter in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TRACING === 'true') {
  provider.addSpanProcessor(new SimpleSpanProcessor(new TraceExporter()));
}

provider.register();

// Register only specific instrumentations instead of auto-instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingPaths: ['/health', '/readiness'],
    }),
    new ExpressInstrumentation(),
  ],
});

// Helper function for correlation
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
    global.otelCorrelationId = prev;
  }
};