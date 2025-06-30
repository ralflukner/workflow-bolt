# Firebase Functions Startup Issue: Callable vs HTTP Endpoint

## Problem Summary

A recurring issue in this project is attempting to call Firebase callable functions (deployed with `onCall`) as if they were standard HTTP endpoints. This results in CORS 403 errors, failed preflight requests, and authentication issues.

## Symptoms

- `Preflight response is not successful. Status code: 403`
- `Fetch API cannot load ... due to access control checks.`
- `Failed to load resource: Preflight response is not successful. Status code: 403`
- Cloud Function works in some environments but not others
- Function is deployed and visible in `firebase functions:list`

## Root Cause

Firebase callable functions (using `onCall`) are **not** standard HTTP endpoints. They must be invoked using the Firebase SDK's callable function mechanism, not via direct HTTP fetch/XHR. Direct HTTP calls will fail CORS and authentication checks.

## Correct Usage

**Frontend:**

```js
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const exchangeAuth0Token = httpsCallable(functions, 'exchangeAuth0Token');
const result = await exchangeAuth0Token({ /* data */ });
```

**Do NOT use:**

```js
fetch('https://us-central1-<project>.cloudfunctions.net/exchangeAuth0Token', ...)
```

## How to Diagnose

1. Check the function deployment: `firebase functions:list`.
2. If the function is deployed as a callable, ensure the frontend uses `httpsCallable`.
3. If you see CORS 403 or preflight errors, check the frontend call method.
4. Review logs for `exchangeAuth0Token` in both frontend and backend.

## How to Fix

- Refactor frontend code to use the Firebase SDK's `httpsCallable` for all callable functions.
- Do not call callable functions via direct HTTP requests.
- If you need a REST endpoint, deploy the function as an HTTP function, not a callable.

## Related Files

- `functions/index.js` (backend function definition)
- `src/services/authBridge.ts` (frontend usage)
- `src/config/firebase.ts` (Firebase initialization)

## See Also

- [Firebase Callable Functions Docs](https://firebase.google.com/docs/functions/callable)

---

**This issue has recurred multiple times. Please check this document before troubleshooting CORS/function errors in the future.**
