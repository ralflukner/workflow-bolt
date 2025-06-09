import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManager = new SecretManagerServiceClient();
const PROJECT_ID = 'luknerlumina-firebase';
const SECRET_NAME = 'firebase-config';

/**
 * Securely fetch Firebase configuration from Secret Manager
 * This function is called by the client to get Firebase configuration
 */
export const getFirebaseConfig = onCall({
  enforceAppCheck: true, // Require App Check
  maxInstances: 10,
}, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Get the secret version
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${SECRET_NAME}/versions/latest`,
    });

    if (!version.payload?.data) {
      throw new HttpsError('internal', 'Failed to access secret');
    }

    // Decode the secret data
    const config = JSON.parse(
      Buffer.from(version.payload.data.toString(), 'base64').toString()
    );

    // Log access for audit trail
    console.log(`Firebase config accessed by user: ${request.auth.uid}`);

    return {
      success: true,
      config,
    };
  } catch (error) {
    console.error('Error accessing Firebase config:', error);
    throw new HttpsError(
      'internal',
      'Failed to retrieve Firebase configuration'
    );
  }
}); 