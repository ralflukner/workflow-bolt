const crypto = require('crypto');

// Test the ID generation logic
class TestCorrelationIdGenerator {
  /**
   * Generate a cryptographically secure random span ID
   * @returns {string} 16-character hex string (64-bit span ID)
   */
  generateSpanId() {
    // Generate 8 random bytes (64 bits) and convert to 16 hex chars
    const randomBytes = crypto.randomBytes(8);
    return randomBytes.toString('hex');
  }

  /**
   * Generate a trace ID, either from correlation ID or cryptographically secure random
   * @returns {string} 32-character hex string (128-bit trace ID)
   */
  generateTraceId(correlationId = null) {
    if (typeof correlationId === 'string' && correlationId.length > 0) {
      // Sanitize correlation ID: remove non-hex characters and convert to lowercase
      const sanitized = correlationId.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      
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

// Test function
function testIdGeneration() {
  const generator = new TestCorrelationIdGenerator();
  
  console.log('🧪 Testing OpenTelemetry ID Generation\n');
  
  // Test span ID generation
  console.log('📏 Span ID Tests:');
  for (let i = 0; i < 5; i++) {
    const spanId = generator.generateSpanId();
    console.log(`  ${i + 1}. ${spanId} (length: ${spanId.length}, valid hex: ${/^[a-f0-9]{16}$/i.test(spanId)})`);
  }
  
  console.log('\n🔍 Trace ID Tests:');
  
  // Test random trace ID generation
  console.log('  Random trace IDs:');
  for (let i = 0; i < 3; i++) {
    const traceId = generator.generateTraceId();
    console.log(`    ${i + 1}. ${traceId} (length: ${traceId.length}, valid hex: ${/^[a-f0-9]{32}$/i.test(traceId)})`);
  }
  
  // Test correlation ID handling
  console.log('\n  Correlation ID tests:');
  
  const testCases = [
    'abc123def456', // Short hex
    'abc123def4567890abcdef1234567890abcdef12', // Long hex
    'abc-123-def-456', // Hex with hyphens
    'ABC123DEF456', // Uppercase hex
    'abc123def4567890', // Exactly 16 chars
    'abc123def4567890abcdef1234567890', // Exactly 32 chars
    'abc123def4567890abcdef1234567890abcdef1234567890', // Longer than 32
    'invalid!@#$%^&*()', // Invalid characters
    '', // Empty string
  ];
  
  testCases.forEach((testCase, index) => {
    const traceId = generator.generateTraceId(testCase);
    const isValid = /^[a-f0-9]{32}$/i.test(traceId);
    console.log(`    ${index + 1}. Input: "${testCase}"`);
    console.log(`       Output: ${traceId} (length: ${traceId.length}, valid: ${isValid})`);
  });
  
  // Test edge cases
  console.log('\n  Edge cases:');
  const edgeCases = [
    'a', // Single character
    '1234567890abcdef', // Exactly 16 hex chars
    '1234567890abcdef1234567890abcdef', // Exactly 32 hex chars
    '1234567890abcdef1234567890abcdef1234567890abcdef', // 48 chars
  ];
  
  edgeCases.forEach((testCase, index) => {
    const traceId = generator.generateTraceId(testCase);
    const isValid = /^[a-f0-9]{32}$/i.test(traceId);
    console.log(`    ${index + 1}. Input: "${testCase}"`);
    console.log(`       Output: ${traceId} (length: ${traceId.length}, valid: ${isValid})`);
  });
  
  console.log('\n✅ Test completed!');
}

// Run the test
testIdGeneration(); 