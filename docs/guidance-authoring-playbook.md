# Guidance-Authoring Playbook v3.0

_The definitive standard for writing production-grade technical instructions, validation protocols, and operational procedures in workflow-bolt._

---

## 🚀 Quick Start Templates

**For Redis/VPC Verification:**

```bash
make test-redis FUNC=<function_name>                # Positive test
make test-redis FUNC=<function_name> REDIS_IP=192.168.99.99  # Negative test
make clean-test-code FUNC=<function_name>           # Cleanup
```

**For Function Deployment:**

```bash
make deploy NAME=<function> VPC_CONNECTOR=redis-connector
make validate NAME=<function>
make rollback NAME=<function>  # If issues
```

---

## 📋 Universal Pre-Flight Checklist

Before ANY production change:

- Current state documented (`git status`, `gcloud functions list`)
- Rollback plan ready
- Change window approved (if applicable)
- Monitoring dashboard open
- Test in dev/staging first

---

## 🎯 Core Principles (Enhanced)

### 1. Test Pyramid

```
Unit Tests → Integration Tests → E2E Tests → Negative Tests → Load Tests
     ↓              ↓                ↓              ↓            ↓
  Fast/Many    Medium/Some      Slow/Few      Critical      Pre-prod
```

### 2. Context Hierarchy

```
WHERE: Project root → Cloud Shell → Container → Production
WHEN: Dev hours → Maintenance window → Emergency
WHO: Developer → DevOps → SRE
```

### 3. Success/Failure Matrix

| Test Type | Success Criteria | Failure Criteria | Action on Failure |
|-----------|-----------------|------------------|------------------|
| Positive  | Expected output + 200 OK | Any deviation | Debug → Retry → Escalate |
| Negative  | Expected error + proper log | Success when should fail | CRITICAL: Stop all work |
| Load      | <100ms p99, 0 errors | Timeouts, errors | Scale → Optimize → Defer |

### 4. The 3R Rule

- **Repeatable:** Same result every time
- **Reversible:** Can undo/rollback
- **Recorded:** Logged and auditable

---

## 📝 Enhanced Command Template

```markdown
### [SEVERITY: LOW|MEDIUM|HIGH|CRITICAL] Task Name

**Context:** 
- WHERE: <exact location>
- WHEN: <time constraints>
- DURATION: <estimated time>
- RISK: <what could go wrong>

**Pre-requisites:**
```bash
# Verify state before proceeding
command-to-check-prerequisites
# Expected: <output>
```

**Main Execution:**

```bash
# Step 1: <purpose> [SAFE|MODIFIES|DANGEROUS]
tested-command-here
# Expected output:
# <exact expected output>
# Time: ~10s

# Step 2: Validate change
validation-command
# Expected: <success indicator>
```

**Rollback Plan:**

```bash
# If anything goes wrong:
rollback-command
# Verify rollback:
verification-command
```

**Post-Validation:**

- Logs clean
- Metrics normal
- No alerts firing
- Document completed

```

---
## 🔒 Security Considerations

### Secrets Handling
```bash
# NEVER hardcode secrets
BAD:  redis.Redis(password="actual-password")
GOOD: redis.Redis(password=os.environ.get('REDIS_PASSWORD'))

# Use Secret Manager
gcloud secrets versions access latest --secret="redis-password"
```

**Access Control**

- Always use least privilege
- Service accounts > personal accounts
- Time-bound access when possible

---

## 🧪 Comprehensive Testing Guide

### 1. Positive Test (Happy Path)

```bash
curl -X POST $URL -d '{"valid":"data"}'
# Expect: 200 OK, {"status":"success"}
```

### 2. Negative Tests (REQUIRED)

```bash
# Test A: Invalid input
curl -X POST $URL -d '{"invalid"}'
# Expect: 400 Bad Request

# Test B: Wrong config
REDIS_IP=999.999.999.999 make deploy NAME=func
# Expect: Connection error in logs

# Test C: Missing permissions
gcloud auth revoke && curl $URL
# Expect: 403 Forbidden
```

### 3. Edge Cases

```bash
# Concurrent requests
for i in {1..10}; do curl $URL & done; wait
# Expect: All succeed, no race conditions

# Large payload
curl -X POST $URL -d @10mb-file.json
# Expect: 413 or successful processing
```

---

## 📊 Monitoring & Alerting Setup

**Required Metrics**

```yaml
alerts:
  - name: "Function Error Rate"
    condition: error_rate > 1%
    duration: 5m
    severity: WARNING
    
  - name: "Redis Connection Failed"
    condition: log_match("Redis.*failed")
    duration: 1m
    severity: CRITICAL
    
  - name: "High Latency"
    condition: p95_latency > 1s
    duration: 10m
    severity: WARNING
```

**Dashboard Elements**

- Request rate
- Error rate
- Latency (p50, p95, p99)
- Redis connection status
- VPC connector health

---

## 🚨 Troubleshooting Matrix

| Symptom         | Likely Cause         | Quick Check                | Fix                        |
|-----------------|---------------------|----------------------------|----------------------------|
| 404 Not Found   | Function not deployed| gcloud functions list      | make deploy                |
| 403 Forbidden   | No auth/wrong auth   | gcloud auth list           | Add auth header            |
| 500 Internal    | Code error           | Check logs                 | Fix code, redeploy         |
| Timeout         | Cold start/network   | Check metrics              | Increase timeout/memory    |
| No logs         | Wrong filter         | Remove filters             | Check all log streams      |

---

## ✅ Production Readiness Checklist v3

**Code Quality**

- [ ] All tests passing (unit, integration, e2e)
- [ ] No hardcoded secrets/IPs
- [ ] Error handling comprehensive
- [ ] Logging at appropriate levels
- [ ] No debug/test code in production

**Infrastructure**

- [ ] VPC connector attached and tested
- [ ] Proper IAM roles assigned
- [ ] Secrets in Secret Manager
- [ ] Backup/DR plan documented
- [ ] Resource limits configured

**Operations**

- [ ] Monitoring dashboards created
- [ ] Alert policies configured and tested
- [ ] Runbooks documented
- [ ] CI/CD pipeline working
- [ ] Rollback procedure tested

**Validation**

- [ ] Positive tests: 100% pass
- [ ] Negative tests: Proper error handling confirmed
- [ ] Load test: Meets SLA requirements
- [ ] Security scan: No critical issues
- [ ] Documentation: Complete and accurate

**Sign-off**

- [ ] Code reviewed by: ____________
- [ ] Tested by: ____________
- [ ] Approved by: ____________
- [ ] Deployed on: ____________

---

## 📚 Documentation Requirements

Every Change Must Include:

- **What:** Clear description of change
- **Why:** Business/technical justification
- **How:** Step-by-step procedure followed
- **When:** Timestamp and duration
- **Who:** Person responsible
- **Results:** Actual vs expected outcomes
- **Issues:** Any problems and resolutions
- **Next Steps:** Follow-up actions required

**Example Log Entry:**

```markdown
## 2025-01-05 Redis VPC Verification
**What**: Verified Redis connectivity via VPC for patient_sync, tebra_debug
**Why**: Required for secure database access per security audit
**How**: See commands in vpc-verification.log
**Duration**: 45 minutes
**By**: DevOps Team
**Results**: 
- ✅ 8/8 positive tests passed
- ✅ 2/2 negative tests properly failed
- ✅ Both functions operational
**Issues**: Initial module-level logging not visible; switched to print()
**Next**: Remove test code, implement production Redis client
```

---

## 🎯 Quick Decision Tree

```
Is this change critical?
├─ YES → Do you have rollback plan?
│   ├─ YES → Proceed with caution
│   └─ NO → STOP. Create rollback plan first
└─ NO → Is it tested in dev?
    ├─ YES → Schedule for maintenance window  
    └─ NO → Test in dev first
```

---

## 📌 Remember

"In production, paranoia is professionalism."

- Test everything twice
- Document everything once
- Assume nothing
- Verify everything
- Always have a rollback plan
- When in doubt, don't deploy

**Version:** 3.0
**Last Updated:** 2025-01-05
**Status:** Active Production Standard
