# Connecting to Redis Event Bus in Frontend

## Overview

This document describes how to connect to the Redis Event Bus from the frontend application. The Redis Event Bus is used for real-time communication between different parts of the application, particularly for health checks and status updates.

## Implementation Details

### 1. Redis Event Bus in tebraFirebaseApi.ts

The `tebraFirebaseApi.ts` file has been updated to send health check data to the Redis Event Bus. This allows the frontend to monitor the health of the Tebra API integration in real-time.

Key components:

1. **sendToRedisEventBus function**: Sends health check data to Redis via a POST request to the Redis SSE endpoint.
2. **tebraHealthCheck function**: Modified to send health check data to Redis after performing the health check.
3. **testRedisConnection function**: Added to test the Redis connection explicitly.

### 2. Configuration

The Redis Event Bus URL is configured via the `VITE_REDIS_SSE_URL` environment variable. This should be set to the URL of the Redis SSE endpoint.

Example:

```
VITE_REDIS_SSE_URL=https://your-redis-sse-endpoint.com/sse
```

### 3. Usage

#### Testing Redis Connection

You can test the Redis connection using the browser console:

```javascript
// Using the debug object
tebraDebug.testRedisConnection()
  .then(result => console.log('Redis connection test result:', result));

// Using the API
tebraApi.testRedisConnection()
  .then(result => console.log('Redis connection test result:', result));
```

#### Consuming Redis Events

To consume Redis events in a React component, use the `useRedisEventBus` hook:

```javascript
import { useRedisEventBus } from '../hooks/useRedisEventBus';

function MyComponent() {
  const handleRedisUpdate = (update) => {
    console.log('Redis update received:', update);
    // Process the update...
  };

  // Subscribe to Redis events
  useRedisEventBus(handleRedisUpdate);

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Architecture

The Redis Event Bus architecture in the frontend follows this pattern:

1. **Publishing Events**: The `tebraFirebaseApi.ts` file sends health check data to Redis via a POST request to the Redis SSE endpoint.
2. **Consuming Events**: The `useRedisEventBus` hook subscribes to the Redis SSE endpoint and receives events in real-time.

This creates a bidirectional communication channel between the frontend and the Redis Event Bus, allowing for real-time monitoring and updates.

## Testing

To verify that the Redis Event Bus is working correctly:

1. Ensure the `VITE_REDIS_SSE_URL` environment variable is set correctly.
2. Call `tebraDebug.testRedisConnection()` from the browser console.
3. Check the Redis Event Bus indicator in the Tebra Debug Dashboard.
4. Verify that health check data is being sent to Redis by calling `tebraDebug.testChain()`.

## Troubleshooting

If you encounter issues with the Redis Event Bus:

1. **Redis URL not configured**: Ensure the `VITE_REDIS_SSE_URL` environment variable is set correctly.
2. **Connection failed**: Check that the Redis SSE endpoint is accessible from the frontend.
3. **Events not received**: Verify that the Redis SSE endpoint is correctly forwarding events to the frontend.
4. **CORS issues**: Ensure that the Redis SSE endpoint allows CORS requests from the frontend domain.

## Future Improvements

1. **Error handling**: Improve error handling and retry logic for Redis connections.
2. **Offline support**: Add offline support to queue events when the Redis connection is unavailable.
3. **Event filtering**: Add support for filtering events by type or source.
4. **Event history**: Add support for retrieving event history from Redis.
