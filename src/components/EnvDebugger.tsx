import React from 'react';

export const EnvDebugger: React.FC = () => {
  const envVars = {
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg border border-gray-700 m-4">
      <h3 className="text-lg font-bold mb-3">Environment Variables Debug</h3>
      <div className="space-y-1 text-sm">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className={`flex gap-2 ${value ? 'text-green-400' : 'text-red-400'}`}>
            <span className="font-mono">{key}:</span>
            <span>{value ? `"${value}"` : 'undefined'}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <div>NODE_ENV: {import.meta.env.NODE_ENV}</div>
        <div>DEV: {import.meta.env.DEV ? 'true' : 'false'}</div>
        <div>PROD: {import.meta.env.PROD ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}; 