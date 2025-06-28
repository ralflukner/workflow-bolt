// Debug helper to check environment variable loading
export function debugEnv() {
  console.log('=== Environment Debug ===');
  
  // Check import.meta.env directly
  try {
    console.log('import.meta.env:', import.meta.env);
    console.log('VITE_FIREBASE_API_KEY from import.meta.env:', import.meta.env.VITE_FIREBASE_API_KEY);
  } catch (e) {
    console.log('import.meta.env not accessible:', e);
  }
  
  // Check process.env
  try {
    console.log('process.env:', typeof process !== 'undefined' ? 'exists' : 'undefined');
  } catch (e) {
    console.log('process.env not accessible:', e);
  }
  
  // Check window
  console.log('window exists:', typeof window !== 'undefined');
  
  console.log('=== End Environment Debug ===');
}