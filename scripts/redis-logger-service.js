#!/usr/bin/env node

/**
 * Redis Logger Service
 * Monitors Redis streams and persists messages to PostgreSQL
 * Provides audit trail and historical analysis capabilities
 */

const Redis = require('redis');
const { Pool } = require('pg');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class RedisLoggerService {
  constructor() {
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisAuth = process.env.REDIS_AUTH;
    this.projectId = process.env.PROJECT_ID || 'luknerlumina-firebase';
    this.environment = process.env.ENVIRONMENT || 'prod';
    
    this.redisClient = null;
    this.pgPool = null;
    this.secretClient = new SecretManagerServiceClient();
    this.isRunning = false;
    
    // Streams to monitor
    this.streams = [
      'agent_updates',
      'tebra:requests',
      'tebra:responses',
      'tebra:status',
      'dev:workflow-bolt:stream'
    ];
    
    // Track last processed IDs
    this.lastIds = {};
    this.streams.forEach(stream => {
      this.lastIds[stream] = '$';
    });
  }

  async initialize() {
    console.log('🚀 Initializing Redis Logger Service...');
    
    // Connect to Redis
    await this.connectRedis();
    
    // Connect to PostgreSQL
    await this.connectPostgres();
    
    // Create tables if needed
    await this.ensureTables();
    
    console.log('✅ Redis Logger Service initialized');
  }

  async connectRedis() {
    console.log('🔌 Connecting to Redis...');
    
    // Get Redis auth from Secret Manager if not in env
    if (!this.redisAuth && this.projectId) {
      try {
        const secretName = `projects/${this.projectId}/secrets/redis-auth-string-${this.environment}/versions/latest`;
        const [version] = await this.secretClient.accessSecretVersion({ name: secretName });
        this.redisAuth = version.payload.data.toString('utf8');
      } catch (error) {
        console.warn('Could not retrieve Redis auth from Secret Manager:', error.message);
      }
    }
    
    const redisOptions = {
      url: this.redisUrl,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max retries reached');
          return Math.min(retries * 100, 3000);
        }
      }
    };
    
    if (this.redisAuth) {
      redisOptions.password = this.redisAuth;
    }
    
    this.redisClient = Redis.createClient(redisOptions);
    
    this.redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });
    
    this.redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
    
    await this.redisClient.connect();
  }

  async connectPostgres() {
    console.log('🔌 Connecting to PostgreSQL...');
    
    // Get database credentials from Secret Manager
    const secretName = `projects/${this.projectId}/secrets/redis-logger-db-password-${this.environment}/versions/latest`;
    const [version] = await this.secretClient.accessSecretVersion({ name: secretName });
    const dbPassword = version.payload.data.toString('utf8');
    
    this.pgPool = new Pool({
      host: process.env.DB_HOST || '10.0.1.10',
      port: 5432,
      database: 'redis_logs',
      user: 'redis_logger',
      password: dbPassword,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection
    const client = await this.pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Connected to PostgreSQL');
  }

  async ensureTables() {
    console.log('📊 Ensuring database tables exist...');
    
    // Main message log table
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS redis_messages (
        id BIGSERIAL PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL,
        stream_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        data JSONB NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(stream_name, message_id)
      )
    `);
    
    // Create indexes for performance
    await this.pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_redis_messages_stream_timestamp 
      ON redis_messages(stream_name, timestamp DESC)
    `);
    
    await this.pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_redis_messages_data_gin 
      ON redis_messages USING GIN(data)
    `);
    
    // Agent activity summary table
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS agent_activity (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        message_count INTEGER DEFAULT 1,
        metadata JSONB,
        date DATE GENERATED ALWAYS AS (timestamp::date) STORED,
        hour INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM timestamp)) STORED
      )
    `);
    
    await this.pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_date 
      ON agent_activity(agent_id, date)
    `);
    
    // Tebra request tracking table
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS tebra_requests (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(255) UNIQUE NOT NULL,
        correlation_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        request_time TIMESTAMP NOT NULL,
        response_time TIMESTAMP,
        duration_ms INTEGER,
        error_message TEXT,
        request_data JSONB,
        response_data JSONB
      )
    `);
    
    await this.pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_tebra_requests_correlation 
      ON tebra_requests(correlation_id)
    `);
    
    await this.pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_tebra_requests_user_action 
      ON tebra_requests(user_id, action)
    `);
    
    // Stream statistics table
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS stream_statistics (
        id SERIAL PRIMARY KEY,
        stream_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        hour INTEGER NOT NULL,
        message_count INTEGER DEFAULT 0,
        total_bytes BIGINT DEFAULT 0,
        avg_processing_time_ms NUMERIC(10,2),
        UNIQUE(stream_name, date, hour)
      )
    `);
    
    console.log('✅ Database tables ready');
  }

  async start() {
    await this.initialize();
    this.isRunning = true;
    
    console.log('🎯 Starting message processing...');
    console.log(`📡 Monitoring streams: ${this.streams.join(', ')}`);
    
    // Start processing loop
    while (this.isRunning) {
      try {
        await this.processStreams();
      } catch (error) {
        console.error('❌ Processing error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processStreams() {
    // Build xRead arguments
    const streamArgs = this.streams.map(stream => ({
      key: stream,
      id: this.lastIds[stream]
    }));
    
    // Read from all streams
    const results = await this.redisClient.xRead(
      streamArgs,
      { BLOCK: 5000, COUNT: 100 }
    );
    
    if (!results || results.length === 0) {
      return;
    }
    
    // Process messages from each stream
    for (const streamResult of results) {
      const streamName = streamResult.name;
      const messages = streamResult.messages;
      
      for (const message of messages) {
        await this.processMessage(streamName, message);
        this.lastIds[streamName] = message.id;
      }
    }
  }

  async processMessage(streamName, message) {
    const messageId = message.id;
    const messageData = message.message;
    
    try {
      // Extract timestamp from message ID (Redis stream IDs contain timestamp)
      const timestampPart = messageId.split('-')[0];
      const timestamp = new Date(parseInt(timestampPart));
      
      // Store raw message
      await this.pgPool.query(`
        INSERT INTO redis_messages (message_id, stream_name, timestamp, data)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (stream_name, message_id) DO NOTHING
      `, [messageId, streamName, timestamp, JSON.stringify(messageData)]);
      
      // Process based on stream type
      if (streamName === 'agent_updates') {
        await this.processAgentUpdate(messageData, timestamp);
      } else if (streamName.startsWith('tebra:')) {
        await this.processTebraMessage(streamName, messageData, timestamp);
      }
      
      // Update statistics
      await this.updateStatistics(streamName, timestamp, JSON.stringify(messageData).length);
      
    } catch (error) {
      console.error(`❌ Error processing message ${messageId}:`, error);
    }
  }

  async processAgentUpdate(data, timestamp) {
    const agent = data.agent || data.sender || 'unknown';
    const action = data.action || data.type || 'unknown';
    const metadata = {
      correlationId: data.correlationId || data.correlation_id,
      messageType: data.message_type,
      replyTo: data.reply_to
    };
    
    await this.pgPool.query(`
      INSERT INTO agent_activity (agent_id, action, timestamp, metadata)
      VALUES ($1, $2, $3, $4)
    `, [agent, action, timestamp, JSON.stringify(metadata)]);
  }

  async processTebraMessage(streamName, data, timestamp) {
    if (streamName === 'tebra:requests') {
      // New request
      await this.pgPool.query(`
        INSERT INTO tebra_requests (
          request_id, correlation_id, user_id, action, 
          status, request_time, request_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (request_id) DO NOTHING
      `, [
        data.id,
        data.correlationId,
        data.userId,
        data.action,
        'pending',
        timestamp,
        JSON.stringify(data.params || {})
      ]);
    } else if (streamName === 'tebra:responses') {
      // Response received
      const duration = data.duration || null;
      const status = data.status || 'unknown';
      
      await this.pgPool.query(`
        UPDATE tebra_requests
        SET 
          status = $1,
          response_time = $2,
          duration_ms = $3,
          response_data = $4,
          error_message = $5
        WHERE correlation_id = $6
      `, [
        status,
        timestamp,
        duration,
        JSON.stringify(data.data || {}),
        data.error || null,
        data.correlationId
      ]);
    }
  }

  async updateStatistics(streamName, timestamp, messageSize) {
    const date = timestamp.toISOString().split('T')[0];
    const hour = timestamp.getHours();
    
    await this.pgPool.query(`
      INSERT INTO stream_statistics (stream_name, date, hour, message_count, total_bytes)
      VALUES ($1, $2, $3, 1, $4)
      ON CONFLICT (stream_name, date, hour)
      DO UPDATE SET 
        message_count = stream_statistics.message_count + 1,
        total_bytes = stream_statistics.total_bytes + $4
    `, [streamName, date, hour, messageSize]);
  }

  async generateDailyReport() {
    console.log('📊 Generating daily report...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Get message counts by stream
    const streamStats = await this.pgPool.query(`
      SELECT 
        stream_name,
        SUM(message_count) as total_messages,
        SUM(total_bytes) as total_bytes,
        AVG(message_count) as avg_messages_per_hour
      FROM stream_statistics
      WHERE date = $1
      GROUP BY stream_name
      ORDER BY total_messages DESC
    `, [dateStr]);
    
    // Get agent activity
    const agentStats = await this.pgPool.query(`
      SELECT 
        agent_id,
        COUNT(*) as action_count,
        COUNT(DISTINCT action) as unique_actions
      FROM agent_activity
      WHERE date = $1
      GROUP BY agent_id
      ORDER BY action_count DESC
    `, [dateStr]);
    
    // Get Tebra request stats
    const tebraStats = await this.pgPool.query(`
      SELECT 
        action,
        COUNT(*) as request_count,
        AVG(duration_ms) as avg_duration_ms,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
      FROM tebra_requests
      WHERE request_time::date = $1
      GROUP BY action
    `, [dateStr]);
    
    console.log('📈 Daily Report for', dateStr);
    console.log('Stream Statistics:', streamStats.rows);
    console.log('Agent Activity:', agentStats.rows);
    console.log('Tebra Requests:', tebraStats.rows);
    
    return {
      date: dateStr,
      streams: streamStats.rows,
      agents: agentStats.rows,
      tebra: tebraStats.rows
    };
  }

  async stop() {
    console.log('🛑 Stopping Redis Logger Service...');
    this.isRunning = false;
    
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
    }
    
    console.log('👋 Service stopped');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle process signals
const logger = new RedisLoggerService();

process.on('SIGINT', async () => {
  await logger.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await logger.stop();
  process.exit(0);
});

// Schedule daily report
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 1 && now.getMinutes() === 0) {
    logger.generateDailyReport().catch(console.error);
  }
}, 60000); // Check every minute

// Start the service
logger.start().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
}); 