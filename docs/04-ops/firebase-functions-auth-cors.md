# Firebase Functions: Authentication & CORS Troubleshooting

When you deploy callable/HTTP functions to production you may hit 401 / CORS 403 errors even though everything works locally. 99 % of the time the request is missing a Firebase ID token or the function's CORS policy blocks the frontend origin.

---

## 🔍  Why it happens

| Symptom (Frontend)                         | Root Cause                                    |
|-------------------------------------------|-----------------------------------------------|
| 401 `unauthenticated` from onCall/onRequest | ID token missing or expired                   |
| `Preflight response is not successful` 403 | Function CORS origin list doesn't include app |

---

## ✅  Fix Checklist

### 1  Always send an ID token from the browser

```ts
// src/services/firebase/tebraService.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

export const testTebraConnection = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated');

  const idToken = await user.getIdToken(); // fresh
  const functions = getFunctions();
  const tebraTestConnection = httpsCallable(functions, 'tebraTestConnection');

  // For onCall you don't pass the token manually – the SDK does it
  return (await tebraTestConnection()).data;
};
```

### 2  Add explicit auth check & CORS to the function

```js
// functions/index.js
const functions = require('firebase-functions');
const cors = require('cors')({
  origin: [
    'http://localhost:5173',
    'https://your-production-domain.com'
  ],
  credentials: true
});

exports.tebraTestConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  // business logic …
  return { success: true };
});
```

### 3  Re-deploy

```bash
firebase deploy --only functions
```

---

## 🛠  Alternative: switch to onRequest

If onCall is still problematic (e.g. non-browser clients) use an HTTP function and **manually** verify the bearer token:

```js
exports.tebraTestConnection = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

    const idToken = authHeader.replace('Bearer ', '');
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      // business logic …
      return res.json({ success: true, uid: decoded.uid });
    } catch (err) {
      return res.status(401).send('Invalid token');
    }
  });
});
```

Frontend fetch:

```ts
const token = await getAuth().currentUser.getIdToken();
const res = await fetch('<cloud-function-url>', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

---

## 📌  Key takeaways

1. **Callable (`onCall`) functions automatically read the Firebase ID token** – but only if the SDK supplied it; ensure the user is logged in before calling.
2. **HTTP (`onRequest`) functions need manual token verification** with `admin.auth().verifyIdToken()`.
3. **CORS:** whitelist both `localhost` dev ports *and* your production domain.
4. After code changes always redeploy with `firebase deploy --only functions`.

Keep this runbook handy whenever the UI suddenly gets 401 or CORS 403 from Firebase Functions.

## 🛠 Quick Fix Recipe (CORS + Auth on `tebraTestConnection`)

1. **Update the Cloud Function**

```js
// functions/index.js
const functions = require('firebase-functions');
const cors = require('cors')({
  origin: [
    'http://localhost:3000', // CRA default
    'http://localhost:5173', // Vite default
    'http://localhost:5002', // Firebase emulator UI
    // add your production domain here
  ],
  credentials: true
});

exports.tebraTestConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log('Authenticated user:', context.auth.uid);
  // existing Tebra connection logic …
  return {
    success: true,
    message: 'Tebra connection test successful',
    userId: context.auth.uid
  };
});
```

2. **Install CORS (once per `functions/` directory)**

```bash
cd functions
npm install cors
cd ..
```

3. **Deploy just that function**

```bash
firebase deploy --only functions:tebraTestConnection
```

4. **Ensure the frontend is authenticated before calling**

```ts
// (simplified) example call
if (!getAuth().currentUser) {
  await loginPopup(); // or your auth flow
}
await testTebraConnection();
```

After these steps, localhost requests will succeed and you can add your production domain to the CORS list when ready. 