# Glue Layer Design – Tebra → LuknerLumina Trigger

**Author:** Claude o3 MAX • **Date:** 2025-07-03

## Goal

Invoke the new LuknerLumina backend whenever a patient's status transitions to **Checked-In** (or any configured trigger state) coming from the Tebra workflow, sending minimal PHI over HTTPS in a HIPAA-compliant way.

## Where to Hook

1. `src/context/PatientContext.tsx` – central place where patient objects are updated.
2. Alternatively, `src/services/tebra/fetchAppointments.ts` where status updates first enter the system.

We choose **PatientContext** because:

* All mutations funnel through helper actions (`updatePatientStatus`, `assignRoom`, etc.).
* Easier to guarantee single outbound event for each status change.

## Minimal Payload

```ts
interface WorkflowStartPayload {
  patientId: string;        // internal UUID
  externalId: string;       // optional MRN
  nameHash: string;         // SHA-256 hash of patient name (no raw PHI)
  status: string;           // e.g. "checked_in"
  timestamp: string;        // ISO8601
}
```

No raw name or DOB is transmitted – hashes + IDs suffice for LuknerLumina to correlate with Firestore data via Redis.

## Pseudocode Patch

```tsx
// PatientContext.tsx
// ... existing code ...
const startWorkflowForPatient = async (p: Patient) => {
  try {
    const payload: WorkflowStartPayload = {
      patientId: p.id,
      externalId: p.externalId ?? '',
      nameHash: sha256(p.firstName + p.lastName),
      status: p.status,
      timestamp: new Date().toISOString(),
    };

    await luknerLuminaApi.startWorkflow(payload);
  } catch (err) {
    console.error('LuknerLumina trigger failed', err);
  }
};

const updatePatientStatus = (id: string, newStatus: Status) => {
  setPatients(cur => cur.map(p => (p.id === id ? { ...p, status: newStatus } : p)));

  if (newStatus === 'checked_in') {
    const patient = patients.find(p => p.id === id);
    if (patient) startWorkflowForPatient(patient);
  }
};
// ... existing code ...
```

## Implementation Steps

1. **Create** `src/services/luknerLuminaApiService.ts` with `startWorkflow()` helper using Fetch with credentials.
2. **Add** SHA-256 util in `src/utils/hash.ts` (uses SubtleCrypto in browser).
3. **Update** `PatientContextType` to allow async side-effects in `updatePatientStatus`.
4. **Unit Tests** – mock `luknerLuminaApiService` and assert it's called once per status change.

## Security Considerations

* Use bearer token (ID token from Firebase or Auth0) when calling backend.
* Backend validates JWT and IP allow-list.
* Only hash of name is sent – no direct PHI.

---
*Waiting for review from Gemini & Sider.AI.*
