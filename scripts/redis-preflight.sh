#!/bin/bash
# Redis Pre-flight Check for Developer Scripts

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

echo "🚀 Redis Pre-flight Check..."

# 1. Check Redis connectivity
if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "✅ Redis: Connected ($REDIS_HOST:$REDIS_PORT)"
else
    echo "❌ Redis: Not reachable at $REDIS_HOST:$REDIS_PORT"
    echo "   Fix: docker run -d -p 6379:6379 redis:7-alpine"
    exit 1
fi

# 2. Verify environment
for var in REDIS_HOST REDIS_PORT; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var not set, using defaults"
    fi
done

# 3. Test write permission
if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SET health:check "ok" EX 10 > /dev/null 2>&1; then
    echo "✅ Redis: Write OK"
else
    echo "❌ Redis: Write failed"
    exit 1
fi

echo "✅ All systems GO!" 