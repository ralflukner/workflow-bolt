# Tebra Credential-Rotation Playbook

> Last updated: 2025-06-15

This guide walks you through **every step required** to rotate the Tebra username, password, customer-key and internal API key while keeping all environments (Cloud Run proxy, Firebase Functions, local/dev, CI) online.

---

## 1. Update Google Secret Manager (GSM)

1. Create a **new version** for each secret:
   * `TEBRA_USERNAME`
   * `TEBRA_PASSWORD`
   * `TEBRA_CUSTOMER_KEY`
   * `TEBRA_INTERNAL_API_KEY` *(only if key is rotated)*
   * *(no change)* `TEBRA_CLOUD_RUN_URL`

2. Sanity-check each value:
   ```bash
   gcloud secrets versions access latest --secret=TEBRA_USERNAME --project=luknerlumina-firebase
   ```

## 2. Grant Cloud Run proxy access to the new versions

Cloud Run revisions do **not** inherit IAM on new secret versions.

```bash
SA="cr-tebra-proxy-sa@luknerlumina-firebase.iam.gserviceaccount.com"
for S in TEBRA_USERNAME TEBRA_PASSWORD TEBRA_CUSTOMER_KEY TEBRA_INTERNAL_API_KEY; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project=luknerlumina-firebase
done
```

## 3. Redeploy the Cloud Run proxy

```bash
# Pull the latest secret versions
# (no Docker build needed if the image already exists)
gcloud run services update tebra-proxy \
  --region=us-central1 \
  --project=luknerlumina-firebase
```

Verify that **Env → Secrets** shows `…:latest` for the 4 secret refs.

## 4. Firebase Functions / Node back-end

* No code changes are required—the functions call the proxy.
* Cold-start instances may cache the old key for ~5 min.
* If you're in a hurry:
  ```bash
  firebase deploy --only functions:tebraTestConnection,tebraSyncSchedule
  ```

## 5. Local & CI environments

* Update `.env.local`, GitHub Actions secrets, Cloud Build vars, etc.
* Run `firebase functions:shell tebraTestConnection` to confirm.

## 6. Validation checklist

| Step | Command | Expected |
|------|---------|----------|
| Curl direct | `curl -H "Authorization: Bearer $(gcloud auth print-identity-token --audiences=https://tebra-proxy-… )" -H "X-API-Key: $(gcloud secrets versions access latest --secret=TEBRA_INTERNAL_API_KEY)" https://tebra-proxy-…/providers` | JSON with `providers` array |
| Firebase Fn | `firebase functions:shell tebraTestConnection` | `{ success: true }` |
| UI button | "Test Connection" | Status: **Connected** |

## 7. Repository hygiene

* Run secret scan: `git grep -n "pqpyiN"` (or use `git secrets`).
* If a rotated secret was committed, scrub it with `git filter-repo` and force-push.

---

### TL;DR

1. New GSM versions → 2. Grant proxy SA access → 3. `gcloud run services update` → 4. (optional) redeploy functions → 5. Update local/CI envs → 6. Verify → 7. Scan repo.

Rotate ✔ – zero downtime, zero leaks.
