import '@testing-library/jest-dom';

import { describe, it, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ImportSchedule from '../ImportSchedule';
import { TestProviders } from '../../test/testHelpers';

// Mock debugLogger to silence log output in tests
jest.mock('../../services/debugLogger', () => ({
  debugLogger: { addLog: jest.fn() },
}));

// Sample valid TSV schedule line (tab separated)
const VALID_SCHEDULE =
  '06/28/2025\t09:00 AM\tConfirmed\tTONYA LEWIS\t04/03/1956\tOffice Visit\tINSURANCE 2025\t$0.00';

// Malformed schedule (missing columns)
const INVALID_SCHEDULE = '06/28/2025\t09:00 AM';

function renderImportSchedule(overrides = {}) {
  const mockOnClose = jest.fn();
  const mockUpdatePatients: any = jest.fn();

  render(
    <TestProviders patientContextOverrides={{ updatePatients: mockUpdatePatients, ...overrides }}>
      <ImportSchedule onClose={mockOnClose} />
    </TestProviders>,
  );

  return { mockOnClose, mockUpdatePatients };
}

describe('ImportSchedule component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('imports valid schedule data and updates patient context', async () => {
    const { mockOnClose, mockUpdatePatients } = renderImportSchedule();

    // Enter schedule text
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: VALID_SCHEDULE } });

    // Click Import button
    fireEvent.click(screen.getByRole('button', { name: /Import Schedule/i }));

    // Wait for context update
    await waitFor(() => {
      expect(mockUpdatePatients).toHaveBeenCalledTimes(1);
    });

    const patients = mockUpdatePatients.mock.calls[0][0] as any[];
    expect(patients).toHaveLength(1);
    expect(patients[0]).toMatchObject({ name: 'TONYA LEWIS', status: 'scheduled' });

    // Success message is shown
    expect(
      screen.getByText(/Successfully imported 1 appointments?/i),
    ).toBeInTheDocument();

    // Auto-close after timeout
    jest.advanceTimersByTime(1500);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error and does not update patients on invalid schedule', async () => {
    const { mockUpdatePatients } = renderImportSchedule();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: INVALID_SCHEDULE } });
    fireEvent.click(screen.getByRole('button', { name: /Import Schedule/i }));

    await waitFor(() => {
      expect(screen.getByText(/No valid appointments found/i)).toBeInTheDocument();
    });

    expect(mockUpdatePatients).not.toHaveBeenCalled();
  });
});
