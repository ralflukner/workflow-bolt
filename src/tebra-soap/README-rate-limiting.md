# Tebra EHR API Rate Limiting

This implementation automatically enforces the rate limits specified in the Tebra EHR API documentation to ensure compliance and prevent API throttling.

## Rate Limits Implemented

### Read Operations

- **GetAllPatients**: 1 call every 5 seconds (5000ms)
- **GetAppointment**: 1 call every ½ second (500ms)
- **GetAppointments**: 1 call per second (1000ms)
- **GetCharges**: 1 call per second (1000ms)
- **GetEncounterDetails**: 1 call every ½ second (500ms)
- **GetExternalVendors**: 1 call per second (1000ms)
- **GetPatient**: 1 call every ¼ second (250ms)
- **GetPatients**: 1 call per second (1000ms)
- **GetPayments**: 1 call per second (1000ms)
- **GetPractices**: 1 call every ½ second (500ms)
- **GetProcedureCode**: 1 call every ½ second (500ms)
- **GetProviders**: 1 call every ½ second (500ms)
- **GetServiceLocations**: 1 call every ½ second (500ms)
- **GetThrottles**: 1 call every 5 seconds (5000ms)
- **GetTransactions**: 1 call per second (1000ms)

### Write Operations

- **CreateAppointment**: 1 call every ½ second (500ms)
- **CreateEncounter**: 1 call every ½ second (500ms)
- **CreatePatient**: 1 call every ½ second (500ms)
- **CreatePayments**: 1 call every ½ second (500ms)
- **UpdateAppointment**: 1 call every ½ second (500ms)
- **UpdateEncounterStatus**: 1 call every ½ second (500ms)
- **UpdatePatient**: 1 call per second (1000ms)
- **DeleteAppointment**: 1 call every ½ second (500ms)

### Search Operations

- **SearchPatient**: 1 call every ¼ second (250ms)

## Implementation Details

### TebraRateLimiter Class

- Singleton pattern for global rate limit enforcement
- Method-specific rate limiting based on Tebra documentation
- Automatic waiting between API calls
- Utility methods for rate limit monitoring

### Integration Points

1. **TebraSoapClient**: All SOAP API calls automatically wait for appropriate intervals
2. **TebraApiService**: Higher-level API methods that use the rate-limited SOAP client
3. **TebraIntegrationService**: Business logic layer that orchestrates API calls

### Usage Example

```typescript
import { tebraRateLimiter } from './tebra-rate-limiter';

// Check if a method can be called immediately
if (tebraRateLimiter.canCallImmediately('GetPatient')) {
  // Make the call
} else {
  // Wait for rate limit
  await tebraRateLimiter.waitForRateLimit('GetPatient');
  // Now make the call
}

// Get remaining wait time
const waitTime = tebraRateLimiter.getRemainingWaitTime('GetAppointments');
console.log(`Must wait ${waitTime}ms before next GetAppointments call`);
```

### Benefits

- **Compliance**: Automatically follows Tebra's documented rate limits
- **Reliability**: Prevents API throttling and service interruptions
- **Transparency**: Clear logging of rate limit enforcement
- **Flexibility**: Easy to adjust limits if Tebra updates their requirements

### Monitoring

The integration UI displays rate limiting status and confirms that limits are being enforced automatically.
