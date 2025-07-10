# Cloud Functions ↔ Redis (Memorystore) Deployment Playbook

_Last updated: 2025-07-04_

This playbook captures the real-world steps, setbacks, and fixes we went through while wiring a **Cloud Functions Gen 2** service to a **Google Cloud Memorystore (Redis)** instance.  Use it as living documentation so future engineers avoid the same potholes.

---

## 1. Context

| Item | Value |
|------|-------|
| Redis instance | 10.161.35.147:6379 (private IP, default VPC) |
| VPC Connector  | `redis-connector` (`us-central1`, **READY**) |
| Function name  | `test-redis-connection` (Gen 2, Python 3.11) |
| Source dir     | `workflow-bolt/redis-test-function/` |
| Dev machine    | macOS M3 MacBook Air (fan-less; avoid heavy local builds) |

---

## 2. What Went Wrong (Pitfalls)

| # | Symptom | Root Cause | Fix |
|---|---------|------------|-----|
| 1 | `main.py not found` | `--source` pointed to repo root instead of sub-dir | Use `--source .` inside the function dir, or provide absolute path |
| 2 | Container health-check failed | Deploy name `test-redis-connection` (hyphens) vs Python handler `test_redis_connection` (underscores) | Add `--entry-point test_redis_connection` flag |
| 3 | Endless directory gymnastics (`pwd`, `cd ..`) | Engineer lost track of current working dir | Fix once; stay in `redis-test-function/`; avoid repeated checks |
| 4 | Local `pip install` blocked (`externally-managed-environment`) | macOS system Python protected | Skip local pip, rely on Cloud Build container install |
| 5 | Over-tweaking flags after each failure | No log inspection step | Institute rule: _one deploy → read logs → decide_ |
| 6 | Cloud Run service 503 | VPC connector not attached / SA perms wrong | Ensure `--vpc-connector`, grant `roles/compute.networkUser` on connector |

---

## 3. Final Minimal Function

```python
# redis-test-function/main.py
import os, redis, json

REDIS_HOST = os.getenv("REDIS_HOST", "10.161.35.147")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

def test_redis_connection(request):
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        return ({"status": "success"}, 200)
    except Exception as e:
        return ({"status": "error", "message": str(e)}, 500)
```

`requirements.txt`

```
redis==5.0.1
```

---

## 4. Golden Deployment Command

```bash
cd redis-test-function
python3 -m py_compile main.py   # quick sanity check

gcloud functions deploy test-redis-connection \
  --gen2 \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source . \
  --entry-point test_redis_connection \
  --vpc-connector redis-connector \
  --set-env-vars REDIS_HOST=10.161.35.147,REDIS_PORT=6379 \
  --project luknerlumina-firebase \
  --verbosity=debug
```

---

## 5. Verification Steps

1. **Wait** for build → state **ACTIVE**.
2. Get URL & curl:
   ```bash
   URL=$(gcloud functions describe test-redis-connection \
         --region us-central1 --format='value(serviceConfig.uri)')
   curl -s "$URL" | jq
   # Expected → {"status":"success"}
   ```
3. Failure? Collect logs **before** redeploying:
   ```bash
   gcloud functions logs read test-redis-connection --region us-central1 --limit=50
   ```

---

## 6. Roll-out to Production Services

1. **Cloud Run service**
   ```bash
   gcloud run services update api \
     --vpc-connector redis-connector \
     --region us-central1
   ```
2. **Existing Gen 2 Cloud Functions**
   ```bash
   gcloud functions deploy checkCredentials \
     --gen2 --runtime nodejs20 --region us-central1 \
     --entry-point handler \
     --vpc-connector redis-connector \
     --update-env-vars REDIS_HOST=10.161.35.147,REDIS_PORT=6379
   ```
3. Add `/test-redis` endpoint to `api` for ongoing health checks.

---

## 7. Best Practices Learned

- **Single-threaded troubleshooting**: one change → one deploy → inspect logs.
- **Entry-point flag**: always set when handler differs from deploy name.
- **Env vars over hard-coding**: switch between staging/prod Redis without code edits.
- **Keep local workload light on MacBook Air**: Cloud Build does the heavy lifting.
- **Document as you go**: update this playbook after every major incident.

---

## 8. Next Actions

- [ ] Trim test function after production services verified.
- [ ] Add CI check ensuring `--vpc-connector` present in every `gcloud functions deploy` within scripts.
- [ ] Monitor Redis latency from Cloud Function (`redis.info()['latency']`).
