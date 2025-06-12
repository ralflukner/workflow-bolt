import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
npimport { FIREBASE_CONFIG } from './constants/env';

const firebaseConfig = {
  projectId: FIREBASE_CONFIG.projectId,
  apiKey: FIREBASE_CONFIG.apiKey,
  authDomain: FIREBASE_CONFIG.authDomain,
  storageBucket: FIREBASE_CONFIG.storageBucket,
  messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
  appId: FIREBASE_CONFIG.appId,
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
