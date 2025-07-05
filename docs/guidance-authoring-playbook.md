# Guidance-Authoring Playbook

_A lightweight checklist for writing bullet-proof technical instructions in the workflow-bolt repo._

---
## Quick Checklist (TL;DR)
✅ Test commands → Context → Expected output → Fallback → Troubleshooting

---
## Core Principles

### 1. Test First, Write Second
```bash
# ❌ Don't guess
# gcloud functions list --region us-central1  # wrong flag for CF list

# ✅ Tested
gcloud functions list --filter="location:us-central1" --format="table(name,location,state)"
```

### 2. Context is King
```
Context: Local machine with gcloud auth (project: luknerlumina-firebase)
Context: Inside Cloud Function container (has VPC access)
Context: Cloud Shell (no VPC access to private IPs)
```

### 3. Show Success Criteria
```bash
gcloud functions describe tebra_debug --gen2 --region=us-central1 \
  --format="value(serviceConfig.vpcConnector)"
# Expect: projects/PROJECT/locations/us-central1/connectors/redis-connector
# If blank → redeploy with --vpc-connector
```

### 4. Progressive Verification
1. **READ** – list resources (always safe)  
2. **INSPECT** – describe config (safe)  
3. **TEST** – runtime curl or unit test (safe)  
4. **MODIFY** – deploy / update (requires confirmation)

---
## Command-Snippet Template
```markdown
### <Task Name> — <one-line description>

**Context:** <where to run>

```bash
# Purpose: <why>
<TESTED COMMAND>
# Expect:
# <exact output>

# Fallback if above fails
<ALTERNATIVE COMMAND>
```

Troubleshooting:
Error: <exact error> → Fix: <exact command>
Blank output → Check: <what to verify>
```

---
## 🚨 Common Pitfalls & Fixes
| Issue | Wrong | Right |
|-------|-------|-------|
| Region flag on `gcloud functions list` | `--region us-central1` | `--filter="location:us-central1"` |
| Gen-2 describe | `gcloud functions describe FUNC` | `gcloud functions describe FUNC --gen2 --region=us-central1` |
| VPC test from wrong place | Curl from Cloud Shell | Curl from function endpoint `/redis-health` |
| Auth header missing | `curl $URL` | `curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" $URL` |

---
## ✅ Success Criteria Block
```markdown
**Success:** All functions show VPC connector and `/redis-health` returns `{"ping":"PONG"}`
**Next:** Update docs/vpc-verification.log and commit ✔
```

---
## 📝 Complete Mini-Guide Example
```markdown
### Verify Redis Connectivity

**Context:** Local shell with gcloud CLI

```bash
# 1. List functions in target region
FUNCTIONS=$(gcloud functions list --filter="location:us-central1" --format="value(name)")

# 2. Loop through each function and verify connector
for FUNC in $FUNCTIONS; do
  echo -n "$FUNC → "
  gcloud functions describe "$FUNC" --gen2 --region=us-central1 \
    --format="value(serviceConfig.vpcConnector)"
done
# Expect each line to print redis-connector path

# 3. Runtime ping via /redis-health (replace URL)
curl -s https://tebra-debug-XXXXX-uc.a.run.app/redis-health | jq
# Expect {"status":"success","ping":"PONG"}
```

Troubleshooting:
• Empty connector → `make deploy NAME=$FUNC VPC_CONNECTOR=redis-connector`  
• 404 on `/redis-health` → add temporary route as shown in playbook.

**Success:** VPC verified.
```

---
Use this v2 playbook when drafting any runbook, guide, or chat response so that instructions are immediately executable and self-healing.

---
## 1. Dry-Run Everything
Paste each command into a sandbox first, copy the _exact_ line that works—no ellipses, no typos.

## 2. Name the Execution Context
Specify where the command should run.
```
Context: local Mac shell with gcloud auth (project = luknerlumina-firebase)
```
Or
```
Context: Cloud Shell (in-VPC)
```

## 3. Show Expected Output Snippet
```bash
# Verify functions in us-central1
gcloud functions list --filter="location:us-central1" \
  --format="table(name,location,state)"
# Expect
# NAME           LOCATION      STATE
# patient_sync   us-central1   ACTIVE
```

## 4. Provide a Fallback / Alt-Syntax
If the primary command fails, include a second proven line:
```bash
gcloud functions list --format="table(name,location,state)" | awk '$2=="us-central1"'
```

## 5. Explain the *Why*
One sentence before each block, e.g.:  _"Verify the VPC connector is attached to every Gen-2 function."_

## 6. Anticipate Top 3 Failure Modes
| Error | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| `unrecognized arguments: --region` | Wrong flag (`location` vs `region`) | Use filter or `awk` fallback |
| Empty `vpcConnector` | Flag omitted at deploy | `make deploy NAME=x VPC_CONNECTOR=redis-connector` |
| 401 from endpoint | Function is private | Add `Authorization: Bearer $(gcloud auth print-identity-token)` |

## 7. Progressive Verification
Start with read-only `list`, then `describe`, then runtime curl. Gate each step: _"If previous passes, continue..."_

## 8. Keep Commands Copy-Pastable
Variables in CAPS; avoid line wraps.

## 9. Record Success Criteria
End each section with a ✔ statement, e.g.:
> ✔ Mark task "VPC verification" complete when every function prints connector path and `/redis-health` returns `PONG`.

## 10. Update Docs & Project Plan
After executing, add the CLI transcript or summary to the docs (`cloud-functions-playbook-vX.md`) and tick the README project-plan box in the same commit.

---
**Use this playbook for all future guidance (VPC checks, CI setup, HIPAA audits) to keep instructions accurate and unblock the team fast.** 