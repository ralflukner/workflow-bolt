#!/usr/bin/env node

/**
 * Tebra Redis Worker
 * Processes Tebra API requests from Redis streams
 * Bypasses CORS by making server-side API calls
 */

const Redis = require('redis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const express = require('express');

// Configuration
const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    streams: {
      requests: 'tebra:requests',
      responses: 'tebra:responses',
      status: 'tebra:status'
    }
  },
  phpApi: {
    url: process.env.TEBRA_PHP_API_URL || 'https://tebra-api.luknerlumina.com',
    apiKey: process.env.TEBRA_INTERNAL_API_KEY
  },
  worker: {
    name: 'tebra-redis-worker',
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '8080')
  }
};

class TebraRedisWorker {
  constructor() {
    this.redisClient = null;
    this.isRunning = false;
    this.activeRequests = new Map();
    this.processedCount = 0;
    this.errorCount = 0;
    this.healthServer = null;
  }

  async start() {
    try {
      // Initialize Redis connection
      await this.connectRedis();
      
      // Start health check server
      this.startHealthServer();
      
      // Start processing
      this.isRunning = true;
      console.log('✅ Tebra Redis Worker started');
      console.log(`📡 Connected to Redis at ${config.redis.host}:${config.redis.port}`);
      console.log(`🔧 PHP API endpoint: ${config.phpApi.url}`);
      
      // Main processing loop
      await this.processLoop();
      
    } catch (error) {
      console.error('❌ Failed to start worker:', error);
      process.exit(1);
    }
  }

  async connectRedis() {
    const redisConfig = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        tls: config.redis.tls
      }
    };

    if (config.redis.password) {
      redisConfig.password = config.redis.password;
    }

    this.redisClient = Redis.createClient(redisConfig);

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    await this.redisClient.connect();
  }

  startHealthServer() {
    const app = express();

    app.get('/health', (req, res) => {
      const health = {
        status: this.isRunning ? 'healthy' : 'unhealthy',
        uptime: process.uptime(),
        redis: this.redisClient?.isReady ? 'connected' : 'disconnected',
        processed: this.processedCount,
        errors: this.errorCount,
        activeRequests: this.activeRequests.size
      };
      
      res.status(this.isRunning ? 200 : 503).json(health);
    });

    app.get('/ready', (req, res) => {
      const isReady = this.isRunning && this.redisClient?.isReady;
      res.status(isReady ? 200 : 503).json({ ready: isReady });
    });

    this.healthServer = app.listen(config.worker.healthCheckPort, () => {
      console.log(`🏥 Health check server listening on port ${config.worker.healthCheckPort}`);
    });
  }

  async processLoop() {
    while (this.isRunning) {
      try {
        // Read from Redis stream with blocking
        const results = await this.redisClient.xRead(
          { key: config.redis.streams.requests, id: '$' },
          { BLOCK: 5000, COUNT: 1 }
        );

        if (results && results.length > 0) {
          const stream = results[0];
          for (const message of stream.messages) {
            // Process request asynchronously
            this.processRequest(message.id, message.message)
              .catch(err => console.error('Error processing request:', err));
          }
        }
      } catch (error) {
        console.error('Error in process loop:', error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  async processRequest(messageId, messageData) {
    const startTime = Date.now();
    let request;

    try {
      // Parse request data
      request = this.parseMessage(messageData);
      console.log(`📥 Processing request: ${request.action} (${request.correlationId})`);

      // Track active request
      this.activeRequests.set(request.correlationId, {
        action: request.action,
        startTime
      });

      // Send processing status
      await this.publishStatus(request.correlationId, 'processing', {
        action: request.action,
        messageId
      });

      // Call PHP API
      const response = await this.callPhpApi(request.action, request.params);

      // Publish success response
      await this.publishResponse({
        id: uuidv4(),
        requestId: request.id,
        correlationId: request.correlationId,
        status: 'success',
        data: response.data,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      });

      this.processedCount++;
      console.log(`✅ Request completed: ${request.action} (${Date.now() - startTime}ms)`);

    } catch (error) {
      this.errorCount++;
      console.error(`❌ Request failed: ${request?.action || 'unknown'}`, error.message);

      // Publish error response
      if (request?.correlationId) {
        await this.publishResponse({
          id: uuidv4(),
          requestId: request.id,
          correlationId: request.correlationId,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        });
      }
    } finally {
      // Clean up tracking
      if (request?.correlationId) {
        this.activeRequests.delete(request.correlationId);
      }
    }
  }

  parseMessage(messageData) {
    // Redis returns object with string values, parse if needed
    const data = {};
    for (const [key, value] of Object.entries(messageData)) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }

    return {
      id: data.id || uuidv4(),
      action: data.action,
      params: data.params || {},
      userId: data.userId,
      timestamp: data.timestamp,
      correlationId: data.correlationId
    };
  }

  async callPhpApi(action, params) {
    const timeout = config.worker.requestTimeout;

    try {
      const response = await axios({
        method: 'POST',
        url: config.phpApi.url,
        data: {
          action,
          params
        },
        headers: {
          'X-API-Key': config.phpApi.apiKey,
          'Content-Type': 'application/json',
          'X-Request-ID': uuidv4()
        },
        timeout,
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });

      if (response.status >= 400) {
        throw new Error(`API returned ${response.status}: ${response.data?.error || response.statusText}`);
      }

      return response.data;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      if (error.response) {
        throw new Error(`API error: ${error.response.data?.error || error.message}`);
      }
      
      throw error;
    }
  }

  async publishResponse(response) {
    try {
      await this.redisClient.xAdd(
        config.redis.streams.responses,
        '*',
        {
          type: 'tebra_response',
          data: JSON.stringify(response)
        }
      );
    } catch (error) {
      console.error('Failed to publish response:', error);
    }
  }

  async publishStatus(correlationId, status, metadata = {}) {
    try {
      await this.redisClient.xAdd(
        config.redis.streams.status,
        '*',
        {
          correlationId,
          status,
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify(metadata)
        }
      );
    } catch (error) {
      console.error('Failed to publish status:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping Tebra Redis Worker...');
    this.isRunning = false;

    // Close Redis connection
    if (this.redisClient) {
      await this.redisClient.quit();
    }

    // Close health server
    if (this.healthServer) {
      this.healthServer.close();
    }

    console.log('👋 Worker stopped');
  }
}

// Handle graceful shutdown
const worker = new TebraRedisWorker();

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal');
  await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal');
  await worker.stop();
  process.exit(0);
});

// Start the worker
worker.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 