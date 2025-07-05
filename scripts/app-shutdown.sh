#!/bin/bash

# 🛑 Workflow Bolt Application Shutdown Script
# Gracefully stops all services in the correct order
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

echo -e "${BLUE}🛑 Shutting Down Workflow Bolt Application Stack${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Function to stop a service safely
stop_service() {
    local service_name="$1"
    local stop_command="$2"
    
    echo -n "Stopping $service_name... "
    if eval "$stop_command" &>/dev/null; then
        echo -e "${GREEN}✅ Stopped${NC}"
    else
        echo -e "${YELLOW}⚠️ Already stopped or failed${NC}"
    fi
}

# 1. Stop Development Server
echo -e "${BLUE}1. Stopping Development Server${NC}"
cd "$PROJECT_ROOT"

if [ -f ".dev-server.pid" ]; then
    DEV_PID=$(cat .dev-server.pid)
    if ps -p $DEV_PID >/dev/null 2>&1; then
        stop_service "Development Server" "kill $DEV_PID"
        rm -f .dev-server.pid
    else
        echo "Development server is not running"
        rm -f .dev-server.pid
    fi
else
    echo "No development server PID file found"
fi

# Also kill any remaining dev servers on port 5173
if lsof -ti:5173 >/dev/null 2>&1; then
    echo "Killing any remaining processes on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# 2. Stop Plane.so
echo -e "\n${BLUE}2. Stopping Plane.so${NC}"
PLANE_DIR="$HOME/plane-deployment"

if [ -d "$PLANE_DIR" ]; then
    cd "$PLANE_DIR"
    if [ -f "docker-compose.yml" ]; then
        stop_service "Plane.so Services" "docker-compose down"
    else
        echo "No docker-compose.yml found in $PLANE_DIR"
    fi
else
    echo "Plane.so directory not found: $PLANE_DIR"
fi

# 3. Stop Redis (optional - you might want to keep it running)
echo -e "\n${BLUE}3. Redis Management${NC}"
echo "Redis contains persistent data. Choose an option:"
echo "  1) Keep Redis running (recommended)"
echo "  2) Stop Redis (will lose in-memory data)"
echo "  3) Stop and remove Redis container (will lose ALL data)"

read -p "Enter choice (1-3) [default: 1]: " redis_choice
redis_choice=${redis_choice:-1}

case $redis_choice in
    1)
        echo "✅ Keeping Redis running for data persistence"
        ;;
    2)
        stop_service "Redis" "docker stop workflow-redis"
        ;;
    3)
        echo -e "${RED}⚠️ This will permanently delete all Redis data!${NC}"
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            stop_service "Redis" "docker stop workflow-redis"
            stop_service "Redis Container" "docker rm workflow-redis"
            echo -e "${YELLOW}Redis container removed. Data directory preserved at ~/workflow-bolt-data/redis${NC}"
        else
            echo "Redis removal cancelled"
        fi
        ;;
    *)
        echo "Invalid choice. Keeping Redis running."
        ;;
esac

# 4. Clean up temporary files
echo -e "\n${BLUE}4. Cleaning Up${NC}"
cd "$PROJECT_ROOT"

# Remove log files (optional)
if [ -d "logs" ]; then
    echo "Log files found. Clean up logs?"
    echo "  1) Keep logs"
    echo "  2) Archive logs" 
    echo "  3) Delete logs"
    
    read -p "Enter choice (1-3) [default: 1]: " log_choice
    log_choice=${log_choice:-1}
    
    case $log_choice in
        1)
            echo "✅ Keeping log files"
            ;;
        2)
            ARCHIVE_NAME="logs-$(date +%Y%m%d-%H%M%S).tar.gz"
            tar -czf "$ARCHIVE_NAME" logs/
            echo "✅ Logs archived to $ARCHIVE_NAME"
            rm -rf logs/*
            ;;
        3)
            rm -rf logs/*
            echo "✅ Log files deleted"
            ;;
    esac
fi

# Remove PID files
find . -name "*.pid" -delete 2>/dev/null || true

# 5. Final Status Check
echo -e "\n${BLUE}5. Final Status Check${NC}"
echo "========================"

# Check what's still running
echo "Remaining Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(workflow|plane)" || echo "  None related to workflow-bolt"

echo ""
echo "Port usage check:"
ports_to_check=(3000 5173 6379 8000 9001)
for port in "${ports_to_check[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        process=$(lsof -ti:$port | head -1)
        process_name=$(ps -p $process -o comm= 2>/dev/null || echo "unknown")
        echo "  Port $port: ⚠️ Still in use by $process_name (PID: $process)"
    else
        echo "  Port $port: ✅ Free"
    fi
done

echo ""
echo -e "${GREEN}🎉 Shutdown Complete!${NC}"
echo ""
echo -e "${BLUE}📋 What's Preserved:${NC}"
echo "  ✅ Redis data (if you chose to keep Redis running)"
echo "  ✅ Plane.so database (in Docker volumes)"
echo "  ✅ Project files and configurations"
echo ""
echo -e "${BLUE}🚀 To restart everything:${NC}"
echo "  $SCRIPT_DIR/app-startup.sh"
echo ""
echo -e "${BLUE}🧹 Complete cleanup (if needed):${NC}"
echo "  Docker: docker system prune -a"
echo "  Volumes: docker volume prune"
echo "  Redis data: rm -rf ~/workflow-bolt-data/redis"