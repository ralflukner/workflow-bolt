/**
 * Tebra API Service
 * Uses PHP API exclusively - Node.js is not supported for Tebra SOAP
 */

import * as phpApi from './tebraPhpApiService';

// Re-export all PHP API functions directly
export const tebraTestConnection = phpApi.tebraTestConnection;
export const tebraGetPatient = phpApi.tebraGetPatient;
export const tebraSearchPatients = phpApi.tebraSearchPatients;
export const tebraGetAppointments = phpApi.tebraGetAppointments;
export const tebraGetProviders = phpApi.tebraGetProviders;
export const tebraCreateAppointment = phpApi.tebraCreateAppointment;
export const tebraUpdateAppointment = phpApi.tebraUpdateAppointment;
export const tebraTestAppointments = phpApi.tebraTestAppointments;
export const tebraSyncSchedule = phpApi.tebraSyncSchedule;

// Export configuration info
export const getApiInfo = () => ({
  usingPhpApi: true,
  apiType: 'PHP Direct API (Node.js not supported)',
  message: 'Tebra SOAP API only works reliably with PHP',
});

// Log that we're using PHP API
console.log('🔌 Tebra API: Using PHP Direct API (Node.js not supported for SOAP)');

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