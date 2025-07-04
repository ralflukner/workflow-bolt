#!/bin/bash
set -euo pipefail

NAME="$1"
FUNC_DIR="functions/$NAME"
TEST_DIR="tests/$NAME"

# Create function directory
mkdir -p "$FUNC_DIR"

# Create main.py with template
cat > "$FUNC_DIR/main.py" << 'PYCODE'
import functions_framework
import json
import logging

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@functions_framework.http
def FUNCTION_NAME(request):
    """
    HTTP Cloud Function template.
    
    Args:
        request: Flask Request object
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        # Parse request
        request_json = request.get_json(silent=True)
        request_args = request.args
        
        # Log incoming request
        logger.info(f"Received request", extra={
            "method": request.method,
            "path": request.path,
            "args": dict(request_args),
            "json": request_json
        })
        
        # TODO: Implement your logic here
        response = {
            "status": "success",
            "message": f"Hello from FUNCTION_NAME!",
            "request_data": request_json
        }
        
        return response, 200
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}, 500
PYCODE

# Replace FUNCTION_NAME with actual name
sed -i.bak "s/FUNCTION_NAME/$NAME/g" "$FUNC_DIR/main.py" && rm "$FUNC_DIR/main.py.bak"

# Create requirements.txt
cat > "$FUNC_DIR/requirements.txt" << 'REQS'
functions-framework==3.*
# Add your production dependencies here
REQS

# Create test directory and file
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/test_main.py" << 'TESTCODE'
import sys
import os
import pytest
import json

# Add function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), f'../../functions/FUNCTION_NAME'))

from main import FUNCTION_NAME

class MockRequest:
    def __init__(self, json_data=None, args=None, method='POST'):
        self._json = json_data
        self.args = args or {}
        self.method = method
        self.path = '/test'
    
    def get_json(self, silent=False):
        return self._json

def test_FUNCTION_NAME_success():
    """Test successful request"""
    request = MockRequest(json_data={"test": "data"})
    response, status = FUNCTION_NAME(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert "Hello from FUNCTION_NAME!" in response["message"]

def test_FUNCTION_NAME_no_data():
    """Test request with no data"""
    request = MockRequest()
    response, status = FUNCTION_NAME(request)
    
    assert status == 200
    assert response["status"] == "success"

# Add more tests as needed
TESTCODE

# Replace FUNCTION_NAME in test file
sed -i.bak "s/FUNCTION_NAME/$NAME/g" "$TEST_DIR/test_main.py" && rm "$TEST_DIR/test_main.py.bak"

echo "✅ Created function: $NAME"
echo "📁 Files created:"
echo "   - $FUNC_DIR/main.py"
echo "   - $FUNC_DIR/requirements.txt"
echo "   - $TEST_DIR/test_main.py"