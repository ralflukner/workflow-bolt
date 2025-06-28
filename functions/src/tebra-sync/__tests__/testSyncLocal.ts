#!/usr/bin/env ts-node

/**
 * Local test script for the Tebra sync functionality
 * This script simulates calling the Firebase function locally
 * 
 * Usage:
 *   npx ts-node src/tebra-sync/__tests__/testSyncLocal.ts
 *   npx ts-node src/tebra-sync/__tests__/testSyncLocal.ts 2025-06-15
 */

import { syncSchedule } from '../syncSchedule';
import { consoleLogger } from '../../services/logger';

// Mock dependencies
const mockTebra = {
  getAppointments: async (startDate: string, endDate: string) => {
    console.log(`🔍 Fetching appointments for ${startDate} to ${endDate}`);
    
    // Return mock appointments
    return [
      {
        ID: 'mock-appt-1',
        PatientId: 'mock-patient-1',
        ProviderId: 'mock-provider-1',
        AppointmentType: 'Annual Exam',
        StartTime: `${startDate}T09:00:00`,
        Status: 'Confirmed',
      },
      {
        ID: 'mock-appt-2',
        PatientId: 'mock-patient-2',
        ProviderId: 'mock-provider-1',
        AppointmentType: 'Follow-up',
        StartTime: `${startDate}T14:30:00`,
        Status: 'CheckedIn',
      },
    ];
  },
  
  getPatientById: async (patientId: string) => {
    console.log(`🔍 Fetching patient ${patientId}`);
    
    const patients: Record<string, any> = {
      'mock-patient-1': {
        ID: 'mock-patient-1',
        PatientId: 'mock-patient-1',
        FirstName: 'Test',
        LastName: 'Patient',
        DateOfBirth: '1980-01-15',
        Email: 'test.patient@example.com',
        Phone: '555-0100',
      },
      'mock-patient-2': {
        ID: 'mock-patient-2',
        PatientId: 'mock-patient-2',
        FirstName: 'Demo',
        LastName: 'User',
        DateOfBirth: '1975-06-20',
        Email: 'demo.user@example.com',
        Phone: '555-0200',
      },
    };
    
    return patients[patientId];
  },
  
  getProviders: async () => {
    console.log('🔍 Fetching providers');
    
    return [
      {
        ID: 'mock-provider-1',
        ProviderId: 'mock-provider-1',
        FirstName: 'Jane',
        LastName: 'Smith',
        Title: 'Dr.',
        Degree: 'MD',
      },
    ];
  },
  
  searchPatients: async () => [],
  getPatientInsurances: async () => [],
  getPatientRecallExams: async () => [],
};

const mockRepo = {
  save: async (date: string, patients: any[], uid: string) => {
    console.log(`\n💾 Saving ${patients.length} patients for ${date} (user: ${uid})`);
    console.log('\nPatient data:');
    patients.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   DOB: ${p.dob}`);
      console.log(`   Provider: ${p.provider}`);
      console.log(`   Appointment: ${p.appointmentTime} (${p.appointmentType})`);
      console.log(`   Status: ${p.status}`);
      if (p.checkInTime) {
        console.log(`   Check-in Time: ${p.checkInTime}`);
      }
    });
  },
  
  get: async () => ({ patients: [] }),
  getRecent: async () => [],
  purgeOld: async () => 0,
};

// Run the test
async function runTest() {
  const dateOverride = process.argv[2];
  
  console.log('🚀 Starting Tebra sync test...\n');
  
  try {
    const count = await syncSchedule(
      {
        tebra: mockTebra as any,
        repo: mockRepo as any,
        logger: consoleLogger,
        now: () => new Date(),
        timezone: 'America/Chicago',
      },
      dateOverride,
      'test-user'
    );
    
    console.log(`\n✅ Successfully synced ${count} patients!`);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

runTest();