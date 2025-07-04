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
