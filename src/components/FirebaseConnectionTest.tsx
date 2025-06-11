import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from '../config/firebase-config';

export const FirebaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<{
    initialized: boolean;
    error?: string;
    services: {
      firestore: boolean;
      auth: boolean;
      functions: boolean;
      analytics: boolean;
    };
  }>({
    initialized: false,
    services: {
      firestore: false,
      auth: false,
      functions: false,
      analytics: false,
    },
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing Firebase Configuration...');
        console.log('Project ID:', firebaseConfig.projectId);
        console.log('API Key:', firebaseConfig.apiKey ? '***configured***' : 'missing');
        console.log('Auth Domain:', firebaseConfig.authDomain);
        console.log('Storage Bucket:', firebaseConfig.storageBucket);
        console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId);
        console.log('App ID:', firebaseConfig.appId);
        console.log('Measurement ID:', firebaseConfig.measurementId);

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

        getAnalytics(app);
        console.log('✅ Analytics initialized');

        setStatus({
          initialized: true,
          services: {
            firestore: true,
            auth: true,
            functions: true,
            analytics: true,
          },
        });

        console.log('\n🎉 All Firebase services initialized successfully!');
      } catch (error) {
        console.error('\n❌ Firebase initialization failed:', error);
        setStatus({
          initialized: false,
          error: error instanceof Error ? error.message : String(error),
          services: {
            firestore: false,
            auth: false,
            functions: false,
            analytics: false,
          },
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg border border-gray-700 m-4">
      <h3 className="text-lg font-bold mb-3">Firebase Connection Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={status.initialized ? 'text-green-400' : 'text-red-400'}>
            {status.initialized ? '✅' : '❌'}
          </span>
          <span>Firebase Initialized: {status.initialized ? 'Yes' : 'No'}</span>
        </div>

        {status.error && (
          <div className="text-red-400 bg-red-900/20 p-2 rounded">
            Error: {status.error}
          </div>
        )}

        <div className="mt-4">
          <h4 className="font-medium mb-2">Services Status:</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={status.services.firestore ? 'text-green-400' : 'text-red-400'}>
                {status.services.firestore ? '✅' : '❌'}
              </span>
              <span>Firestore: {status.services.firestore ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={status.services.auth ? 'text-green-400' : 'text-red-400'}>
                {status.services.auth ? '✅' : '❌'}
              </span>
              <span>Auth: {status.services.auth ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={status.services.functions ? 'text-green-400' : 'text-red-400'}>
                {status.services.functions ? '✅' : '❌'}
              </span>
              <span>Functions: {status.services.functions ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={status.services.analytics ? 'text-green-400' : 'text-red-400'}>
                {status.services.analytics ? '✅' : '❌'}
              </span>
              <span>Analytics: {status.services.analytics ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <div>Project ID: {firebaseConfig.projectId}</div>
          <div>Auth Domain: {firebaseConfig.authDomain}</div>
          <div>Storage Bucket: {firebaseConfig.storageBucket}</div>
          <div>Messaging Sender ID: {firebaseConfig.messagingSenderId}</div>
          <div>App ID: {firebaseConfig.appId}</div>
          <div>Measurement ID: {firebaseConfig.measurementId}</div>
        </div>
      </div>
    </div>
  );
}; 