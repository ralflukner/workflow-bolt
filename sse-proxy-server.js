#!/usr/bin/env node

/**
 * Redis SSE Proxy Server
 * Bridges Redis Streams to Server-Sent Events for the React frontend
 * Part of the LuknerLumina multi-agent system
 */

const express = require('express');
const Redis = require('redis');
const cors = require('cors');

const app = express();
const PORT = process.env.SSE_PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_STREAM = process.env.REDIS_STREAM || 'agent_updates';
const AGENT_ID = process.env.AGENT_ID || null; // Optional agent ID for direct messaging

// Enable CORS for all origins in development
app.use(cors({
  origin: true,
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    redis_url: REDIS_URL,
    stream: REDIS_STREAM
  });
});

// SSE endpoint for Redis events
app.get('/events', async (req, res) => {
  console.log('📡 New SSE client connected');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'SSE connection established',
    timestamp: new Date().toISOString()
  })}\\n\\n`);

  let redisClient;
  let isConnected = false;

  try {
    // Create Redis client
    redisClient = Redis.createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'Redis connection error',
        error: err.message,
        timestamp: new Date().toISOString()
      })}\\n\\n`);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected for SSE stream');
      isConnected = true;
      res.write(`data: ${JSON.stringify({
        type: 'redis_connected',
        message: 'Redis connection established',
        timestamp: new Date().toISOString()
      })}\\n\\n`);
    });

    // Connect to Redis
    await redisClient.connect();

    // Start listening to Redis Stream(s)
    let lastId = '$'; // Start from latest messages
    let lastInboxId = '$'; // For agent inbox
    
    const pollRedisStream = async () => {
      if (!isConnected) return;
      
      try {
        // Build streams to monitor
        const streams = [
          { key: REDIS_STREAM, id: lastId }
        ];
        
        // Add agent inbox if AGENT_ID is set
        if (AGENT_ID) {
          streams.push({ 
            key: `agent_inbox:${AGENT_ID}`, 
            id: lastInboxId 
          });
        }
        
        const results = await redisClient.xRead(
          streams.map(stream => ({ key: stream.key, id: stream.id })), 
          {
            COUNT: 10,
            BLOCK: 5000 // 5 second timeout
          }
        );

        if (results && results.length > 0) {
          for (const stream of results) {
            const streamName = stream.name;
            const messages = stream.messages;
            
            for (const message of messages) {
              // Update appropriate lastId
              if (streamName === REDIS_STREAM) {
                lastId = message.id;
              } else if (streamName === `agent_inbox:${AGENT_ID}`) {
                lastInboxId = message.id;
              }
              
              // Forward Redis message as SSE event
              const eventData = {
                type: streamName.startsWith('agent_inbox:') ? 'direct_message' : 'agent_update',
                id: message.id,
                timestamp: new Date().toISOString(),
                stream: streamName,
                data: message.message
              };
              
              res.write(`data: ${JSON.stringify(eventData)}\\n\\n`);
              console.log(`📨 Forwarded Redis message from ${streamName}:`, message.id);
            }
          }
        }
        
        // Continue polling
        setImmediate(pollRedisStream);
        
      } catch (error) {
        console.error('❌ Redis stream polling error:', error);
        
        // Send error to client
        res.write(`data: ${JSON.stringify({
          type: 'polling_error',
          message: 'Redis polling error',
          error: error.message,
          timestamp: new Date().toISOString()
        })}\\n\\n`);
        
        // Retry after delay
        setTimeout(pollRedisStream, 10000);
      }
    };

    // Start polling
    pollRedisStream();

  } catch (error) {
    console.error('❌ Failed to setup Redis SSE:', error);
    res.write(`data: ${JSON.stringify({
      type: 'setup_error',
      message: 'Failed to setup Redis connection',
      error: error.message,
      timestamp: new Date().toISOString()
    })}\\n\\n`);
  }

  // Handle client disconnect
  req.on('close', () => {
    console.log('📡 SSE client disconnected');
    if (redisClient && isConnected) {
      redisClient.quit();
    }
  });

  req.on('aborted', () => {
    console.log('📡 SSE client aborted connection');
    if (redisClient && isConnected) {
      redisClient.quit();
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Redis SSE Proxy Server running on port', PORT);
  console.log('📡 SSE endpoint: http://localhost:' + PORT + '/events');
  console.log('🔗 Redis URL:', REDIS_URL);
  console.log('📊 Redis Stream:', REDIS_STREAM);
  console.log('💡 Health check: http://localhost:' + PORT + '/health');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down SSE proxy server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down SSE proxy server...');
  process.exit(0);
});