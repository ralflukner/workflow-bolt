# Secure Cloud-Run Health-Check Proxy via **tebraProxy**

*Last updated: {{DATE}}*

---

## Overview
Tebra Debug Dashboard needs to poll the `/health` endpoint of the private Cloud-Run service `tebra-php-api`.  Direct public access is forbidden (HIPAA).  The solution is to proxy the request through an **authenticated, callable** Firebase Function named `tebraProxy`.

```
Browser (signed-in) ──▶ tebraProxy (Callable) ──▶ Cloud Run (private)
                                   │            ▲
                                   │ IAM token  │ roles/run.invoker
                                   └─ X-API-KEY ┘ (internal)
```

Security guarantees:
* Cloud-Run remains private (`roles/run.invoker` granted only to the function's SA).  
* Browser must present a Firebase ID-token (same project) to call `tebraProxy`.  
* `tebraProxy` forwards the **internal** `X-API-KEY` to PHP for an additional layer.

---

## Implementation Steps

### 1. Add `cloudRunHealth` action in **functions/src/tebraProxy.ts**
```ts
import { GoogleAuth } from 'google-auth-library';

// inside onCall / onRequest handler
if (data.action === 'cloudRunHealth') {
  const auth  = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  const idTok = await auth.getIdTokenClient(process.env.TEBRA_CLOUD_RUN_URL!);
  const { token } = await idTok.getRequestHeaders();

  const r = await axios.get(`${process.env.TEBRA_CLOUD_RUN_URL}/health`, {
    headers: {
      'Authorization': token,
      'X-API-KEY': process.env.TEBRA_INTERNAL_API_KEY!
    },
    timeout: 10000
  });
  return { success: true, status: r.status === 200 ? 'healthy' : 'unhealthy' };
}
```

### 2. Runtime config (Firebase CLI)
```bash
firebase functions:config:set \
  tebra.cloud_run_url="https://tebra-php-api-623450773640.us-central1.run.app" \
  tebra.internal_api_key="$(gcloud secrets versions access latest --secret=tebra-internal-api-key --quiet)"
```

### 3. Deploy callable (Gen-2)
```bash
firebase deploy --only functions:tebraProxy
```

### 4. Grant invoker on Cloud-Run to the function's SA
```bash
FUNCTION_SA=$(gcloud functions describe tebraProxy \
  --region us-central1 --format='value(serviceConfig.serviceAccountEmail)')

gcloud run services add-iam-policy-binding tebra-php-api \
  --region us-central1 \
  --member="serviceAccount:${FUNCTION_SA}" \
  --role="roles/run.invoker"
```

### 5. Front-end usage
```ts
import { httpsCallable, getFunctions } from 'firebase/functions';

const proxy = httpsCallable(getFunctions(), 'tebraProxy');
const res: any = await proxy({ action: 'cloudRunHealth', params: {} });
console.log(res.data.status); // 'healthy' | 'unhealthy'
```

---

## Testing Checklist
1. `firebase functions:log --only tebraProxy` shows `🏥 Cloud Run health check proxy request` with `200` status.  
2. `curl` with a user ID-token returns `{ success:true, status:'healthy' }`.  
3. Dashboard "Cloud Run" / "Tebra Proxy" rows display **healthy**.  
4. Cloud-Run traffic log shows requests only from the function's service-account.  
5. No unauthenticated access possible (function verifies Firebase ID-token).

---

## Audit & Compliance Notes
* All PHI remains behind `X-API-KEY` and private Cloud-Run.  
* Firebase Auth provides user-level auditing.  
* IAM roles constrain service-account access.  
* Implementation reviewed 2025-07-04 by o3-max, Gemini, and Claude agents. 