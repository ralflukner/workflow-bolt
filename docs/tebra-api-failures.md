# Tebra API – Failure Catalogue & Remediation Plan

*Last updated: 2025-06-15*

> **Scope**
> This document captures every known failure mode we have encountered while integrating with the **Tebra SOAP API** through the Cloud-Run proxy and Firebase Functions. It references the exact code paths, describes what currently works vs. what is broken, and tracks resolutions / open items.

---

## 1. Architecture Quick-View

```mermaid
flowchart LR
  subgraph Frontend (React)
    UI
  end
  subgraph Firebase
    A[Callable Fn\n(e.g. tebraGetPatient)]
    B[getSecret]
  end
  subgraph Cloud Run
    CR[PHP SOAP Proxy]
  end
  TE[Tebra SOAP API]
  SM[(Secret Manager)]

  UI -- httpsCallable --> A
  UI -- httpsCallable --> B
  A -- "X-API-Key + ID Token" --> CR
  B -- access --> SM
  CR -- SOAP --> TE
```

**Key repos / files**

- Firebase callable entry-points – `functions/index.js` (Node 22)
- Proxy client used by functions – `functions/src/tebra-proxy-client.js`
- Secret fetch helper – `functions/src/get-secret.ts`
- Cloud Run source (PHP) – see `docs/tebra-cloudrun-design.md`

---

## 2. Failure Log

| Date (UTC) | Component | Symptom | Root cause | Status |
|------------|-----------|---------|-----------|--------|
| **2025-06-15** | Developer CLI | `gcloud functions call getSecret …` returns **401** | Callable functions expect Firebase callable protocol + auth; `gcloud` sends plain HTTP | **WONT FIX** – use `httpsCallable` (see docs/tebra-functions-usage.md) |
| **2025-06-13** | Firebase build | `Cannot find module './src/get-secret'` during deploy | New TS file added but JS build/require path out of sync | **Fixed** – generated `functions/src/get-secret.js` and redeployed |
| **2025-06-11** | Cloud Run PHP | `0` appointments, empty payload | WSDL caching + tight time-outs inside container env | **Fixed** (see docs/TEBRA_DEBUGGING_RESOLUTION.md) |
| **2025-06-10** | SOAP API | `InternalServiceFault` on every operation | Tebra backend outage for account `work-flow@luknerclinic.com` (opened support ticket) | **External** – waiting on Tebra; temporary retry w/ Aledade credentials works |
| **2025-05-28** | Secret Manager | 404 on `tebra-cloud-run-url` secret | Secret not yet created in project | **Fixed** – secret added + IAM binding for Cloud Run SA |

---

## 3. What Currently Works

1. `getSecret` callable – successfully returns whitelisted secrets when invoked via Firebase client or Admin SDK.
2. `tebraTestConnection` callable – returns `success:true` after PHP fix (verifies Cloud Run ↔ Tebra basic connectivity).
3. Core patient/appointment/provider endpoints – function *if* Tebra returns non-fault response (i.e. works in staging after PHP SOAP tweaks).
4. Secret Manager to Cloud Run mapping – internal API key & WSDL credentials load correctly inside container.

---

## 4. Known Issues / Partial Failures

| ID | Area | Description | Severity | Owner | Ticket |
|----|------|-------------|----------|-------|--------|
| F-01 | Tebra backend | `InternalServiceFault` sporadically re-appears on large appointment date-ranges (>60 days). | HIGH | RBL | Open support ticket #112623 |
| F-02 | Rate Limits | We hit **HTTP 429** when bulk-syncing >300 patients. Need adaptive back-off & queue. | MED | TBD | GH issue #87 |
| F-03 | Monitoring | No automatic alert if Cloud Run returns 5xx spike. | MED | DevOps | – |
| F-04 | Local dev UX | Confusion around CLI vs callable. | LOW | Docs | – |

---

## 5. Remediation & Roadmap

### Completed

- Disabled WSDL cache, extended timeouts, enabled GZIP (commit `prod-20250611`).
- Added Secret-Manager fallback in `tebra-proxy-client.js` (lines 15-50).
- Wrote comprehensive usage guide (`docs/tebra-functions-usage.md`).
- Implemented enhanced debugging system with correlation IDs and automated log analysis.

### In Flight (June to July 2025)

1. **Enhanced debugging** – Implemented comprehensive logging with correlation IDs, timing, and automated analysis (see `DEBUG-TOOLKIT.md`).
2. **Adaptive throttling** – Implement token-bucket limiter inside Firebase Functions wrapper, surface `retryAfter` in error payload.
3. **Observability** – Cloud Logging metrics filter for `severity>=ERROR` on `tebra-php-api`; alert policy "error rate >5% for 5 min".
4. **Integration tests in CI** – Use GitHub Actions to run a nightly end-to-end test hitting `tebraTestConnection` and alert Slack.

### Backlog

- Replace SOAP with Tebra forthcoming REST v3 (ETA Q4-2025).
- Streamline secrets: migrate remaining function env-vars into Secret Manager & Cloud Run config.
- Fail-open read-only cache for appointments when Tebra down.

---

## 6. How to Reproduce & Troubleshoot Common Failures

### 6.1 Unauthorized when calling `getSecret`

```bash
firebase login
node scripts/call-get-secret.mjs   # uses Admin SDK
# OR from browser – ensure user is logged-in
```

If the CLI call is necessary, run the command through the **Functions Emulator** instead.

### 6.2 Cloud Run returns HTTP 502

1. Look at Cloud Run > **Revisions** > Logs > `stderr`.
2. Typical stack trace means PHP libxml parse error; restart container or redeploy.

### 6.3 `InternalServiceFault` from Tebra

Run the minimal curl shown in `docs/tebra-support-ticket-revised.md` to verify outage is external.

---

## 7. References

- **Design doc** – `docs/tebra-cloudrun-design.md`
- **Debugging post-mortem** – `docs/TEBRA_DEBUGGING_RESOLUTION.md`
- **Support ticket** – `docs/tebra-support-ticket-revised.md`
- **Enhanced debugging toolkit** – `DEBUG-TOOLKIT.md`
