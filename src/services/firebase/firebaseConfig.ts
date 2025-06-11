/**
 * @fileoverview Firebase configuration and initialization
 * @module services/firebase/firebaseConfig
 */

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Functions, getFunctions } from 'firebase/functions';

/**
 * Firebase configuration interface
 * @interface FirebaseConfig
 */
interface FirebaseConfig {
  /** Firebase project ID */
  projectId: string;
  /** Firebase API key */
  apiKey: string;
  /** Firebase auth domain */
  authDomain: string;
  /** Firebase storage bucket */
  storageBucket: string;
  /** Firebase messaging sender ID */
  messagingSenderId: string;
  /** Firebase app ID */
  appId: string;
}

/**
 * Validates Firebase configuration
 * @param {FirebaseConfig} config - Firebase configuration object
 * @returns {boolean} True if configuration is valid
 * @throws {Error} If configuration is invalid
 */
const validateFirebaseConfig = (config: FirebaseConfig): boolean => {
  const requiredFields: (keyof FirebaseConfig)[] = [
    'projectId',
    'apiKey',
    'authDomain',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid Firebase configuration. Missing required fields: ${missingFields.join(', ')}`
    );
  }

  return true;
};

/**
 * Gets Firebase configuration from environment variables
 * @returns {FirebaseConfig} Firebase configuration object
 * @throws {Error} If required environment variables are missing
 */
const getFirebaseConfig = (): FirebaseConfig => {
  // Use process.env for compatibility with Jest
  const config: FirebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || ''
  };

  validateFirebaseConfig(config);
  return config;
};

/**
 * Firebase service class
 * @class FirebaseService
 */
class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private db: Firestore;
  private functions: Functions;

  /**
   * Creates an instance of FirebaseService
   * @throws {Error} If Firebase initialization fails
   */
  private constructor() {
    try {
      const config = getFirebaseConfig();
      this.app = initializeApp(config);
      this.db = getFirestore(this.app);
      this.functions = getFunctions(this.app);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  /**
   * Gets the singleton instance of FirebaseService
   * @returns {FirebaseService} FirebaseService instance
   */
  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Gets the Firebase app instance
   * @returns {FirebaseApp} Firebase app instance
   */
  public getApp(): FirebaseApp {
    return this.app;
  }

  /**
   * Gets the Firestore instance
   * @returns {Firestore} Firestore instance
   */
  public getDb(): Firestore {
    return this.db;
  }

  /**
   * Gets the Firebase Functions instance
   * @returns {Functions} Firebase Functions instance
   */
  public getFunctions(): Functions {
    return this.functions;
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();

// Export individual instances for convenience
export const app = firebaseService.getApp();
export const db = firebaseService.getDb();
export const functions = firebaseService.getFunctions(); 