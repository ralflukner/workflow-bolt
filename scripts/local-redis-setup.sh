#!/bin/bash

# 🔧 Local Redis Setup for Persistent Development
# Creates a local Redis instance that survives reboots and works with the project
# Author: Claude Code Assistant
# Version: 1.0
# Date: 2025-07-05

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting Up Local Redis for Development${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Create local Redis data directory
REDIS_DATA_DIR="$HOME/workflow-bolt-data/redis"
mkdir -p "$REDIS_DATA_DIR"
echo "📁 Created Redis data directory: $REDIS_DATA_DIR"

# Stop and remove existing Redis container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^workflow-redis$'; then
    echo "🛑 Stopping existing Redis container..."
    docker stop workflow-redis || true
    docker rm workflow-redis || true
fi

# Create Redis configuration
cat > "$REDIS_DATA_DIR/redis.conf" << 'EOF'
# Redis configuration for workflow-bolt development
port 6379
bind 0.0.0.0
protected-mode no
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /data
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

echo "⚙️ Created Redis configuration"

# Start Redis container with persistent storage
echo "🚀 Starting local Redis container..."
docker run -d \
    --name workflow-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v "$REDIS_DATA_DIR":/data \
    -v "$REDIS_DATA_DIR/redis.conf":/usr/local/etc/redis/redis.conf \
    redis:7-alpine \
    redis-server /usr/local/etc/redis/redis.conf

# Wait for Redis to start
echo "⏳ Waiting for Redis to start..."
for i in {1..10}; do
    if docker exec workflow-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "${GREEN}✅ Redis is running!${NC}"
        break
    fi
    echo "Waiting... ($i/10)"
    sleep 2
done

# Test Redis functionality
echo "🧪 Testing Redis functionality..."
docker exec workflow-redis redis-cli set test_key "workflow-bolt-test"
TEST_VALUE=$(docker exec workflow-redis redis-cli get test_key)
if [ "$TEST_VALUE" = "workflow-bolt-test" ]; then
    echo -e "${GREEN}✅ Redis read/write test passed${NC}"
    docker exec workflow-redis redis-cli del test_key
else
    echo -e "${RED}❌ Redis test failed${NC}"
    exit 1
fi

# Create Redis management scripts
cat > "$HOME/workflow-bolt-data/start-redis.sh" << 'EOF'
#!/bin/bash
if ! docker ps --format '{{.Names}}' | grep -q '^workflow-redis$'; then
    echo "🚀 Starting Redis..."
    docker start workflow-redis
    sleep 2
    if docker exec workflow-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Redis failed to start"
        exit 1
    fi
else
    echo "✅ Redis is already running"
fi
EOF

cat > "$HOME/workflow-bolt-data/stop-redis.sh" << 'EOF'
#!/bin/bash
if docker ps --format '{{.Names}}' | grep -q '^workflow-redis$'; then
    echo "🛑 Stopping Redis..."
    docker stop workflow-redis
    echo "✅ Redis stopped"
else
    echo "ℹ️ Redis is not running"
fi
EOF

cat > "$HOME/workflow-bolt-data/redis-status.sh" << 'EOF'
#!/bin/bash
echo "📊 Redis Status:"
if docker ps --format '{{.Names}}' | grep -q '^workflow-redis$'; then
    echo "  Status: ✅ Running"
    echo "  Port: 6379"
    echo "  Data: ~/workflow-bolt-data/redis"
    echo "  Memory: $(docker exec workflow-redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
    echo "  Keys: $(docker exec workflow-redis redis-cli dbsize)"
else
    echo "  Status: ❌ Stopped"
fi
EOF

chmod +x "$HOME/workflow-bolt-data/start-redis.sh"
chmod +x "$HOME/workflow-bolt-data/stop-redis.sh" 
chmod +x "$HOME/workflow-bolt-data/redis-status.sh"

echo ""
echo -e "${GREEN}🎉 Local Redis Setup Complete!${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo -e "${BLUE}Redis Connection Info:${NC}"
echo "  Host: localhost"
echo "  Port: 6379"
echo "  No password required"
echo "  Data persisted to: $REDIS_DATA_DIR"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo "  Start: $HOME/workflow-bolt-data/start-redis.sh"
echo "  Stop: $HOME/workflow-bolt-data/stop-redis.sh"
echo "  Status: $HOME/workflow-bolt-data/redis-status.sh"
echo "  CLI: docker exec -it workflow-redis redis-cli"
echo ""
echo -e "${BLUE}Auto-restart:${NC}"
echo "  ✅ Redis will automatically start when Docker starts"
echo "  ✅ Data persists across container restarts"
echo "  ✅ Survives laptop reboots (if Docker auto-starts)"
echo ""
echo -e "${YELLOW}Next: Update your application configs to use localhost:6379${NC}"