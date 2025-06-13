import { useContext } from 'react';
import { FirebaseContext, FirebaseContextType } from '../contexts/firebase';

// Hook to access Firebase initialization status
export function useFirebase(): FirebaseContextType {
  return useContext(FirebaseContext);
}