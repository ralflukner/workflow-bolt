#!/bin/bash

# 🚀 Workflow Bolt Application Startup Script
# Starts all services in the correct order with health checks
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Starting Workflow Bolt Application Stack${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local check_command="$2"
    
    echo -n "Checking $service_name... "
    if eval "$check_command" &>/dev/null; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local check_command="$2"
    local max_attempts="${3:-30}"
    
    echo "⏳ Waiting for $service_name to be ready..."
    for i in $(seq 1 $max_attempts); do
        if eval "$check_command" &>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo "  Attempt $i/$max_attempts..."
        sleep 2
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# 1. Check Docker
echo -e "${BLUE}1. Checking Docker${NC}"
if ! docker info &>/dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    echo "   macOS: Start Docker Desktop"
    echo "   Linux: sudo systemctl start docker"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# 2. Start Redis
echo -e "\n${BLUE}2. Starting Redis${NC}"
if check_service "Redis" "docker exec workflow-redis redis-cli ping | grep -q PONG"; then
    echo "Redis is already running"
else
    echo "Starting Redis container..."
    if [ -f "$HOME/workflow-bolt-data/start-redis.sh" ]; then
        bash "$HOME/workflow-bolt-data/start-redis.sh"
    else
        echo -e "${YELLOW}⚠️ Redis not set up. Run: $SCRIPT_DIR/local-redis-setup.sh${NC}"
        exit 1
    fi
    
    wait_for_service "Redis" "docker exec workflow-redis redis-cli ping | grep -q PONG" 15
fi

# 3. Start Plane.so
echo -e "\n${BLUE}3. Starting Plane.so Project Management${NC}"
PLANE_DIR="$HOME/plane-deployment"

if [ ! -d "$PLANE_DIR" ]; then
    echo -e "${YELLOW}⚠️ Plane.so not set up. Run: $SCRIPT_DIR/setup-plane-so.sh${NC}"
    exit 1
fi

cd "$PLANE_DIR"

# Check if Plane.so is already running
if check_service "Plane.so Frontend" "curl -sf http://localhost:3000 >/dev/null"; then
    echo "Plane.so is already running"
else
    echo "Starting Plane.so services..."
    docker-compose up -d
    
    # Wait for backend to be ready
    wait_for_service "Plane.so Backend" "curl -sf http://localhost:8000/api/health/ >/dev/null" 30
    
    # Wait for frontend to be ready  
    wait_for_service "Plane.so Frontend" "curl -sf http://localhost:3000 >/dev/null" 20
fi

# 4. Start Development Server (if in development)
echo -e "\n${BLUE}4. Development Server${NC}"
cd "$PROJECT_ROOT"

if [ -f "package.json" ] && [ -d "node_modules" ]; then
    if check_service "Development Server" "curl -sf http://localhost:5173 >/dev/null"; then
        echo "Development server is already running"
    else
        echo "Starting development server in background..."
        nohup npm run dev > logs/dev-server.log 2>&1 &
        echo $! > .dev-server.pid
        
        wait_for_service "Development Server" "curl -sf http://localhost:5173 >/dev/null" 15
    fi
else
    echo -e "${YELLOW}⚠️ Node.js dependencies not installed. Run: npm install${NC}"
fi

# 5. Health Check Summary
echo -e "\n${BLUE}5. Health Check Summary${NC}"
echo "=============================="

services=(
    "Redis:docker exec workflow-redis redis-cli ping | grep -q PONG"
    "Plane.so Backend:curl -sf http://localhost:8000/api/health/ >/dev/null"
    "Plane.so Frontend:curl -sf http://localhost:3000 >/dev/null"
    "Development Server:curl -sf http://localhost:5173 >/dev/null"
)

all_healthy=true
for service_check in "${services[@]}"; do
    service_name="${service_check%%:*}"
    check_command="${service_check#*:}"
    
    if ! check_service "$service_name" "$check_command"; then
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}🎉 All services are running successfully!${NC}"
else
    echo -e "${YELLOW}⚠️ Some services are not running. Check the logs above.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo "  🔧 Redis:           localhost:6379"
echo "  📊 Plane.so:        http://localhost:3000"
echo "  🔌 Plane.so API:    http://localhost:8000"
echo "  💻 Dev Server:      http://localhost:5173"
echo "  📁 Minio:           http://localhost:9001"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "  Plane.so: cd $PLANE_DIR && docker-compose logs -f"
echo "  Redis: docker logs -f workflow-redis"
echo "  Dev Server: tail -f $PROJECT_ROOT/logs/dev-server.log"
echo ""
echo -e "${BLUE}🛑 Shutdown:${NC}"
echo "  Run: $SCRIPT_DIR/app-shutdown.sh"