#!/bin/bash

# Start Redis Infrastructure for LuknerLumina Multi-Agent System
# This script starts Redis server and SSE proxy for real-time event streaming

set -e

echo "🚀 Starting LuknerLumina Redis Infrastructure..."
echo "================================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables
if [ -f ".env.redis" ]; then
    echo "📄 Loading Redis environment configuration..."
    export $(cat .env.redis | grep -v '^#' | xargs)
else
    echo "⚠️  .env.redis not found, using default configuration"
fi

# Start Redis infrastructure using Docker Compose
echo "🐳 Starting Redis and SSE Proxy containers..."
docker-compose -f docker-compose.redis.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.redis.yml ps --services --filter "status=running" | grep -q "redis\|sse-proxy"; then
        echo "✅ Services are starting up..."
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

# Test Redis connection
echo "🔍 Testing Redis connection..."
if docker exec luknerlumina-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is responding to ping"
else
    echo "❌ Redis is not responding"
    docker-compose -f docker-compose.redis.yml logs redis
    exit 1
fi

# Test SSE Proxy
echo "🔍 Testing SSE Proxy..."
sleep 5  # Give SSE proxy time to connect to Redis
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ SSE Proxy is responding"
else
    echo "❌ SSE Proxy is not responding"
    docker-compose -f docker-compose.redis.yml logs sse-proxy
    exit 1
fi

echo ""
echo "🎉 Redis Infrastructure is ready!"
echo "================================================"
echo "📊 Redis Server: localhost:6379"
echo "🌐 RedisInsight UI: http://localhost:8001"
echo "📡 SSE Proxy: http://localhost:3001/events"
echo "🩺 Health Check: http://localhost:3001/health"
echo ""
echo "📝 Environment variables:"
echo "   REDIS_URL=redis://localhost:6379"
echo "   VITE_REDIS_SSE_URL=http://localhost:3001/events"
echo ""
echo "🔧 Management commands:"
echo "   Stop: docker-compose -f docker-compose.redis.yml down"
echo "   Logs: docker-compose -f docker-compose.redis.yml logs -f"
echo "   Reset: docker-compose -f docker-compose.redis.yml down -v"
echo ""
echo "✨ Ready for multi-agent coordination!"