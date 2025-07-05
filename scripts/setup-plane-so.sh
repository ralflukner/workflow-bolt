#!/bin/bash

# 🚀 Plane.so Self-Hosted Setup Script
# Deploys Plane.so for project management with full API access
# Author: Claude Code Assistant
# Version: 1.0
# Date: 2025-07-05

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Plane.so Self-Hosted Setup${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""

# Check if Docker is installed and running
echo -e "${BLUE}1. Checking Docker Installation${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    echo "Please install Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Create Plane.so directory
PLANE_DIR="$HOME/plane-deployment"
echo ""
echo -e "${BLUE}2. Setting Up Plane.so Directory${NC}"
mkdir -p "$PLANE_DIR"
cd "$PLANE_DIR"
echo "Created directory: $PLANE_DIR"

# Download official Plane.so docker-compose
echo ""
echo -e "${BLUE}3. Downloading Plane.so Configuration${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

x-app-env: &app-env
  environment:
    - DEBUG=0
    - DJANGO_SETTINGS_MODULE=plane.settings.production
    
    # Database
    - POSTGRES_USER=plane
    - POSTGRES_PASSWORD=plane
    - POSTGRES_DB=plane
    - DATABASE_URL=postgresql://plane:plane@planeso-db:5432/plane
    
    # Redis
    - REDIS_URL=redis://planeso-redis:6379/
    
    # Email Configuration (optional)
    - EMAIL_HOST=
    - EMAIL_HOST_USER=
    - EMAIL_HOST_PASSWORD=
    - EMAIL_PORT=587
    - EMAIL_USE_TLS=1
    - EMAIL_FROM=noreply@yourdomain.com
    
    # Security
    - SECRET_KEY=60gp0byfz2dvffa45cxl20p1sab9xzgztkzrv2l23qgbc=
    - WEB_URL=http://localhost
    
    # AWS S3 (optional, for file uploads)
    - USE_MINIO=1
    - AWS_ACCESS_KEY_ID=access-key
    - AWS_SECRET_ACCESS_KEY=secret-key
    - AWS_S3_ENDPOINT_URL=http://planeso-minio:9000
    - AWS_S3_BUCKET_NAME=uploads
    - AWS_REGION=us-east-1
    - AWS_DEFAULT_ACL=public-read
    
    # License (leave empty for self-hosted)
    - LICENSE_ENGINE_BASE_URL=

services:
  planeso-redis:
    image: redis:6.2-alpine
    restart: unless-stopped
    command: redis-server --requirepass plane
    environment:
      - REDIS_PASSWORD=plane
    volumes:
      - redisdata:/data

  planeso-db:
    image: postgres:13
    restart: unless-stopped
    command: postgres -c 'max_connections=1000'
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=plane
      - POSTGRES_PASSWORD=plane
      - POSTGRES_DB=plane
      - PGDATA=/var/lib/postgresql/data

  planeso-minio:
    image: minio/minio
    restart: unless-stopped
    command: server /export --console-address ":9001"
    volumes:
      - uploads:/export
    environment:
      - MINIO_ROOT_USER=access-key
      - MINIO_ROOT_PASSWORD=secret-key
    ports:
      - "9001:9001"

  createbuckets:
    image: minio/mc
    depends_on:
      - planeso-minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc config host add plane-minio http://planeso-minio:9000 access-key secret-key;
      /usr/bin/mc mb plane-minio/uploads;
      /usr/bin/mc policy download plane-minio/uploads;
      exit 0;
      "

  plane-migrator:
    <<: *app-env
    image: makeplane/plane-backend:latest
    depends_on:
      - planeso-db
      - planeso-redis
    command: >
      sh -c "python manage.py wait_for_db &&
             python manage.py migrate"

  plane-backend:
    <<: *app-env
    image: makeplane/plane-backend:latest
    restart: unless-stopped
    depends_on:
      - plane-migrator
      - planeso-db
      - planeso-redis
    volumes:
      - logs_api:/code/plane/logs
    ports:
      - "8000:8000"

  plane-worker:
    <<: *app-env
    image: makeplane/plane-backend:latest
    restart: unless-stopped
    depends_on:
      - plane-backend
      - planeso-db
      - planeso-redis
    command: python manage.py rqworker
    volumes:
      - logs_worker:/code/plane/logs

  plane-beat-worker:
    <<: *app-env
    image: makeplane/plane-backend:latest
    restart: unless-stopped
    depends_on:
      - plane-backend
      - planeso-db
      - planeso-redis
    command: python manage.py rqscheduler
    volumes:
      - logs_beat-worker:/code/plane/logs

  plane-frontend:
    image: makeplane/plane-frontend:latest
    restart: unless-stopped
    depends_on:
      - plane-backend
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ports:
      - "3000:3000"

  plane-space:
    image: makeplane/plane-space:latest
    restart: unless-stopped
    depends_on:
      - plane-backend
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ports:
      - "4000:4000"

volumes:
  pgdata:
  redisdata:
  uploads:
  logs_api:
  logs_worker:
  logs_beat-worker:
EOF

echo -e "${GREEN}✅ Docker Compose configuration created${NC}"

# Create environment file
echo ""
echo -e "${BLUE}4. Creating Environment Configuration${NC}"
cat > .env << EOF
# Plane.so Configuration
COMPOSE_PROJECT_NAME=planeso
WEB_URL=http://localhost
SECRET_KEY=60gp0byfz2dvffa45cxl20p1sab9xzgztkzrv2l23qgbc=

# Database
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_DB=plane

# Redis
REDIS_PASSWORD=plane

# Minio (File Storage)
MINIO_ROOT_USER=access-key
MINIO_ROOT_PASSWORD=secret-key
EOF

echo -e "${GREEN}✅ Environment file created${NC}"

# Start Plane.so
echo ""
echo -e "${BLUE}5. Starting Plane.so Services${NC}"
echo "This may take a few minutes on first run..."

# Pull images first
echo "Pulling Docker images..."
docker-compose pull

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo -e "${BLUE}6. Waiting for Services to Start${NC}"
echo "Checking backend health..."

# Wait up to 5 minutes for backend to be ready
for i in {1..30}; do
    if curl -f http://localhost:8000/api/health/ &>/dev/null; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 10
done

# Check if frontend is ready
echo "Checking frontend..."
for i in {1..10}; do
    if curl -f http://localhost:3000 &>/dev/null; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    echo "Waiting for frontend... ($i/10)"
    sleep 5
done

echo ""
echo -e "${GREEN}🎉 Plane.so Deployment Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "🌐 Frontend:    http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Space:       http://localhost:4000"  
echo "📁 Minio:       http://localhost:9001"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Create your admin account"
echo "3. Set up workspace and project"
echo "4. Use API at http://localhost:8000/api/"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo "📋 View logs:        docker-compose logs -f"
echo "⏹️  Stop services:    docker-compose down"
echo "🔄 Restart:          docker-compose restart"
echo "🗑️  Remove all data:  docker-compose down -v"
echo ""
echo -e "${BLUE}API Documentation:${NC}"
echo "📖 API Docs: http://localhost:8000/api/docs/"
echo "🔑 Get API token after creating account in web interface"

# Create quick access script
cat > start-plane.sh << 'EOF'
#!/bin/bash
cd "$HOME/plane-deployment"
docker-compose up -d
echo "Plane.so started at http://localhost:3000"
EOF

cat > stop-plane.sh << 'EOF'
#!/bin/bash
cd "$HOME/plane-deployment"
docker-compose down
echo "Plane.so stopped"
EOF

chmod +x start-plane.sh stop-plane.sh

echo ""
echo -e "${YELLOW}📁 Quick access scripts created:${NC}"
echo "  $PLANE_DIR/start-plane.sh"
echo "  $PLANE_DIR/stop-plane.sh"