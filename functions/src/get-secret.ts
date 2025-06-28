import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const gsm = new SecretManagerServiceClient();
const PROJECT_ID =
  process.env.GCP_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'luknerlumina-firebase';

/** Only these names are allowed to be requested from the client.  
 *  (Keeps you from ever leaking "root" credentials by typo.)               */
const ALLOWED = new Set([
  'TEBRA_PROXY_API_KEY',
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE'
  // add more as needed
]);

export const getSecret = onCall({ enforceAppCheck: true }, async req => {
  // ① Require Firebase auth
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Sign-in required');
  }

  const { secretKey } = req.data || {};
  if (!secretKey || typeof secretKey !== 'string') {
    throw new HttpsError('invalid-argument', '`secretKey` missing');
  }
  if (!ALLOWED.has(secretKey)) {
    throw new HttpsError('permission-denied', 'Not permitted');
  }

  const name = `projects/${PROJECT_ID}/secrets/${secretKey}/versions/latest`;
  const [ver] = await gsm.accessSecretVersion({ name });
  const payload = ver.payload?.data?.toString();

  if (!payload) {
    throw new HttpsError('not-found', 'Secret empty');
  }

  // audit trail (NO secret value logged)
  console.log('HIPAA_AUDIT', JSON.stringify({
    kind: 'SECRET_ACCESS',
    secretKey,
    accessedBy: req.auth.uid,
    ts: Date.now()
  }));

  return { value: payload };
});