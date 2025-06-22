import { initializeFirebase, getFirebaseServices } from './config/firebase';
import { AuthBridge } from './services/authBridge';
import { doc, getDoc } from 'firebase/firestore';

async function debugFirebaseAuth() {
  try {
    console.log('🔍 Starting Firebase authentication debug...');
    
    // Initialize Firebase
    await initializeFirebase();
    console.log('✅ Firebase initialized');
    
    // Get Firebase services
    const { auth, db } = getFirebaseServices();
    console.log('✅ Firebase services obtained');
    
    // Check current auth state
    const currentUser = auth?.currentUser;
    console.log('👤 Current Firebase user:', currentUser ? currentUser.uid : 'None');
    
    // Test Firestore access
    if (db) {
      try {
        const testDocRef = doc(db, 'daily_sessions', 'test');
        const testDocSnap = await getDoc(testDocRef);
        console.log('✅ Firestore access test successful, document exists:', testDocSnap.exists());
      } catch (error) {
        console.error('❌ Firestore access test failed:', error);
      }
    } else {
      console.error('❌ Firestore not available');
    }
    
    // Test AuthBridge
    const authBridge = AuthBridge.getInstance();
    console.log('✅ AuthBridge initialized');
    
    // Get debug info
    const debugInfo = authBridge.getDebugInfo();
    console.log('📊 AuthBridge debug info:', debugInfo);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).debugFirebaseAuth = debugFirebaseAuth;
}

export { debugFirebaseAuth }; 