import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

// Test Firebase configuration - uses environment variables for testing
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'luknerlumina-firebase',
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'luknerlumina-firebase.firebaseapp.com',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'luknerlumina-firebase.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '623450773640',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6TX8WRN2Z',
};

console.log('🔍 Testing Firebase Configuration...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('API Key:', firebaseConfig.apiKey ? '***configured***' : 'missing');
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId);
console.log('App ID:', firebaseConfig.appId);
console.log('Measurement ID:', firebaseConfig.measurementId || 'not configured');

try {
  console.log('\n🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');

  console.log('\n🔧 Testing Firebase Services...');
  getFirestore(app);
  console.log('✅ Firestore initialized');

  getAuth(app);
  console.log('✅ Auth initialized');

  getFunctions(app);
  console.log('✅ Functions initialized');

  console.log('\n🎉 All Firebase services initialized successfully!');
} catch (error) {
  console.error('\n❌ Firebase initialization failed:', error);
  process.exit(1);
} 
