/* eslint-disable @typescript-eslint/no-explicit-any */
// Manual Jest mock for firebase/auth used across the test-suite

export const onAuthStateChanged = jest.fn();
export const signInWithCustomToken = jest.fn();
export const getAuth = jest.fn(() => ({ currentUser: null }));

// Provide re-export for compatibility
export default {
  onAuthStateChanged,
  signInWithCustomToken,
  getAuth,
}; 