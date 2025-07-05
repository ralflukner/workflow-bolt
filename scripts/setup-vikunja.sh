#!/bin/bash

# Vikunja Self-Hosted Setup Script
# Simple, stable project management for healthcare workflows

set -e

echo "🚀 Setting up Vikunja for Workflow-Bolt..."

# Create vikunja directory
VIKUNJA_DIR="$HOME/.workflow-bolt/vikunja"
mkdir -p "$VIKUNJA_DIR"
cd "$VIKUNJA_DIR"

# Detect architecture
ARCH=""
case "$(uname -m)" in
    x86_64) ARCH="amd64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) echo "❌ Unsupported architecture: $(uname -m)"; exit 1 ;;
esac

OS=""
case "$(uname -s)" in
    Linux) OS="linux" ;;
    Darwin) OS="darwin" ;;
    *) echo "❌ Unsupported OS: $(uname -s)"; exit 1 ;;
esac

echo "📦 Downloading Vikunja for $OS-$ARCH..."

# Download latest Vikunja binary
DOWNLOAD_URL="https://dl.vikunja.io/vikunja/0.22.1/vikunja-0.22.1-$OS-$ARCH"
curl -L -o vikunja "$DOWNLOAD_URL"
chmod +x vikunja

echo "⚙️  Creating Vikunja configuration..."

# Create config file
cat > config.yml << 'EOF'
service:
  # The URL of this service
  publicurl: "http://localhost:3456"
  # Path to where files are stored
  rootpath: ./files
  # Maximum file size for file uploads in bytes
  maxfilesize: 20MB

database:
  # Database type to use. Supported types are mysql, postgres and sqlite.
  type: "sqlite" 
  # Database path (for sqlite)
  path: "./vikunja.db"

cache:
  # Cache type. Possible values are "keyvalue", "memory" or "redis".
  type: "memory"
  
log:
  # A folder to store the logfiles in. Will be stored in the working directory if not provided.
  path: ./logs
  # The log level. Can be DEBUG, INFO, WARNING, ERROR, CRITICAL or OFF.
  level: "INFO"

cors:
  # Whether to enable or disable cors headers.
  enable: true
  # A list of origins which may access the Vikunja API
  origins:
    - "http://localhost:5173"
    - "http://localhost:3456"

auth:
  # Local authentication options
  local:
    # Whether to enable local authentication.
    enabled: true

mailer:
  # Whether to enable the mailer or not.
  enabled: false

legal:
  # Legal urls
  imprinturl: ""
  privacyurl: ""

# Task attachment settings
files:
  # The path where files are stored
  basepath: ./files
  # The maximum size of a file, as a human-readable string.
  maxsize: 20MB

# API rate limiting
ratelimit:
  enabled: false

# Metrics collection (disabled for privacy)
metrics:
  enabled: false

# Background tasks
backgroundtasks:
  enabled: true

# Whether to enable the caldav endpoint or not
caldav:
  enabled: true

migration:
  # Whether to automatically run database migrations on startup or not.
  automigrate: true

# Avatar settings  
avatar:
  # Whether to enable avatars or not.
  enabled: true
  # The way avatars are generated. Possible values are `gravatar`, `initials`, `upload` or `default`.
  gravatarexpiration: 3600

defaultsettings:
  # The avatar source for new users. Can be `gravatar`, `initials`, `upload` or `default`.
  avatar_provider: "initials"
  # The default timezone for new users.
  timezone: "America/New_York"
  # Week start day. `0` = Sunday, `1` = Monday and so on.
  week_start: 1

keyvalue:
  # The type of the keyvalue store. Possible values are `memory` or `redis`.
  type: "memory"
EOF

echo "🗂️  Creating data directories..."
mkdir -p files logs

echo "🔧 Creating startup script..."
cat > start-vikunja.sh << 'EOF'
#!/bin/bash
cd "$HOME/.workflow-bolt/vikunja"
echo "🚀 Starting Vikunja on http://localhost:3456"
echo "📊 Dashboard: http://localhost:3456"
echo "🔧 Stop with Ctrl+C"
./vikunja
EOF
chmod +x start-vikunja.sh

echo "🛑 Creating stop script..."
cat > stop-vikunja.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Vikunja..."
pkill -f "vikunja" || echo "No Vikunja process found"
echo "✅ Vikunja stopped"
EOF
chmod +x stop-vikunja.sh

echo "🎯 Creating quick access script..."
cat > "$HOME/.workflow-bolt/vikunja-admin.sh" << 'EOF'
#!/bin/bash
VIKUNJA_DIR="$HOME/.workflow-bolt/vikunja"

case "$1" in
    start)
        echo "🚀 Starting Vikunja..."
        cd "$VIKUNJA_DIR" && ./start-vikunja.sh
        ;;
    stop)
        cd "$VIKUNJA_DIR" && ./stop-vikunja.sh
        ;;
    restart)
        cd "$VIKUNJA_DIR" && ./stop-vikunja.sh
        sleep 2
        cd "$VIKUNJA_DIR" && ./start-vikunja.sh
        ;;
    status)
        if pgrep -f "vikunja" > /dev/null; then
            echo "✅ Vikunja is running on http://localhost:3456"
        else
            echo "❌ Vikunja is not running"
        fi
        ;;
    logs)
        tail -f "$VIKUNJA_DIR/logs/vikunja.log" 2>/dev/null || echo "No logs yet"
        ;;
    backup)
        BACKUP_DIR="$HOME/.workflow-bolt/backups/vikunja-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp "$VIKUNJA_DIR/vikunja.db" "$BACKUP_DIR/"
        cp -r "$VIKUNJA_DIR/files" "$BACKUP_DIR/" 2>/dev/null || true
        echo "📦 Backup created: $BACKUP_DIR"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backup}"
        echo ""
        echo "🚀 Start:   vikunja-admin.sh start"
        echo "🛑 Stop:    vikunja-admin.sh stop"
        echo "🔄 Restart: vikunja-admin.sh restart"
        echo "📊 Status:  vikunja-admin.sh status"
        echo "📝 Logs:    vikunja-admin.sh logs"
        echo "📦 Backup:  vikunja-admin.sh backup"
        ;;
esac
EOF
chmod +x "$HOME/.workflow-bolt/vikunja-admin.sh"

echo ""
echo "✅ Vikunja setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start Vikunja:  $HOME/.workflow-bolt/vikunja-admin.sh start"
echo "2. Open browser:   http://localhost:3456"
echo "3. Create account: (first user becomes admin)"
echo "4. Create project: 'Patient Workflows'"
echo ""
echo "🔧 Management commands:"
echo "   vikunja-admin.sh {start|stop|restart|status|logs|backup}"
echo ""
echo "📁 Data location: $VIKUNJA_DIR"
echo "💾 Database: $VIKUNJA_DIR/vikunja.db"
echo ""