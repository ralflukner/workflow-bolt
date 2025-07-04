import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  projectId: "luknerlumina-firebase",
  storageBucket: "luknerlumina-firebase.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testTebraProxy() {
  try {
    console.log('🧪 Testing tebraProxy with health check...');
    
    const tebraProxy = httpsCallable(functions, 'tebraProxy');
    const result = await tebraProxy({ action: 'health_check' });
    
    console.log('✅ tebraProxy health check successful\!');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.log('❌ tebraProxy test failed:');
    if (error.code) console.log('Error Code:', error.code);
    if (error.message) console.log('Error Message:', error.message);
    if (error.details) console.log('Details:', error.details);
    
    // If it's an auth error, that means the function is deployed correctly
    if (error.code === 'unauthenticated') {
      console.log('✅ Function is deployed (authentication required as expected)');
    }
  }
}

testTebraProxy();
