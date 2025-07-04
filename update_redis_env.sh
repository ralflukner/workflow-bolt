#!/bin/bash
# Update environment variables for Memorystore Redis

echo "🔧 Updating Redis environment variables..."

# Update .env file
if [ -f .env ]; then
    cp .env .env.redis-backup
    
    # Remove old Redis Cloud variables
    grep -v "REDIS_HOST\|REDIS_PORT\|REDIS_PASSWORD\|REDIS_URL" .env > .env.tmp
    
    # Add Memorystore variables
    echo "" >> .env.tmp
    echo "# Google Cloud Memorystore Redis" >> .env.tmp
    echo "REDIS_HOST=10.161.35.147" >> .env.tmp
    echo "REDIS_PORT=6379" >> .env.tmp
    echo "# No password needed for Memorystore in VPC" >> .env.tmp
    
    mv .env.tmp .env
    echo "✅ Updated .env file"
fi

# Update functions/.env if it exists
if [ -f functions/.env ]; then
    cp functions/.env functions/.env.redis-backup
    
    grep -v "REDIS_HOST\|REDIS_PORT\|REDIS_PASSWORD\|REDIS_URL" functions/.env > functions/.env.tmp
    
    echo "" >> functions/.env.tmp
    echo "# Google Cloud Memorystore Redis" >> functions/.env.tmp
    echo "REDIS_HOST=10.161.35.147" >> functions/.env.tmp
    echo "REDIS_PORT=6379" >> functions/.env.tmp
    
    mv functions/.env.tmp functions/.env
    echo "✅ Updated functions/.env file"
fi

echo "✅ Environment variables updated!"
