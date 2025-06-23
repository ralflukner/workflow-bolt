# Tebra Appointment Sync – Debugging Progress Log

## Issue Summary

**Date:** June&nbsp;11,&nbsp;2025
**Problem:** Tebra SOAP proxy returning 0 appointments in Cloud Run, while local PHP scripts returned 8 appointments
**Status:** 🛠️&nbsp;IN&nbsp;PROGRESS

## Latest Progress (June 15, 2025)

- **Official Example Verified**: Running the exact Tebra PHP example locally returned real patient data (171+ records) proving credentials and API work.
- **Client Refactor**: `TebraHttpClient.php` updated to mirror the official pattern for `GetPatients`, `GetProviders`, and `GetAppointments`.
- **Deployment**: Deployed to Cloud Run (revision `tebra-php-api-00019-xs8`). HTTP 200 responses observed.
- **Current Blocker**: Tebra backend now returns `"Unable to find user."`—likely an account activation/username formatting issue on Tebra side. No infrastructure or code errors observed.

Next steps:

1. Confirm with Tebra support that the integration user is fully activated.
2. Validate username formatting (case-sensitivity, domain, etc.).
3. Once user issue is resolved, re-run end-to-end tests.

## 2025-06-22  syncSchedule returns 0 appointments even though Tebra shows data

**Symptom**

- UI shows "Today 0 / Tomorrow 0 appointments".
- Browser console & Cloud-Functions logs show the pipeline completes with `success:true`, but the payload from PHP → Tebra contains:

```json
{
  "success": true,
  "data": {
    "Appointments": null,
    "SecurityResponse": {
      "Authenticated": false,
      "Authorized": false,
      "CustomerKeyValid": true
    }
  }
}
```

**Root cause**  
Tebra SOAP rejects the *GetAppointments* request – `Authenticated:false`. Other calls (for example *GetProviders*) succeed, so the network is fine; the appointment call is missing or using wrong credentials.

**Verified flow**

1. SPA → Node (`/api/tebra`) sends `{ action:"syncSchedule", params:{ date:"YYYY-MM-DD" } }`.
2. Node proxy forwards unchanged to PHP Cloud-Run.
3. PHP logs show the call and forward to Tebra SOAP.
4. SOAP reply says *not authenticated*, hence `Appointments:null`.

**Actions to fix**

1. Open `src/Sync/SyncSchedule.php` (or the service class calling *GetAppointments*).
2. Ensure the `<SecurityRequest>` header is built exactly like successful calls:

    ```php
    <LoginSiteId>…</LoginSiteId>
    <LoginName>…</LoginName>
    <LoginPassword>…</LoginPassword>
    <CustomerKey>…</CustomerKey>
    ```

3. Deploy new Cloud-Run image.
4. Quick browser test:

    ```js
    getToken().then(async () => {
      const { tebraGetAppointments } = await import('/src/services/tebraApi');
      const r = await tebraGetAppointments({ fromDate: '2025-06-23', toDate: '2025-06-23' });
      console.log(r.data.SecurityResponse); // expect Authenticated:true
    });
    ```

5. When `Authenticated:true` and the `Appointments` array is populated, run **Sync Schedule** in the UI – Firestore now imports correct counts.

## Phase 1 – 2025-06-23   Verify SOAP authentication failure

**Goal**   Confirm that the *GetAppointments* call is rejected by Tebra because the SOAP security header is missing / invalid.

### Steps executed

1. Used the dev helper `getToken()` to obtain a valid Auth0 access-token (Firebase auth ready).
2. Called the PHP proxy directly from the browser:

   ```js
   const { tebraGetAppointments } = await import('/src/services/tebraApi');
   const res = await tebraGetAppointments({
     fromDate: '2025-06-24',
     toDate:   '2025-06-24'
   });
   console.log(res.data);
   ```

3. Observed response:

   - `success:true` (PHP proxy reachable)
   - `Appointments:null`
   - `SecurityResponse → Authenticated:false  Authorized:false`

4. Confirmed the same structure in Cloud-Run logs.

**Result**   Phase 1 complete – we have reproducible evidence that the SOAP security header is the culprit.

### Next action

Move to *Phase 2*: update `src/Sync/SyncSchedule.php` (and any helper used by `GetAppointments`) to include the correct `<SecurityRequest>` header, then redeploy PHP service.
