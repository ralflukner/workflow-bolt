import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('🔍 Testing Firebase Configuration...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('API Key:', firebaseConfig.apiKey ? '***configured***' : 'missing');
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId);
console.log('App ID:', firebaseConfig.appId);

try {
  console.log('\n🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');

  console.log('\n🔧 Testing Firebase Services...');
  const db = getFirestore(app);
  console.log('✅ Firestore initialized');

  const auth = getAuth(app);
  console.log('✅ Auth initialized');

  const functions = getFunctions(app);
  console.log('✅ Functions initialized');

  console.log('\n🎉 All Firebase services initialized successfully!');
} catch (error) {
  console.error('\n❌ Firebase initialization failed:', error);
  process.exit(1);
} 