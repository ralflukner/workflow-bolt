import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface Patient {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'patients';

// Helper function to ensure db is not null
const ensureDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore database is not initialized');
  }
  return db;
};

export const patientService = {
  // Get all patients
  async getAllPatients() {
    const querySnapshot = await getDocs(collection(ensureDb(), COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get a single patient by ID
  async getPatientById(id: string) {
    const docRef = doc(ensureDb(), COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  // Create a new patient
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now();
    const patientWithTimestamps = {
      ...patientData,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(ensureDb(), COLLECTION_NAME), patientWithTimestamps);
    return { id: docRef.id, ...patientWithTimestamps };
  },

  // Update a patient
  async updatePatient(id: string, patientData: Partial<Patient>) {
    const docRef = doc(ensureDb(), COLLECTION_NAME, id);
    const updateData = {
      ...patientData,
      updatedAt: Timestamp.now()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  },

  // Delete a patient
  async deletePatient(id: string) {
    const docRef = doc(ensureDb(), COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return id;
  },

  // Search patients by name
  async searchPatientsByName(searchTerm: string) {
    const q = query(
      collection(ensureDb(), COLLECTION_NAME),
      where('firstName', '>=', searchTerm),
      where('firstName', '<=', searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}; 