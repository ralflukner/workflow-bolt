/**
 * Tebra API Service Factory
 * Returns either Firebase Functions or PHP API implementation based on configuration
 */

import * as firebaseApi from './tebraApiService';
import * as phpApi from './tebraPhpApiService';
import { getTebraApiConfig } from './configService';

// Configuration will be loaded dynamically
let USE_PHP_API: boolean | null = null;

// Load configuration on first use
async function ensureConfig() {
  if (USE_PHP_API === null) {
    const config = await getTebraApiConfig();
    USE_PHP_API = config.usePhpApi;
    console.log(`🔌 Tebra API: Using ${USE_PHP_API ? 'PHP Direct API' : 'Firebase Functions'}`);
  }
  return USE_PHP_API;
}

// Create wrapper functions that check configuration before calling
export const tebraTestConnection = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraTestConnection(...args) : firebaseApi.tebraTestConnection(...args);
};

export const tebraGetPatient = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraGetPatient(...args) : firebaseApi.tebraGetPatient(...args);
};

export const tebraSearchPatients = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraSearchPatients(...args) : firebaseApi.tebraSearchPatients(...args);
};

export const tebraGetAppointments = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraGetAppointments(...args) : firebaseApi.tebraGetAppointments(...args);
};

export const tebraGetProviders = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraGetProviders(...args) : firebaseApi.tebraGetProviders(...args);
};

export const tebraCreateAppointment = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraCreateAppointment(...args) : firebaseApi.tebraCreateAppointment(...args);
};

export const tebraUpdateAppointment = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraUpdateAppointment(...args) : firebaseApi.tebraUpdateAppointment(...args);
};

export const tebraTestAppointments = async (...args: any[]) => {
  const usePhp = await ensureConfig();
  return usePhp ? phpApi.tebraTestAppointments(...args) : firebaseApi.tebraTestAppointments(...args);
};

// Export configuration info
export const getApiInfo = async () => {
  const config = await getTebraApiConfig();
  return {
    usingPhpApi: config.usePhpApi,
    apiType: config.usePhpApi ? 'PHP Direct API' : 'Firebase Functions',
    phpApiUrl: config.phpApiUrl,
  };
};

export default {
  testConnection: tebraTestConnection,
  getPatient: tebraGetPatient,
  searchPatients: tebraSearchPatients,
  getAppointments: tebraGetAppointments,
  getProviders: tebraGetProviders,
  createAppointment: tebraCreateAppointment,
  updateAppointment: tebraUpdateAppointment,
  testAppointments: tebraTestAppointments,
  getApiInfo,
};