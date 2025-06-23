/**
 * Tebra API Service
 * Routes through Firebase Functions for security and HIPAA compliance
 */

import * as firebaseApi from './tebraFirebaseApi';

// Re-export all Firebase Functions API functions
export const tebraTestConnection = firebaseApi.tebraTestConnection;
export const tebraGetPatient = firebaseApi.tebraGetPatient;
export const tebraSearchPatients = firebaseApi.tebraSearchPatients;
export const tebraGetAppointments = firebaseApi.tebraGetAppointments;
export const tebraGetProviders = firebaseApi.tebraGetProviders;
export const tebraCreateAppointment = firebaseApi.tebraCreateAppointment;
export const tebraUpdateAppointment = firebaseApi.tebraUpdateAppointment;
export const tebraTestAppointments = firebaseApi.tebraTestAppointments;
export const tebraSyncSchedule = firebaseApi.tebraSyncSchedule;

// Export configuration info
export const getApiInfo = () => ({
  usingFirebaseProxy: true,
  apiType: 'Firebase Functions -> PHP Cloud Run',
  message: 'Using Firebase Functions as security proxy to PHP Tebra API',
});

// Log that we're using Firebase proxy
console.log('🔌 Tebra API: Using Firebase Functions proxy (designed architecture)');

export default {
  testConnection: tebraTestConnection,
  getPatient: tebraGetPatient,
  searchPatients: tebraSearchPatients,
  getAppointments: tebraGetAppointments,
  getProviders: tebraGetProviders,
  createAppointment: tebraCreateAppointment,
  updateAppointment: tebraUpdateAppointment,
  testAppointments: tebraTestAppointments,
  syncSchedule: tebraSyncSchedule,
  getApiInfo,
};