#!/bin/bash

# Start Redis Infrastructure Locally for LuknerLumina Multi-Agent System
# This script starts Redis server and SSE proxy without Docker

set -e

echo "🚀 Starting LuknerLumina Redis Infrastructure (Local Mode)..."
echo "==========================================================="

# Check if Redis is installed
if ! command -v redis-server >/dev/null 2>&1; then
    echo "❌ Redis is not installed."
    echo ""
    echo "📦 Install Redis using one of these methods:"
    echo ""
    echo "🍺 Homebrew (macOS):"
    echo "   brew install redis"
    echo "   brew services start redis"
    echo ""
    echo "🐧 Ubuntu/Debian:"
    echo "   sudo apt update"
    echo "   sudo apt install redis-server"
    echo "   sudo systemctl start redis-server"
    echo ""
    echo "🎩 CentOS/RHEL:"
    echo "   sudo yum install redis"
    echo "   sudo systemctl start redis"
    echo ""
    echo "🐳 Docker Alternative:"
    echo "   docker run -d -p 6379:6379 --name redis redis:latest"
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is not installed."
    echo "📦 Install Node.js from https://nodejs.org/ or use nvm"
    exit 1
fi

# Load environment variables
if [ -f ".env.redis" ]; then
    echo "📄 Loading Redis environment configuration..."
    export $(cat .env.redis | grep -v '^#' | xargs)
else
    echo "⚠️  .env.redis not found, using default configuration"
    export REDIS_URL="redis://localhost:6379"
    export VITE_REDIS_SSE_URL="http://localhost:3001/events"
    export SSE_PORT=3001
fi

# Start Redis server if not running
echo "🔍 Checking Redis server status..."
if ! redis-cli ping >/dev/null 2>&1; then
    echo "🚀 Starting Redis server..."
    
    # Try to start Redis with Homebrew service (macOS)
    if command -v brew >/dev/null 2>&1; then
        brew services start redis 2>/dev/null || {
            echo "📝 Starting Redis manually..."
            redis-server --daemonize yes --port 6379
        }
    else
        # Start Redis manually
        echo "📝 Starting Redis manually..."
        redis-server --daemonize yes --port 6379
    fi
    
    # Wait for Redis to start
    echo "⏳ Waiting for Redis to start..."
    timeout=30
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if redis-cli ping >/dev/null 2>&1; then
            echo "✅ Redis is responding to ping"
            break
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    if [ $elapsed -eq $timeout ]; then
        echo "❌ Redis failed to start within $timeout seconds"
        exit 1
    fi
else
    echo "✅ Redis is already running"
fi

# Install SSE proxy dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing SSE proxy dependencies..."
    cp sse-package.json package.json
    npm install
fi

# Kill existing SSE proxy if running
if pgrep -f "sse-proxy-server.js" >/dev/null; then
    echo "🛑 Stopping existing SSE proxy..."
    pkill -f "sse-proxy-server.js"
    sleep 2
fi

# Start SSE proxy server
echo "📡 Starting SSE proxy server..."
node sse-proxy-server.js &
SSE_PID=$!

# Wait for SSE proxy to start
echo "⏳ Waiting for SSE proxy to start..."
timeout=15
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ SSE Proxy is responding"
        break
    fi
    sleep 1
    elapsed=$((elapsed + 1))
done

if [ $elapsed -eq $timeout ]; then
    echo "❌ SSE Proxy failed to start within $timeout seconds"
    kill $SSE_PID 2>/dev/null || true
    exit 1
fi

# Test Redis Streams functionality
echo "🧪 Testing Redis Streams..."
redis-cli XADD agent_updates "*" agent "test-agent" msg "Redis infrastructure test" type "system" > /dev/null

echo ""
echo "🎉 Redis Infrastructure is ready!"
echo "================================================"
echo "📊 Redis Server: localhost:6379"
echo "📡 SSE Proxy: http://localhost:3001/events"
echo "🩺 Health Check: http://localhost:3001/health"
echo "🔧 SSE Process ID: $SSE_PID"
echo ""
echo "📝 Environment variables for your .env file:"
echo "   REDIS_URL=redis://localhost:6379"
echo "   VITE_REDIS_SSE_URL=http://localhost:3001/events"
echo ""
echo "🔧 Management commands:"
echo "   Stop SSE Proxy: kill $SSE_PID"
echo "   Stop Redis (Homebrew): brew services stop redis"
echo "   Stop Redis (manual): redis-cli shutdown"
echo "   View Redis logs: redis-cli monitor"
echo "   Test message: redis-cli XADD agent_updates '*' agent 'test' msg 'hello'"
echo ""
echo "✨ Ready for multi-agent coordination!"

# Save PID for easy cleanup
echo $SSE_PID > .sse-proxy.pid
echo "💾 SSE Proxy PID saved to .sse-proxy.pid"