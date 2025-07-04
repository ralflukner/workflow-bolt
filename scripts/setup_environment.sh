#!/bin/bash
set -euo pipefail

echo "🚀 Cloud Functions Setup v5.2"
echo "============================"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
REPO_NAME=$(basename "$REPO_ROOT")

# Check prerequisites
MISSING_TOOLS=()
for tool in python3 gcloud docker jq; do
    command -v $tool >/dev/null || MISSING_TOOLS+=($tool)
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
    
    # Offer to install on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && command -v brew >/dev/null; then
        echo "📦 Installing via Homebrew..."
        brew install "${MISSING_TOOLS[@]}"
        
        # Update PATH for Homebrew on Apple Silicon
        if [[ -f /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        echo "Please install: ${MISSING_TOOLS[*]}"
        exit 1
    fi
fi

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker Desktop."
    echo "   Integration tests will fail without Docker."
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# Create venv
cd "$REPO_ROOT"
VENV_DIR=".venv-$REPO_NAME"
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install -q -U pip wheel
fi

# Create test dependencies file
mkdir -p tests
cat > tests/requirements-dev.txt << 'DEVREQS'
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-timeout>=2.1.0
requests-mock>=1.9.0
flake8>=7.0.0
isort>=5.13.0
black>=23.12.0
pre-commit>=3.5.0
DEVREQS

# Install dev dependencies
echo "📦 Installing development dependencies..."
"$VENV_DIR/bin/pip" install -q -r tests/requirements-dev.txt

# Setup pre-commit if config exists
if [ -f .pre-commit-config.yaml ]; then
    echo "🔧 Setting up pre-commit hooks..."
    "$VENV_DIR/bin/pre-commit" install
    "$VENV_DIR/bin/pre-commit" install --hook-type pre-push
fi

# Create directory structure
echo "📁 Creating project structure..."
mkdir -p functions tests/hello_world_sample scripts terraform/modules docs

# Create a simple test function
echo "🧪 Creating test function..."
mkdir -p functions/hello_world_sample
cat > functions/hello_world_sample/main.py << 'FUNC'
import json

def hello_world_sample(request):
    """Simple test function"""
    return {"status": "success", "message": "Hello World!"}, 200
FUNC

cat > functions/hello_world_sample/requirements.txt << 'REQS'
# Production dependencies only
REQS

# Create test for sample function
cat > tests/hello_world_sample/test_main.py << 'TEST'
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../functions/hello_world_sample'))

from main import hello_world_sample

def test_hello_world():
    class MockRequest:
        pass
    
    result, status = hello_world_sample(MockRequest())
    assert status == 200
    assert result["status"] == "success"
TEST

# Run test
echo "🧪 Testing hello_world_sample..."
cd "$REPO_ROOT"
if "$VENV_DIR/bin/python" -m pytest tests/hello_world_sample/test_main.py -v; then
    echo "✅ Tests PASSED"
else
    echo "❌ Tests FAILED"
    exit 1
fi

# Success message
cat << 'SUCCESS'

✅ Setup complete!

📚 Quick Start:
   make deploy NAME=hello_world_sample   # Deploy the sample
   make logs NAME=hello_world_sample     # View logs
   make new NAME=my_function            # Create your function
   make destroy NAME=hello_world_sample  # Clean up

💰 Cost Reminder:
   • First 2M invocations/month: FREE
   • Compute time: First 400,000 GB-seconds free

SUCCESS

if docker info >/dev/null 2>&1; then
    echo "🐳 Docker: ✅ Running"
else
    echo "🐳 Docker: ❌ Not running (start for integration tests)"
fi

echo ""