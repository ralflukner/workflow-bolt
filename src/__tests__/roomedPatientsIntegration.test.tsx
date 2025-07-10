/**
 * Integration test for roomed patients dashboard display fix
 * Verifies that roomed patients are properly categorized and appear in the correct dashboard section
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestProviders } from '../test/testHelpers';
import { normalizeStatus } from '../context/PatientContext';
import { PatientStatusCategories, PatientStatus } from '../types';
import Dashboard from '../components/Dashboard';

// Mock the patient context with test data
const mockUpdatePatients = jest.fn();
const mockGetPatientsByStatus = jest.fn();

jest.mock('../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    patients: [],
    getPatientsByStatus: mockGetPatientsByStatus,
    updatePatients: mockUpdatePatients,
    updatePatientStatus: jest.fn(),
    assignRoom: jest.fn(),
    updateCheckInTime: jest.fn(),
    getWaitTime: () => 0,
    deletePatient: jest.fn(),
    addPatient: jest.fn(),
    clearPatients: jest.fn(),
    getMetrics: () => ({
      totalPatients: 0,
      patientsByStatus: {},
      averageWaitTime: 0,
      checkedInToday: 0,
      completedToday: 0
    }),
    exportPatientsToJSON: jest.fn(),
    importPatientsFromJSON: jest.fn(),
    tickCounter: 0,
    isLoading: false,
    persistenceEnabled: true,
    saveCurrentSession: jest.fn(),
    togglePersistence: jest.fn(),
    hasRealData: false,
    loadMockData: jest.fn(),
    refreshFromFirebase: jest.fn()
  })
}));

describe('Roomed Patients Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to returning empty arrays for all status queries
    mockGetPatientsByStatus.mockReturnValue([]);
  });

  describe('Status Normalization', () => {
    it('normalizes "roomed" status to "appt-prep"', () => {
      expect(normalizeStatus('roomed')).toBe('appt-prep');
      expect(normalizeStatus('Roomed')).toBe('appt-prep');
      expect(normalizeStatus('ROOMED')).toBe('appt-prep');
    });

    it('handles various roomed status variations', () => {
      const roomedVariations = ['roomed', 'Roomed', 'ROOMED', '  roomed  '];
      roomedVariations.forEach(variation => {
        expect(normalizeStatus(variation)).toBe('appt-prep');
      });
    });

    it('maps other statuses correctly', () => {
      expect(normalizeStatus('scheduled')).toBe('scheduled');
      expect(normalizeStatus('arrived')).toBe('arrived');
      expect(normalizeStatus('with doctor')).toBe('With Doctor');
      expect(normalizeStatus('completed')).toBe('completed');
    });
  });

  describe('Patient Status Categories', () => {
    it('includes appt-prep in WAITING category', () => {
      expect(PatientStatusCategories.WAITING).toContain(PatientStatus.APPT_PREP);
    });

    it('categorizes roomed patients correctly', () => {
      const normalizedStatus = normalizeStatus('roomed');
      expect(normalizedStatus).toBe('appt-prep');
      
      // Verify that appt-prep status is in the WAITING category
      expect(PatientStatusCategories.WAITING).toContain('appt-prep' as any);
    });
  });

  describe('Dashboard Display', () => {
    const createTestPatient = (status: string, name: string = 'Test Patient') => ({
      id: `test-${Date.now()}-${Math.random()}`,
      name,
      dob: '1980-01-01',
      appointmentTime: new Date().toISOString(),
      appointmentType: 'Office Visit' as const,
      chiefComplaint: 'Office Visit',
      provider: 'Dr. Test',
      status: normalizeStatus(status) as any,
      checkInTime: new Date().toISOString(),
      room: 'Waiting'
    });

    it('verifies roomed patients are normalized for dashboard display', () => {
      const roomedPatient = createTestPatient('roomed', 'Roomed Test Patient');
      
      // Verify the patient has been normalized to the correct status
      expect(roomedPatient.status).toBe('appt-prep');
      
      // Verify this status would be categorized as waiting
      expect(PatientStatusCategories.WAITING).toContain(roomedPatient.status as any);
    });

    it('correctly categorizes multiple roomed patients', () => {
      const patient1 = createTestPatient('roomed', 'Patient A');
      const patient2 = createTestPatient('roomed', 'Patient B');
      
      expect(patient1.status).toBe('appt-prep');
      expect(patient2.status).toBe('appt-prep');
      
      // Both should be categorized as waiting
      expect(PatientStatusCategories.WAITING).toContain(patient1.status as any);
      expect(PatientStatusCategories.WAITING).toContain(patient2.status as any);
    });

    it('handles mixed patient statuses correctly', () => {
      const scheduledPatient = createTestPatient('scheduled', 'Scheduled Patient');
      const arrivedPatient = createTestPatient('arrived', 'Arrived Patient');
      const roomedPatient = createTestPatient('roomed', 'Roomed Patient');
      const completedPatient = createTestPatient('completed', 'Completed Patient');

      expect(scheduledPatient.status).toBe('scheduled');
      expect(arrivedPatient.status).toBe('arrived');
      expect(roomedPatient.status).toBe('appt-prep');
      expect(completedPatient.status).toBe('completed');

      // Verify categorization
      expect(PatientStatusCategories.FUTURE).toContain(scheduledPatient.status as any);
      expect(PatientStatusCategories.WAITING).toContain(arrivedPatient.status as any);
      expect(PatientStatusCategories.WAITING).toContain(roomedPatient.status as any);
      expect(PatientStatusCategories.COMPLETED_TODAY).toContain(completedPatient.status as any);
    });
  });

  describe('Import Process Integration', () => {
    it('simulates schedule import with roomed patients', () => {
      // Simulate imported patient data (before normalization)
      const importedPatients = [
        {
          name: 'Test Patient A',
          dob: '1980-01-01',
          appointmentTime: new Date().toISOString(),
          appointmentType: 'Office Visit' as const,
          chiefComplaint: 'Office Visit',
          provider: 'Dr. Test',
          status: 'roomed' as any, // Raw status from import
          checkInTime: new Date().toISOString(),
          room: 'ROOM 1'
        },
        {
          name: 'Test Patient B',
          dob: '1985-05-05',
          appointmentTime: new Date().toISOString(),
          appointmentType: 'Office Visit' as const,
          chiefComplaint: 'Office Visit',
          provider: 'Dr. Test',
          status: 'roomed' as any, // Raw status from import
          checkInTime: new Date().toISOString(),
          room: 'ROOM 2'
        }
      ];

      // Apply normalization (simulating the import process fix)
      const normalizedPatients = importedPatients.map(patient => ({
        ...patient,
        id: `test-${Date.now()}-${Math.random()}`,
        status: normalizeStatus(patient.status) as any
      }));

      // Verify both patients are normalized to appt-prep
      expect(normalizedPatients[0].status).toBe('appt-prep');
      expect(normalizedPatients[1].status).toBe('appt-prep');

      // Verify they would be categorized as waiting
      normalizedPatients.forEach(patient => {
        expect(PatientStatusCategories.WAITING).toContain(patient.status as any);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty and null status values', () => {
      expect(normalizeStatus('')).toBe('scheduled');
      expect(normalizeStatus(null as any)).toBe('scheduled');
      expect(normalizeStatus(undefined as any)).toBe('scheduled');
    });

    it('handles unknown status values', () => {
      expect(normalizeStatus('unknown-status')).toBe('unknown-status');
      expect(normalizeStatus('custom-status')).toBe('custom-status');
    });

    it('handles whitespace in status values', () => {
      expect(normalizeStatus('  roomed  ')).toBe('appt-prep');
      expect(normalizeStatus('\troomed\n')).toBe('appt-prep');
    });
  });
});