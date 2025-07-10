// Firebase stubs for migration period
// These are placeholder functions/types to prevent TypeScript errors

// Firestore stubs
export const collection = () => null;
export const doc = () => null;
export const getDoc = async () => ({ exists: () => false, data: () => null });
export const getDocs = async () => ({ docs: [], empty: true });
export const setDoc = async () => {};
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const query = () => null;
export const where = () => null;
export const orderBy = () => null;
export const limit = () => null;
export const onSnapshot = () => () => {};
export const serverTimestamp = () => new Date();
export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: (date: Date) => ({ toDate: () => date })
};
export const writeBatch = () => ({
  set: () => {},
  update: () => {},
  delete: () => {},
  commit: async () => {}
});
export const getFirestore = () => null;
export const runTransaction = async (fn: any) => fn({});

// Functions stubs
export const getFunctions = () => null;
export const httpsCallable = () => async () => ({ data: null });
export type Functions = any;
export type HttpsCallable = any;

// Auth stubs
export const getAuth = () => null;
export const onAuthStateChanged = () => () => {};
export const signInWithEmailAndPassword = async () => ({ user: null });
export const signOut = async () => {};
export const createUserWithEmailAndPassword = async () => ({ user: null });

// App stubs
export const getApps = () => [];
export const initializeApp = () => null;
export const getApp = () => null; 