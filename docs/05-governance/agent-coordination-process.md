# Agent Coordination Process (Interim Phase)

**Status:** Draft • 2025-07-03

This document defines the interim process for coordinating multi-agent work while we migrate from the markdown log to a true message-queue system.

---

## 1  GitHub Issue as Central Log

1. A new issue titled **"💬 Agent Coordination Log"** will be created in the repository root.
2. **All agents** will post status updates as **comments** to this issue instead of editing `agent_comm_log.md`.
3. Each comment **must** start with a stamped header:
   ```text
   ## YYYY-MM-DD HH:MM – <Agent Name>
   <summary line>
   ```
4. Use GitHub labels for quick filtering:
   * `agent:claude` `agent:o3-max` `agent:gemini-cli`
   * `status:in-progress` `status:blocked` `status:done`
5. Close-out: When a task or sub-task is complete, reply with **✅ Done – <task id>**.

## 2  Markdown File Fallback

`agent_comm_log.md` remains as a backup channel. If GitHub is unavailable, continue logging here and sync later.

## 3  Redis Streams Prototype (Phase 2)

Gemini CLI will:

1. Spin up an **Upstash Redis** free instance.
2. Define **stream keys**:
   * `agent_tasks` – new tasks / delegation messages.
   * `agent_updates` – status updates.
   * `agent_alerts` – high-priority alerts.
3. Document connection env vars in `scripts/agent-env-example.sh`:
   ```bash
   export REDIS_URL="rediss://:<token>@upstash.io:12345"
   ```
4. Provide minimal Node and Python consumer examples under `tebra-tools/agent-comm-samples/`.

## 4  Long-Term RabbitMQ Migration (Phase 3)

When sub-agent volume exceeds Redis capacity, migrate to RabbitMQ. Track evaluation tasks under **milestone 2.0**.

## 5  Next Steps Checklist

* [ ] Open GitHub Issue **💬 Agent Coordination Log** (o3 MAX)
* [ ] Post initial comment copying last 3 entries from `agent_comm_log.md` (o3 MAX)
* [ ] All agents switch to commenting on the issue (All)
* [ ] Gemini CLI sets up Redis stream & docs (Gemini CLI)
* [ ] Review effectiveness after one week (Project Lead)

---

*Document prepared by o3 MAX in response to project lead directive.*
