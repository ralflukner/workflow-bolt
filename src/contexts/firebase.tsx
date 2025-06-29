import { createContext, useState } from 'react';
import { initializeFirebase } from '../config/firebase';

// Define the context type
export interface FirebaseContextType {
  isInitialized: boolean;
  error: Error | null;
}

// Create the context with default values
export const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  error: null,
});

// Provider component that handles Firebase initialization
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className="error-container">
        <h1>Failed to initialize application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <pre>{error.message}</pre>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing application...</p>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ isInitialized, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}