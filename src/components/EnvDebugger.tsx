import React from 'react';
import { FIREBASE_CONFIG, ENV_INFO } from '../constants/env';

export const EnvDebugger: React.FC = () => {
  const maskValue = (val?: string): string => {
    if (!val) return 'undefined';
    // Show first 4 and last 4 characters only
    if (val.length <= 8) return '****';
    return `${val.slice(0, 4)}…${val.slice(-4)}`;
  };

  const envVars = {
    VITE_FIREBASE_PROJECT_ID: FIREBASE_CONFIG.projectId,
    VITE_FIREBASE_API_KEY: FIREBASE_CONFIG.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: FIREBASE_CONFIG.authDomain,
    VITE_FIREBASE_STORAGE_BUCKET: FIREBASE_CONFIG.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: FIREBASE_CONFIG.messagingSenderId,
    VITE_FIREBASE_APP_ID: FIREBASE_CONFIG.appId,
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg border border-gray-700 m-4">
      <h3 className="text-lg font-bold mb-3">Environment Variables Debug</h3>
      <div className="space-y-1 text-sm">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className={`flex gap-2 ${value ? 'text-green-400' : 'text-red-400'}`}>
            <span className="font-mono">{key}:</span>
            <span>{value ? `"${maskValue(value as string)}"` : 'undefined'}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <div>NODE_ENV: {ENV_INFO.nodeEnv}</div>
        <div>DEV: {ENV_INFO.isDev ? 'true' : 'false'}</div>
        <div>PROD: {ENV_INFO.isProd ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}; 