// HIPAA-Compliant Firebase Config Function (Authenticated Access Only)
// Provides Firebase config only to authenticated users

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const getFirebaseConfig = functions.https.onCall(async (data, context) => {
  try {
    // CRITICAL: Verify user is authenticated (HIPAA requirement)
    if (!context.auth) {
      console.error('Unauthorized config request attempt', {
        ip: context.rawRequest?.ip,
        userAgent: context.rawRequest?.headers?.['user-agent'],
        timestamp: new Date().toISOString()
      });
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'Authentication required to access Firebase configuration'
      );
    }

    // Log authenticated access for audit trail (HIPAA requirement)
    console.log('Authorized config request', {
      uid: context.auth.uid,
      email: context.auth.token?.email,
      timestamp: new Date().toISOString()
    });

    // Return minimal config needed for Firebase initialization
    // Only provide what's necessary, not full environment
    const config = {
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
      projectId: process.env.GCLOUD_PROJECT,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`,
    };

    // Validate essential fields
    if (!config.projectId) {
      throw new functions.https.HttpsError(
        'internal', 
        'Firebase configuration not available'
      );
    }

    // Filter out undefined values
    Object.keys(config).forEach(key => {
      if (config[key] === undefined) {
        delete config[key];
      }
    });

    return { config };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError as-is
    }
    
    console.error('Config request failed:', error);
    throw new functions.https.HttpsError(
      'internal', 
      'Service temporarily unavailable'
    );
  }
});

module.exports = { getFirebaseConfig };