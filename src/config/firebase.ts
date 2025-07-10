// Stub file for Firebase migration
// This file provides placeholders during the migration to Redis/PostgreSQL

export const app = null;
export const db = null;
export const functions = null;
export const auth = null;

export const isFirebaseConfigured = () => false;

export const initializeFirebase = () => {
  console.warn('Firebase has been removed. Using Redis/PostgreSQL instead.');
  return null;
};

// Placeholder types to prevent TypeScript errors during migration
export type DocumentSnapshot = any;
export type QuerySnapshot = any;
export type CollectionReference = any;
export type DocumentReference = any;
export type Firestore = any;
export type Functions = any;
export type Auth = any; 