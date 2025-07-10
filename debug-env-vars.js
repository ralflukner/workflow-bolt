// Quick debug script to check environment variables in browser console

console.log('🔍 Environment Variables Debug');
console.log('============================');

const firebaseVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

firebaseVars.forEach(varName => {
  const value = import.meta.env[varName];
  console.log(`${varName}: ${value ? `${value.substring(0, 10)}...` : '❌ MISSING'}`);
});

console.log('\n🔥 Firebase Config Check:');
console.log('isFirebaseConfigured:', typeof window !== 'undefined' && window.firebase ? 'Yes' : 'Unknown');

// Test if Firebase can be initialized
import { isFirebaseConfigured } from './src/config/firebase';
console.log('Firebase configured:', isFirebaseConfigured());