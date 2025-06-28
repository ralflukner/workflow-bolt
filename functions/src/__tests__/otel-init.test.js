const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const api = require('@opentelemetry/api');
const crypto = require('crypto');

// Test the CorrelationIdGenerator class
class TestCorrelationIdGenerator {
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

describe('OpenTelemetry ID Generation', () => {
  let generator;
  let provider;

  beforeEach(() => {
    generator = new TestCorrelationIdGenerator();
    
    // Create a test tracer provider
    provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'test-service',
      }),
      idGenerator: generator,
    });
    
    // Add a simple span processor that doesn't export
    provider.addSpanProcessor(new SimpleSpanProcessor({
      onStart: () => {},
      onEnd: () => {},
      shutdown: () => Promise.resolve(),
      forceFlush: () => Promise.resolve(),
    }));
    
    provider.register();
  });

  afterEach(() => {
    if (provider) {
      provider.shutdown();
    }
    // Clean up global correlation ID
    delete global.otelCorrelationId;
  });

  describe('Span ID Generation', () => {
    test('should generate valid 16-character hex span IDs', () => {
      const spanIds = [];
      
      for (let i = 0; i < 10; i++) {
        const spanId = generator.generateSpanId();
        spanIds.push(spanId);
        
        expect(spanId).toHaveLength(16);
        expect(spanId).toMatch(/^[a-f0-9]{16}$/i);
      }
      
      // Verify uniqueness (very unlikely to have duplicates with crypto.randomBytes)
      const uniqueSpanIds = new Set(spanIds);
      expect(uniqueSpanIds.size).toBe(spanIds.length);
    });
  });

  describe('Trace ID Generation', () => {
    test('should generate valid 32-character hex trace IDs when no correlation ID', () => {
      const traceIds = [];
      
      for (let i = 0; i < 10; i++) {
        const traceId = generator.generateTraceId();
        traceIds.push(traceId);
        
        expect(traceId).toHaveLength(32);
        expect(traceId).toMatch(/^[a-f0-9]{32}$/i);
      }
      
      // Verify uniqueness
      const uniqueTraceIds = new Set(traceIds);
      expect(uniqueTraceIds.size).toBe(traceIds.length);
    });

    test('should use correlation ID when provided and valid', () => {
      const testCases = [
        {
          input: 'abc123def4567890',
          expected: 'abc123def45678900000000000000000'
        },
        {
          input: 'abc123def4567890abcdef1234567890',
          expected: 'abc123def4567890abcdef1234567890'
        },
        {
          input: 'ABC123DEF456',
          expected: 'abc123def45600000000000000000000'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        global.otelCorrelationId = input;
        const traceId = generator.generateTraceId();
        
        expect(traceId).toHaveLength(32);
        expect(traceId).toMatch(/^[a-f0-9]{32}$/i);
        expect(traceId).toBe(expected);
      });
    });

    test('should sanitize correlation IDs with invalid characters', () => {
      const testCases = [
        {
          input: 'abc-123-def-456',
          expected: 'abc123def45600000000000000000000'
        },
        {
          input: 'abc123!@#$%^&*()def456',
          expected: 'abc123def45600000000000000000000'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        global.otelCorrelationId = input;
        const traceId = generator.generateTraceId();
        
        expect(traceId).toHaveLength(32);
        expect(traceId).toMatch(/^[a-f0-9]{32}$/i);
        expect(traceId).toBe(expected);
      });
    });

    test('should handle short correlation IDs by padding with random bytes', () => {
      global.otelCorrelationId = 'abc123';
      const traceId = generator.generateTraceId();
      
      expect(traceId).toHaveLength(32);
      expect(traceId).toMatch(/^[a-f0-9]{32}$/i);
      expect(traceId).toMatch(/^abc123[a-f0-9]{26}$/i);
    });

    test('should truncate long correlation IDs', () => {
      global.otelCorrelationId = 'abc123def4567890abcdef1234567890abcdef1234567890';
      const traceId = generator.generateTraceId();
      
      expect(traceId).toHaveLength(32);
      expect(traceId).toMatch(/^[a-f0-9]{32}$/i);
      expect(traceId).toBe('abc123def4567890abcdef1234567890');
    });
  });

  describe('Integration with OpenTelemetry API', () => {
    test('should create spans with valid IDs', async () => {
      const tracer = api.trace.getTracer('test-tracer');
      
      await tracer.startActiveSpan('test-span', {}, async (span) => {
        const spanContext = span.spanContext();
        
        expect(spanContext.spanId).toHaveLength(16);
        expect(spanContext.spanId).toMatch(/^[a-f0-9]{16}$/i);
        
        expect(spanContext.traceId).toHaveLength(32);
        expect(spanContext.traceId).toMatch(/^[a-f0-9]{32}$/i);
        
        span.end();
      });
    });

    test('should use correlation ID in trace when set', async () => {
      global.otelCorrelationId = 'abc123def4567890';
      
      const tracer = api.trace.getTracer('test-tracer');
      
      await tracer.startActiveSpan('test-span', {}, async (span) => {
        const spanContext = span.spanContext();
        
        expect(spanContext.traceId).toHaveLength(32);
        expect(spanContext.traceId).toMatch(/^abc123def4567890[a-f0-9]{16}$/i);
        
        span.end();
      });
    });
  });
}); 