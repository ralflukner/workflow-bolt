# 🚀 Workflow Bolt Application Management Guide

**Easy startup and shutdown for all services with persistent data**

## 📋 Quick Commands

```bash
# Start everything
./scripts/app-startup.sh

# Stop everything  
./scripts/app-shutdown.sh

# Setup (run once)
./scripts/local-redis-setup.sh
./scripts/setup-plane-so.sh
```

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │    Plane.so     │    │   Local Redis   │
│   Server        │    │   (Project Mgmt) │    │   (localhost)   │
│   :5173         │    │   :3000, :8000   │    │   :6379         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                        ┌─────────────────┐
                        │   Your Laptop   │
                        │  (All Local)    │
                        └─────────────────┘
```

## 🔧 **Services Breakdown**

### **1. Local Redis** (Port 6379)

- **Purpose**: Message queue, caching, real-time coordination
- **Data**: Persisted to `~/workflow-bolt-data/redis/`
- **Auto-restart**: ✅ Survives reboots (Docker restarts container)
- **Management**: `~/workflow-bolt-data/{start,stop,status}-redis.sh`

### **2. Plane.so Project Management** (Ports 3000, 8000)

- **Purpose**: Task management, multi-agent coordination
- **Data**: Persisted in Docker volumes
- **Auto-restart**: ✅ Docker compose with restart policies
- **Location**: `~/plane-deployment/`

### **3. Development Server** (Port 5173)

- **Purpose**: Hot-reload React development
- **Auto-restart**: ❌ Manual start (development only)
- **Logs**: `logs/dev-server.log`

## 🚀 **Startup Process**

### **Automatic Startup Order:**

1. ✅ Check Docker is running
2. ✅ Start Redis (or verify running)
3. ✅ Start Plane.so backend & frontend
4. ✅ Start development server (if needed)
5. ✅ Health check all services

### **After Laptop Reboot:**

```bash
# Just run this - everything else auto-starts with Docker
./scripts/app-startup.sh
```

## 🛑 **Shutdown Options**

### **Graceful Shutdown:**

```bash
./scripts/app-shutdown.sh
```

**Interactive options:**

- Keep Redis running (recommended)
- Archive/delete logs
- Preserve data vs clean slate

### **Emergency Stop:**

```bash
# Stop all Docker containers
docker stop $(docker ps -q)

# Kill development server
pkill -f "npm run dev"
```

## 💾 **Data Persistence**

### **What Survives Reboots:**

- ✅ **Redis data**: `~/workflow-bolt-data/redis/`
- ✅ **Plane.so database**: Docker volumes
- ✅ **Project files**: Your code repository
- ✅ **Configuration**: All setup scripts and configs

### **What Doesn't:**

- ❌ **Development server**: Needs manual restart
- ❌ **In-memory Redis data**: If Redis container restarts
- ❌ **Temporary logs**: Cleaned up on shutdown

## 🔍 **Health Monitoring**

### **Service Status:**

```bash
# Quick health check
./scripts/app-startup.sh  # Shows status even if already running

# Individual service checks
curl http://localhost:3000     # Plane.so frontend
curl http://localhost:8000/api/health/  # Plane.so backend
curl http://localhost:5173     # Development server
docker exec workflow-redis redis-cli ping  # Redis
```

### **Port Usage:**

- `3000` - Plane.so frontend
- `5173` - Development server
- `6379` - Redis
- `8000` - Plane.so backend API
- `9001` - Minio (file storage)

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **Docker not starting services:**

```bash
# Check Docker Desktop is running
docker info

# Restart Docker if needed (macOS)
# Docker Desktop → Restart

# Check container status
docker ps -a
```

#### **Port conflicts:**

```bash
# Find what's using a port
lsof -i :3000

# Kill process on port
lsof -ti:3000 | xargs kill -9
```

#### **Redis connection issues:**

```bash
# Test Redis connection
docker exec workflow-redis redis-cli ping

# Check Redis logs
docker logs workflow-redis

# Restart Redis
~/workflow-bolt-data/stop-redis.sh
~/workflow-bolt-data/start-redis.sh
```

#### **Plane.so not accessible:**

```bash
# Check Plane.so logs
cd ~/plane-deployment
docker-compose logs -f

# Restart Plane.so
docker-compose restart
```

## 🔄 **Update Process**

### **Application Updates:**

```bash
# 1. Stop services
./scripts/app-shutdown.sh

# 2. Pull latest code
git pull

# 3. Update dependencies if needed
npm install

# 4. Restart everything
./scripts/app-startup.sh
```

### **Service Updates:**

```bash
# Update Plane.so
cd ~/plane-deployment
docker-compose pull
docker-compose up -d

# Update Redis
docker pull redis:7-alpine
./scripts/local-redis-setup.sh  # Will recreate with new image
```

## 📊 **Resource Usage**

### **Typical Memory Usage:**

- Redis: ~50-100MB
- Plane.so: ~500MB-1GB
- Development server: ~200-500MB
- **Total**: ~1-2GB RAM

### **Disk Usage:**

- Redis data: <100MB (typical)
- Plane.so volumes: ~500MB-1GB
- Docker images: ~2-3GB
- **Total**: ~3-4GB disk

## ⚙️ **Configuration**

### **Environment Variables:**

Create `.env.local` for development overrides:

```bash
# Redis connection (local)
REDIS_URL=redis://localhost:6379

# Plane.so API (for agent integration)
PLANE_API_URL=http://localhost:8000/api/v1
PLANE_API_TOKEN=your_token_here
PLANE_WORKSPACE_ID=your_workspace_id
PLANE_PROJECT_ID=your_project_id
```

### **Auto-start on Boot (Optional):**

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Auto-start workflow-bolt services on terminal open
if [[ -z "$WORKFLOW_BOLT_STARTED" ]]; then
    export WORKFLOW_BOLT_STARTED=1
    ~/path/to/workflow-bolt/scripts/app-startup.sh
fi
```

## 🎯 **Best Practices**

### **Daily Workflow:**

1. **Morning**: Run `./scripts/app-startup.sh`
2. **Work**: Use Plane.so for task management
3. **Evening**: Run `./scripts/app-shutdown.sh` (optional)

### **Data Safety:**

- ✅ **Always** keep Redis running between sessions
- ✅ **Regular backups** of `~/workflow-bolt-data/`
- ✅ **Git commit** project changes frequently

### **Performance:**

- 🔄 Restart development server if it becomes slow
- 🧹 Periodically clean Docker: `docker system prune`
- 📊 Monitor resource usage: `docker stats`

## 📞 **Support**

### **If something breaks:**

1. Check this guide first
2. Run health checks: `./scripts/app-startup.sh`
3. Check service logs (commands shown in startup script)
4. Complete restart: `./scripts/app-shutdown.sh` → `./scripts/app-startup.sh`

### **Nuclear option (fresh start):**

```bash
# Complete cleanup (WILL DELETE ALL DATA)
./scripts/app-shutdown.sh
docker system prune -a -f
docker volume prune -f
rm -rf ~/workflow-bolt-data/
rm -rf ~/plane-deployment/

# Then setup again
./scripts/local-redis-setup.sh
./scripts/setup-plane-so.sh
```

---

**Remember**: The goal is **reliable, persistent services** that work after laptop reboots with minimal manual intervention. These scripts handle the complexity so you can focus on development.
