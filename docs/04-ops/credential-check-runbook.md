# Credential Check Runbook

This runbook documents common credential-related failures and quick remediation steps.

## "Invalid token" / JWT verification failures

Symptoms:

* Auth0 or Firebase tokens suddenly start to fail verification (`invalid signature`, `jwt audience invalid`, etc.).
* Production front-end shows repeated authentication popups or hard 401 responses.
* Cloud Functions logs show `FirebaseError: Credential implementation provided invalid token`.

Likely root cause:

GSM secret values (e.g. `AUTH0_REDIRECT_URI`, `VITE_FIREBASE_API_KEY`, etc.) include a trailing newline byte. The extra `\n` alters the hash / audience comparison during JWT validation.

### Immediate fix

Run the helper script that removes the newline and publishes a clean version of every affected secret:

```bash
./scripts/fix-secret-newlines.sh
```

The script will:

1. Scan **all** secrets in the current GCP project.
2. Detect those whose latest version ends with `\n`.
3. Publish a new version with the trailing newline stripped (history is preserved).

After it completes, verify no secrets still report `YES`:

```bash
./scripts/check-secret-newlines.sh
```

If the verification script prints nothing but `no`, the credential issue should be resolved within seconds (Cloud Functions / Cloud Run pick up the next secret pull).

### Preventing regressions

* The newline-check script has been added to CI; new pull requests will fail if they (re-)introduce secrets ending with `\n`.
* When creating secrets via `gcloud secrets versions add --data-file=-`, always **redirect from a file** rather than echoing inline, e.g.:
  ```bash
  printf "%s" "$AUTH0_DOMAIN" | gcloud secrets versions add auth0-domain --data-file=-
  ```
  (Plain `echo` adds an implicit newline.)

---

Last updated: 2025-06-29