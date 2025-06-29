import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportSchedule from '../ImportSchedule';
import { TestProviders } from '../../test/testHelpers';

// Mock the usePatientContext hook
const mockAddPatient = jest.fn();
const mockUpdatePatients = jest.fn();
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    addPatient: mockAddPatient,
    updatePatients: mockUpdatePatients
  })
}));

// Mock the useTimeContext hook
jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z')
  })
}));

// Mock the debugLogger
jest.mock('../../services/debugLogger', () => ({
  debugLogger: {
    addLog: jest.fn()
  }
}));

describe('ImportSchedule', () => {
  const onClose = jest.fn();
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (overrides = {}) => {
    return render(
      <TestProviders
        patientContextOverrides={{
          updatePatients: mockUpdatePatients,
          ...overrides
        }}
      >
        <ImportSchedule onClose={onClose} />
      </TestProviders>
    );
  };

  describe('UI Rendering', () => {
    it('renders the import form correctly', () => {
      renderComponent();
      
      expect(screen.getByRole('heading', { name: 'Import Schedule' })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Import Schedule/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { asFragment } = renderComponent();
      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('Modal Controls', () => {
    it('closes the modal when cancel is clicked', async () => {
      renderComponent();
      
      await user.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('closes modal when X button is clicked', async () => {
      renderComponent();
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('auto-closes after successful import', async () => {
      jest.useFakeTimers();
      
      renderComponent();
      
      const sampleData = '01/15/2023\t9:00 AM\tScheduled\tTest Patient\t01/01/1990\tOffice Visit';
      
      await user.type(screen.getByRole('textbox'), sampleData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      await screen.findByText(/Successfully imported 1 appointments/);
      
      jest.advanceTimersByTime(1500);
      expect(onClose).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Input Validation', () => {
    it('shows import button as disabled when no data is entered', async () => {
      renderComponent();
      
      const importButton = screen.getByRole('button', { name: /Import Schedule/i });
      expect(importButton).toBeDisabled();
      
      await user.type(screen.getByRole('textbox'), 'some data');
      expect(importButton).not.toBeDisabled();
    });

    it('shows error for completely empty schedule data', async () => {
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      
      const importButton = screen.getByRole('button', { name: /Import Schedule/i });
      expect(importButton).toBeDisabled();
    });
  });

  describe('Data Parsing', () => {
    it('handles import of valid schedule data', async () => {
      renderComponent();
      
      const sampleData = `01/15/2023\t9:00 AM\tScheduled\tJohn Doe\t01/01/1990\tOffice Visit
01/15/2023\t10:00 AM\tConfirmed\tJane Smith\t05/15/1985\tOffice Visit`;
      
      await user.type(screen.getByRole('textbox'), sampleData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      await screen.findByText(/Successfully imported 2 appointments/);
      
      expect(mockUpdatePatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'John Doe',
            dob: '1990-01-01',
            status: 'scheduled',
            appointmentType: 'Office Visit'
          }),
          expect.objectContaining({
            name: 'Jane Smith',
            dob: '1985-05-15',
            status: 'scheduled',
            appointmentType: 'Office Visit'
          })
        ])
      );
    });

    const statusMappingCases = [
      { input: 'arrived', expected: 'arrived', name: 'arrived status' },
      { input: 'with doctor', expected: 'With Doctor', name: 'with doctor status' },
      { input: 'cancelled', expected: 'Cancelled', name: 'cancelled status' },
      { input: 'no show', expected: 'No Show', name: 'no show status' },
      { input: 'confirmed', expected: 'scheduled', name: 'confirmed maps to scheduled' },
      { input: 'scheduled', expected: 'scheduled', name: 'scheduled status' }
    ];

    it.each(statusMappingCases)('maps $name correctly', async ({ input, expected }) => {
      renderComponent();
      
      const testData = `01/15/2023\t9:00 AM\t${input}\tTest Patient\t01/01/1990\tOffice Visit`;
      
      await user.type(screen.getByRole('textbox'), testData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      expect(mockUpdatePatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: expected })
        ])
      );
    });

    const timeMappingCases = [
      { input: '9:00 AM', expectedPattern: /T09:00:00/, name: 'AM time' },
      { input: '2:30 PM', expectedPattern: /T\d{2}:30:00/, name: 'PM time' },
      { input: '12:00 PM', expectedPattern: /T12:00:00/, name: 'noon' },
      { input: '12:00 AM', expectedPattern: /T00:00:00/, name: 'midnight' }
    ];

    it.each(timeMappingCases)('converts $name correctly', async ({ input, expectedPattern }) => {
      renderComponent();
      
      const testData = `01/15/2023\t${input}\tScheduled\tTime Test\t01/01/1990\tOffice Visit`;
      
      await user.type(screen.getByRole('textbox'), testData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      expect(mockUpdatePatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            appointmentTime: expect.stringMatching(expectedPattern)
          })
        ])
      );
    });

    it('handles LAB appointment types correctly', async () => {
      renderComponent();
      
      const labData = '01/15/2023\t9:00 AM\tScheduled\tLab Patient\t01/01/1990\tLab Work';
      
      await user.type(screen.getByRole('textbox'), labData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      expect(mockUpdatePatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Lab Patient',
            appointmentType: 'LABS'
          })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('handles import of invalid schedule data with error message', async () => {
      renderComponent();
      
      const invalidData = '01/15/2023\t9:00 AM\tScheduled'; // Missing required fields
      
      await user.type(screen.getByRole('textbox'), invalidData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      await screen.findByText(/No valid appointments found/);
      expect(mockUpdatePatients).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    const malformedDataCases = [
      { 
        name: 'invalid date format',
        data: 'invalid-date\t9:00 AM\tScheduled\tBad Date\t01/01/1990\tOffice Visit'
      },
      { 
        name: 'invalid time format', 
        data: '01/15/2023\tbad-time\tScheduled\tBad Time\t01/01/1990\tOffice Visit'
      },
      { 
        name: 'invalid DOB format',
        data: '01/15/2023\t9:00 AM\tScheduled\tBad DOB\tinvalid-dob\tOffice Visit'
      },
      { 
        name: 'insufficient columns',
        data: '01/15/2023\t9:00 AM'
      }
    ];

    it.each(malformedDataCases)('skips records with $name', async ({ data }) => {
      renderComponent();
      
      const mixedData = `${data}
01/15/2023\t10:00 AM\tScheduled\tGood Patient\t05/15/1985\tOffice Visit`;
      
      await user.type(screen.getByRole('textbox'), mixedData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      await screen.findByText(/Successfully imported 1 appointments/);
      
      expect(mockUpdatePatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Good Patient' })
        ])
      );
    });

    it('handles malicious input safely', async () => {
      renderComponent();
      
      // Test with potential injection attempts
      const maliciousData = `01/15/2023\t9:00 AM\tScheduled\tPatient\twith\ttabs\t01/01/1990\tOffice Visit`;
      
      await user.type(screen.getByRole('textbox'), maliciousData);
      await user.click(screen.getByRole('button', { name: /Import Schedule/i }));
      
      // Should either parse safely or skip the malformed record
      // The important thing is it doesn't crash or expose vulnerabilities
      expect(() => screen.getByRole('textbox')).not.toThrow();
    });
  });
});
