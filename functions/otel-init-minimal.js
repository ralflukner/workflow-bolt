// Minimal OpenTelemetry initialization without auto-instrumentation
// This fixes the memory exhaustion issue

const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');

// Only initialize if in production and not already initialized
if (process.env.NODE_ENV === 'production' && !global.__otelInitialized) {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'workflow-bolt-functions',
    }),
  });
  
  provider.addSpanProcessor(new SimpleSpanProcessor(new TraceExporter()));
  provider.register();
  
  global.__otelInitialized = true;
  
  console.log('OpenTelemetry initialized (minimal mode)');
} else {
  console.log('OpenTelemetry skipped (dev mode or already initialized)');
}

// Export empty function for compatibility
module.exports.runWithCorrelation = async function runWithCorrelation(correlationId, fn) {
  // Just run the function without tracing in minimal mode
  return fn();
};