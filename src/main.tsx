import { StrictMode, createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeFirebase } from './config/firebase';

// Create a context for Firebase initialization status
interface FirebaseContextType {
  isInitialized: boolean;
  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  error: null,
});

// Provider component that handles Firebase initialization
function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeFirebase()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error('Failed to initialize Firebase:', err);
        setError(err);
      });
  }, []);

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

// Hook to access Firebase initialization status
export function useFirebase() {
  return useContext(FirebaseContext);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>
);
