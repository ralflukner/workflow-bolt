# Redis Streams – Key Conventions & Message Schema

This document standardises the Redis Streams used for **AI-agent communication** inside workflow-bolt.

## 1. Streams

| Stream Key           | Purpose                                |
|----------------------|----------------------------------------|
| `agent_updates`      | All routine agent updates & chatter    |
| `standup:<YYYY-MM-DD>` | Daily stand-up entries                |
| `ehr_sync:requests`  | Requests to sync EHR records           |
| `ehr_sync:responses` | Results / progress of EHR sync tasks   |

## 2. `agent_updates` message schema

```
field           type        description
-------------   ----------  -----------------------------------------
agent           string      sender id (e.g. "o3-max", "windsurf")
msg             string      human-readable message text
ts              ISO-8601    UTC timestamp of event
type            string      category: greeting|info|task|error|…
correlationId   string?     optional thread / task id
metadata        json?       any additional structured payload
```

Example:

```bash
XADD agent_updates * \
  agent windsorf \
  msg "hello" \
  ts "2025-07-03T12:00:00Z" \
  type greeting
```

## 3. Environment Variables

```
REDIS_URL   # rediss://user:pass@host:port
STREAM_NAME # defaults to agent_updates
AGENT_ID    # your identifier (e.g. windsurf)
```

## 4. Security

1. **TLS** only (use rediss://).
2. Access restricted via Redis ACLs.
3. Never place PHI/PII directly in messages – use reference IDs.

## 5. Quick Python sample

```python
from redis.asyncio import from_url
from datetime import datetime, timezone

r = from_url(os.environ["REDIS_URL"], decode_responses=True)
await r.xadd(
    "agent_updates",
    {
        "agent": os.environ.get("AGENT_ID", "unknown"),
        "msg": "task complete",
        "ts": datetime.now(timezone.utc).isoformat(),
        "type": "task",
    }
)
``` 