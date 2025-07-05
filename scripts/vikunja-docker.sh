#!/bin/bash

# Vikunja Docker Management Script
# Simple, reliable project management for healthcare workflows

DOCKER_COMPOSE_FILE="docker-compose.vikunja.yml"

case "$1" in
    start)
        echo "🚀 Starting Vikunja with Docker..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 15
        
        # Test if API is responding
        echo "🔍 Testing API connection..."
        for i in {1..30}; do
            if curl -s http://localhost:3456/api/v1/info > /dev/null; then
                echo "✅ Vikunja API is ready!"
                break
            fi
            echo "   Waiting... ($i/30)"
            sleep 2
        done
        
        echo ""
        echo "🎉 Vikunja is running!"
        echo "📊 Frontend: http://localhost:3456"
        echo "🔧 API: http://localhost:3456/api/v1"
        echo ""
        echo "📝 Next steps:"
        echo "1. Visit http://localhost:3456"
        echo "2. Create your admin account"
        echo "3. Go to Settings → API Tokens"
        echo "4. Create token and set: export VITE_VIKUNJA_TOKEN=your_token"
        ;;
        
    stop)
        echo "🛑 Stopping Vikunja..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        echo "✅ Vikunja stopped"
        ;;
        
    restart)
        echo "🔄 Restarting Vikunja..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        sleep 2
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        echo "✅ Vikunja restarted"
        ;;
        
    status)
        echo "📊 Vikunja Service Status:"
        echo ""
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        echo ""
        
        # Test API connectivity
        if curl -s http://localhost:3456/api/v1/info > /dev/null; then
            echo "✅ API Status: Running (http://localhost:3456)"
        else
            echo "❌ API Status: Not responding"
        fi
        ;;
        
    logs)
        echo "📝 Vikunja Logs:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
        
    backup)
        BACKUP_DIR="$HOME/.workflow-bolt/backups/vikunja-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        echo "📦 Creating Vikunja backup..."
        echo "🗄️  Backing up database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T vikunja-db pg_dump -U vikunja vikunja > "$BACKUP_DIR/vikunja-db.sql"
        
        echo "📁 Backing up files..."
        docker cp $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q vikunja):/app/vikunja/files "$BACKUP_DIR/" 2>/dev/null || echo "No files to backup"
        
        echo "✅ Backup created: $BACKUP_DIR"
        ;;
        
    clean)
        echo "🧹 Cleaning up Vikunja (THIS WILL DELETE ALL DATA)..."
        read -p "Are you sure? This will delete all projects and tasks. Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" down -v
            docker-compose -f "$DOCKER_COMPOSE_FILE" rm -f
            echo "✅ Vikunja data cleaned"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
        
    update)
        echo "🔄 Updating Vikunja to latest version..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" pull
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        echo "✅ Vikunja updated"
        ;;
        
    *)
        echo "Vikunja Docker Management"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|backup|clean|update}"
        echo ""
        echo "Commands:"
        echo "  start   - Start Vikunja services"
        echo "  stop    - Stop Vikunja services"
        echo "  restart - Restart Vikunja services"
        echo "  status  - Show service status"
        echo "  logs    - Show service logs"
        echo "  backup  - Create data backup"
        echo "  clean   - Remove all data (DESTRUCTIVE)"
        echo "  update  - Update to latest version"
        echo ""
        echo "URLs:"
        echo "  Frontend & API: http://localhost:3456"
        ;;
esac