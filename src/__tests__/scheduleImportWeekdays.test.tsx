import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportSchedule from '../components/ImportSchedule';
import { TestProviders } from '../test/testHelpers';
import { jest } from '@jest/globals';

describe('Schedule Import Weekday Functionality', () => {
  const mockOnClose = jest.fn();
  
  const mondayScheduleData = 
    'Patient\tDOB\tAppt Date\tAppt Time\tProvider\tAppt Type\tStatus\tReason\tDuration\tPatient ID\tChart ID\tNotes\n' +
    'Smith, John\t01/15/1980\t05/20/2024\t9:00 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t12345\tC-12345\tMonday appointment\n' +
    'Johnson, Mary\t02/20/1975\t05/20/2024\t10:30 AM\tDr. Lukner\tConsultation\tConfirmed\tNew patient\t45\t23456\tC-23456\tMonday appointment';

  const tuesdayScheduleData = 
    'Patient\tDOB\tAppt Date\tAppt Time\tProvider\tAppt Type\tStatus\tReason\tDuration\tPatient ID\tChart ID\tNotes\n' +
    'Williams, Robert\t03/10/1990\t05/21/2024\t8:30 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t34567\tC-34567\tTuesday appointment\n' +
    'Brown, Patricia\t04/05/1985\t05/21/2024\t11:00 AM\tDr. Lukner\tProcedure\tConfirmed\tMinor surgery\t60\t45678\tC-45678\tTuesday appointment';

  const wednesdayScheduleData = 
    'Patient\tDOB\tAppt Date\tAppt Time\tProvider\tAppt Type\tStatus\tReason\tDuration\tPatient ID\tChart ID\tNotes\n' +
    'Jones, David\t05/25/1970\t05/22/2024\t9:15 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t56789\tC-56789\tWednesday appointment\n' +
    'Miller, Jennifer\t06/15/1982\t05/22/2024\t1:30 PM\tDr. Lukner\tConsultation\tConfirmed\tSecond opinion\t45\t67890\tC-67890\tWednesday appointment';

  const thursdayScheduleData = 
    'Patient\tDOB\tAppt Date\tAppt Time\tProvider\tAppt Type\tStatus\tReason\tDuration\tPatient ID\tChart ID\tNotes\n' +
    'Davis, Michael\t07/30/1965\t05/23/2024\t10:00 AM\tDr. Lukner\tOffice Visit\tScheduled\tAnnual physical\t60\t78901\tC-78901\tThursday appointment\n' +
    'Wilson, Elizabeth\t08/12/1978\t05/23/2024\t2:45 PM\tDr. Lukner\tFollow-up\tConfirmed\tTest results\t30\t89012\tC-89012\tThursday appointment';

  const renderWithSimulatedTime = (date: string) => {
    const simulatedDate = new Date(date);
    const getCurrentTimeMock = jest.fn(() => simulatedDate);
    
    return render(
      <TestProviders
        timeContextOverrides={{
          timeMode: { 
            simulated: true, 
            currentTime: simulatedDate.toISOString() 
          },
          getCurrentTime: getCurrentTimeMock
        }}
      >
        <ImportSchedule onClose={mockOnClose} />
      </TestProviders>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly import schedule on Monday', async () => {
    renderWithSimulatedTime('2024-05-20T09:00:00.000Z');
    
    const textarea = screen.getByPlaceholderText(/MM\/DD\/YYYY.*9:00AM.*Confirmed.*PATIENT NAME/i);
    const importButton = screen.getByRole('button', { name: /Import Schedule/i });
    
    fireEvent.change(textarea, { target: { value: mondayScheduleData } });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Smith, John/i)).toBeInTheDocument();
      expect(screen.getByText(/Johnson, Mary/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Monday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();
  });

  it('should correctly import schedule on Tuesday', async () => {
    renderWithSimulatedTime('2024-05-21T09:00:00.000Z');
    
    const textarea = screen.getByPlaceholderText(/MM\/DD\/YYYY.*9:00AM.*Confirmed.*PATIENT NAME/i);
    const importButton = screen.getByRole('button', { name: /Import Schedule/i });
    
    fireEvent.change(textarea, { target: { value: tuesdayScheduleData } });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Williams, Robert/i)).toBeInTheDocument();
      expect(screen.getByText(/Brown, Patricia/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Tuesday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/8:30 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/11:00 AM/i)).toBeInTheDocument();
  });

  it('should correctly import schedule on Wednesday', async () => {
    renderWithSimulatedTime('2024-05-22T09:00:00.000Z');
    
    const textarea = screen.getByPlaceholderText(/MM\/DD\/YYYY.*9:00AM.*Confirmed.*PATIENT NAME/i);
    const importButton = screen.getByRole('button', { name: /Import Schedule/i });
    
    fireEvent.change(textarea, { target: { value: wednesdayScheduleData } });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Jones, David/i)).toBeInTheDocument();
      expect(screen.getByText(/Miller, Jennifer/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Wednesday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/9:15 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/1:30 PM/i)).toBeInTheDocument();
  });

  it('should correctly import schedule on Thursday', async () => {
    renderWithSimulatedTime('2024-05-23T09:00:00.000Z');
    
    const textarea = screen.getByPlaceholderText(/MM\/DD\/YYYY.*9:00AM.*Confirmed.*PATIENT NAME/i);
    const importButton = screen.getByRole('button', { name: /Import Schedule/i });
    
    fireEvent.change(textarea, { target: { value: thursdayScheduleData } });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Davis, Michael/i)).toBeInTheDocument();
      expect(screen.getByText(/Wilson, Elizabeth/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Thursday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/2:45 PM/i)).toBeInTheDocument();
  });

  it('should handle mixed weekday schedule data correctly', async () => {
    renderWithSimulatedTime('2024-05-20T09:00:00.000Z');
    
    const mixedScheduleData = 
      'Patient\tDOB\tAppt Date\tAppt Time\tProvider\tAppt Type\tStatus\tReason\tDuration\tPatient ID\tChart ID\tNotes\n' +
      'Smith, John\t01/15/1980\t05/20/2024\t9:00 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t12345\tC-12345\tMonday appointment\n' +
      'Williams, Robert\t03/10/1990\t05/21/2024\t8:30 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t34567\tC-34567\tTuesday appointment\n' +
      'Jones, David\t05/25/1970\t05/22/2024\t9:15 AM\tDr. Lukner\tOffice Visit\tScheduled\tFollow-up\t30\t56789\tC-56789\tWednesday appointment\n' +
      'Davis, Michael\t07/30/1965\t05/23/2024\t10:00 AM\tDr. Lukner\tOffice Visit\tScheduled\tAnnual physical\t60\t78901\tC-78901\tThursday appointment';
    
    const textarea = screen.getByPlaceholderText(/MM\/DD\/YYYY.*9:00AM.*Confirmed.*PATIENT NAME/i);
    const importButton = screen.getByRole('button', { name: /Import Schedule/i });
    
    fireEvent.change(textarea, { target: { value: mixedScheduleData } });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Smith, John/i)).toBeInTheDocument();
      expect(screen.getByText(/Williams, Robert/i)).toBeInTheDocument();
      expect(screen.getByText(/Jones, David/i)).toBeInTheDocument();
      expect(screen.getByText(/Davis, Michael/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Monday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Tuesday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Wednesday appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Thursday appointment/i)).toBeInTheDocument();
  });
});
