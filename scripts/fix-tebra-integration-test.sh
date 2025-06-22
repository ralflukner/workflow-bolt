#!/opt/homebrew/bin/bash
# scripts/fix-tebra-integration-test.sh

set -e

echo "🔧 Fixing TebraIntegration test..."
echo "================================="
echo ""

# Update the test to match the actual component behavior
cat > /tmp/test-fix.tsx << 'TSX_EOF'
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TebraIntegration from '../TebraIntegration';
import { usePatientContext } from '../../context/PatientContext';
import * as tebraService from '../../services/tebraService';

// Mock the patient context
jest.mock('../../context/PatientContext');

// Mock the tebraService
jest.mock('../../services/tebraService');

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('TebraIntegration Component', () => {
  const mockPatients = [
    {
      id: '1',
      name: 'John Doe',
      dateOfBirth: '1980-01-01',
      arrivalTime: new Date().toISOString(),
      appointmentTime: new Date().toISOString(),
      appointmentType: 'Regular',
      status: 'waiting' as const,
      waitTimeMinutes: 0
    }
  ];

  const mockContextValue = {
    patients: mockPatients,
    addPatient: jest.fn(),
    updatePatient: jest.fn(),
    deletePatient: jest.fn(),
    bulkImportPatients: jest.fn(),
    clearAllPatients: jest.fn(),
    exportData: jest.fn(() => JSON.stringify(mockPatients)),
    importData: jest.fn(),
    updateMultiplePatients: jest.fn(),
    exportEncryptedData: jest.fn(),
    importEncryptedData: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientContext as jest.Mock).mockReturnValue(mockContextValue);

    // Mock tebraService methods
    (tebraService.checkTebraConfig as jest.Mock).mockReturnValue({
      isValid: true,
      isFallback: true,
      details: {
        hasUsername: true,
        hasPassword: true,
        hasCustomerKey: true,
        hasWsdlUrl: true
      }
    });

    (tebraService.isFallbackMode as jest.Mock).mockReturnValue(true);
    (tebraService.getAppointmentsByDateFallback as jest.Mock).mockResolvedValue(mockPatients);
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('shows fallback mode when in fallback mode', () => {
    render(<TebraIntegration />);

    expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
    // Check for actual content shown in fallback mode
    expect(screen.getByText('Using Fallback Data')).toBeInTheDocument();
  });

  it('handles import from Tebra in fallback mode', async () => {
    render(<TebraIntegration />);

    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(tebraService.getAppointmentsByDateFallback).toHaveBeenCalled();
      expect(mockContextValue.bulkImportPatients).toHaveBeenCalledWith(mockPatients);
    });
  });

  it('handles export to Tebra', () => {
    render(<TebraIntegration />);

    const exportButton = screen.getByText('Export to Tebra');
    fireEvent.click(exportButton);

    expect(mockContextValue.exportData).toHaveBeenCalled();
  });

  it('shows correct user info', () => {
    render(<TebraIntegration />);

    expect(screen.getByText(/\*\*\*@luknerclinic.com/)).toBeInTheDocument();
  });

  it('shows rate limiting information', () => {
    render(<TebraIntegration />);

    expect(screen.getByText('Rate Limiting')).toBeInTheDocument();
    expect(screen.getByText(/Tebra API rate limits are automatically enforced/)).toBeInTheDocument();
  });
});
TSX_EOF

# Replace the test file
cp src/components/__tests__/TebraIntegration.test.tsx src/components/__tests__/TebraIntegration.test.tsx.backup
mv /tmp/test-fix.tsx src/components/__tests__/TebraIntegration.test.tsx

echo "✅ Updated TebraIntegration test"
echo ""
echo "🧪 Running the updated test..."
npm test -- src/components/__tests__/TebraIntegration.test.tsx