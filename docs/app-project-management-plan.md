# Redis Integration & Production Readiness Plan v2.0

Moving from validated infrastructure to production-grade Redis operations

---

## 🎯 Current State → Target State

- **Current:** ✅ VPC validated, test code removed, functions clean
- **Target:** Production Redis operations with monitoring, CI/CD, and shared client

---

## Phase 1: Shared Redis Client Module (Days 1-2)

### 1.1 Create Production Redis Client

```bash
mkdir -p functions/shared
cat > functions/shared/redis_client.py << 'EOF'
import redis
import os
import logging
from typing import Optional
from functools import wraps
import time

logger = logging.getLogger(__name__)

class RedisClient:
    _instance: Optional[redis.Redis] = None
    _pool: Optional[redis.ConnectionPool] = None
    @classmethod
    def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            cls._pool = redis.ConnectionPool(
                host=os.environ.get('REDIS_HOST', '10.161.35.147'),
                port=int(os.environ.get('REDIS_PORT', 6379)),
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                max_connections=50,
                health_check_interval=30,
                retry_on_timeout=True
            )
            cls._instance = redis.Redis(connection_pool=cls._pool)
            cls._instance.ping()
            logger.info("Redis connection pool initialized successfully")
        return cls._instance
    @classmethod
    def health_check(cls) -> dict:
        try:
            client = cls.get_client()
            start = time.time()
            result = client.ping()
            latency = (time.time() - start) * 1000
            return {
                "status": "healthy",
                "ping": "PONG" if result else "FAILED",
                "latency_ms": round(latency, 2),
                "connected_clients": client.info().get('connected_clients', 0)
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "type": type(e).__name__
            }
def with_redis_fallback(fallback_value=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except redis.RedisError as e:
                logger.error(f"Redis operation failed in {func.__name__}: {e}")
                return fallback_value
        return wrapper
    return decorator
EOF
```

### 1.2 Create Unit and Integration Tests

```bash
touch functions/shared/test_redis_client.py
cat > functions/shared/test_redis_client.py << 'EOF'
import pytest
from unittest.mock import patch, MagicMock
import redis
from shared.redis_client import RedisClient, with_redis_fallback
class TestRedisClient:
    @patch('redis.Redis')
    def test_singleton_pattern(self, mock_redis):
        client1 = RedisClient.get_client()
        client2 = RedisClient.get_client()
        assert client1 is client2
    @patch('redis.Redis')
    def test_health_check_success(self, mock_redis):
        mock_instance = MagicMock()
        mock_instance.ping.return_value = True
        mock_instance.info.return_value = {'connected_clients': 5}
        mock_redis.return_value = mock_instance
        result = RedisClient.health_check()
        assert result['status'] == 'healthy'
        assert result['ping'] == 'PONG'
        assert 'latency_ms' in result
    def test_fallback_decorator(self):
        @with_redis_fallback(fallback_value="default")
        def failing_operation():
            raise redis.RedisError("Connection failed")
        result = failing_operation()
        assert result == "default"
EOF

cat > functions/shared/test_redis_integration.py << 'EOF'
import os
import pytest
from shared.redis_client import RedisClient
@pytest.mark.integration
def test_real_redis_connection():
    if not os.environ.get('REDIS_HOST'):
        pytest.skip("REDIS_HOST not set")
    client = RedisClient.get_client()
    assert client.ping() == True
    client.set('test_key', 'test_value', ex=60)
    assert client.get('test_key') == 'test_value'
    client.delete('test_key')
    health = RedisClient.health_check()
    assert health['status'] == 'healthy'
    assert health['latency_ms'] < 100
EOF

make test NAME=shared
```

---

## Phase 2: Function Integration (Days 3-4)

### 2.1 Update Functions to Use Shared Client

- Refactor all functions (e.g., `tebra_debug`, `patient_sync`) to import and use `RedisClient`.
- Add `/redis-health` endpoint using `RedisClient.health_check()`.
- Use `with_redis_fallback` for all Redis operations.

### 2.2 Deploy and Validate

```bash
make deploy NAME=tebra_debug VPC_CONNECTOR=redis-connector
make deploy NAME=patient_sync VPC_CONNECTOR=redis-connector
# Test health endpoint
FUNCTION_URL=$(gcloud functions describe tebra_debug --gen2 --region=us-central1 --format="value(serviceConfig.uri)")
curl -s "$FUNCTION_URL/redis-health" | jq
# Expect: {"status":"healthy","ping":"PONG","latency_ms":X.X}
```

---

## Phase 3: Monitoring & Alerting (Days 5-6)

### 3.1 Create Alert Policies

- Use Terraform to create alert policies for Redis connection failures and high latency.
- Add custom metrics logging in `redis_client.py` for operation duration and errors.

### 3.2 Validate Monitoring

- Trigger both positive and negative Redis operations and confirm alerts fire as expected.
- Document alert policy IDs and test results in `docs/monitoring-validation.log`.

---

## Phase 4: CI/CD Automation (Day 7)

### 4.1 Implement GitHub Actions Workflow

- Add `.github/workflows/deploy-functions.yml` to automate tests, deploys, and validation.
- Ensure all deploys use the Makefile and VPC connector.

### 4.2 Pre-commit Hooks

- Ensure `.pre-commit-config.yaml` enforces linting, formatting, and no debug/test code in production.

---

## 📊 Success Metrics & Validation Gates

- Shared Redis client created and tested
- All functions use shared client
- Unit/integration tests >90% coverage
- Monitoring/alerting configured and tested
- CI/CD pipeline working
- No test/debug code in production
- Documentation and runbooks updated

---

## 📝 Daily Standup Template

```markdown
## Date: ____
### Completed
- [ ] Task: _______
### In Progress  
- [ ] Task: _______ (X% complete)
### Blockers
- [ ] Issue: _______
### Today's Goal
- [ ] Complete: _______
### Metrics
- Redis latency: ___ms
- Error rate: ___%
- Test coverage: ___%
```

---

## 📋 Summary Table

| Phase         | Task/Goal                        | Status      |
|--------------|-----------------------------------|-------------|
| Phase 1      | Shared Redis client, tests        | ⬜           |
| Phase 2      | Function integration, health      | ⬜           |
| Phase 3      | Monitoring/alerting               | ⬜           |
| Phase 4      | CI/CD, pre-commit, docs           | ⬜           |

---

## 🚦 Next Immediate Action

**Create `functions/shared/redis_client.py`, implement tests, and run `make test NAME=shared`.**

---
**This plan is actionable, auditable, and ready for team adoption.**
