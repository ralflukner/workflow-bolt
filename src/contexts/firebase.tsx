import React from 'react';
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
// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
export class FirebaseProvider extends React.Component<{ children: React.ReactNode }, { isInitialized: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      isInitialized: false,
      error: null,
    };
  }

  componentDidMount() {
    // Initialization logic previously in useEffect
    initializeFirebase()
      .then(() => {
        console.log('[Instrumentation] initializeFirebase resolved successfully.');
        this.setState({ isInitialized: true });
      })
      .catch((err) => {
        console.error('[Instrumentation] initializeFirebase failed:', err);
        this.setState({ error: err });
      });
  }

  render() {
    const { isInitialized, error } = this.state;
    const { children } = this.props;

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
}