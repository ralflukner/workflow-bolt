const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const api = require('@opentelemetry/api');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const crypto = require('crypto');

// Initialize OpenTelemetry with error handling to prevent startup failures
let tracingEnabled = false;

// ---------------------------------------------------------------------------
// Custom ID generator – if a correlationId is present on global.otelCorrelationId,
// it will be used as the traceId, enabling 1-to-1 mapping between our existing
// correlation IDs and OpenTelemetry traces. Otherwise a random traceId is used.
// ---------------------------------------------------------------------------
class CorrelationIdGenerator {
  /**
   * Generate a cryptographically secure random span ID
   * @returns {string} 16-character hex string (64-bit span ID)
   */
  generateSpanId() {
    const randomBytes = crypto.randomBytes(8); // 64 bits = 8 bytes
    return randomBytes.toString('hex');
  }

  /**
   * Generate a trace ID, either from correlation ID or cryptographically secure random
   * @returns {string} 32-character hex string (128-bit trace ID)
   */
  generateTraceId() {
    const corr = global.otelCorrelationId;
    
    if (typeof corr === 'string' && corr.length > 0) {
      // Sanitize correlation ID: remove non-hex characters and convert to lowercase
      const sanitized = corr.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      
      if (sanitized.length >= 16) {
        // If we have enough hex characters, use them
        // Pad with zeros if shorter than 32, or truncate if longer
        return sanitized.padEnd(32, '0').substring(0, 32);
      } else {
        // If correlation ID is too short, pad it with random bytes
        const randomBytes = crypto.randomBytes(16 - Math.ceil(sanitized.length / 2));
        const randomHex = randomBytes.toString('hex');
        const paddedCorr = sanitized.padEnd(32, '0');
        return (paddedCorr + randomHex).substring(0, 32);
      }
    }
    
    // Fallback: generate cryptographically secure random trace ID
    const randomBytes = crypto.randomBytes(16); // 128 bits = 16 bytes
    return randomBytes.toString('hex');
  }
}

// ---------------------------------------------------------------------------
// Tracer provider & exporter registration
// ---------------------------------------------------------------------------
try {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'workflow-bolt-functions',
    }),
    idGenerator: new CorrelationIdGenerator(),
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(new TraceExporter()));
  provider.register();

  registerInstrumentations({
    instrumentations: [getNodeAutoInstrumentations()],
  });
  
  tracingEnabled = true;
  console.log('OpenTelemetry tracing initialized successfully');
} catch (error) {
  console.warn('OpenTelemetry initialization failed, continuing without tracing:', error.message);
  tracingEnabled = false;
}

// Helper function used elsewhere to run code inside a root span that uses a
// specific correlationId. It sets global.otelCorrelationId so the custom ID
// generator picks it up.
module.exports.runWithCorrelation = async function runWithCorrelation(correlationId, fn) {
  if (!tracingEnabled) {
    // If tracing is disabled, just run the function directly
    return await fn();
  }
  
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