import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewPatientForm from '../NewPatientForm';
import { TestProviders } from '../../test/testHelpers';

describe('NewPatientForm', () => {
  const mockAddPatient = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          addPatient: mockAddPatient
        }}
      >
        <NewPatientForm onClose={mockOnClose} />
      </TestProviders>
    );
    
    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Appointment Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Appointment Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Provider/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Add Patient/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          addPatient: mockAddPatient
        }}
      >
        <NewPatientForm onClose={mockOnClose} />
      </TestProviders>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Add Patient/i }));
    
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Date of Birth is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Appointment Time is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider is required/i)).toBeInTheDocument();
    
    expect(mockAddPatient).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          addPatient: mockAddPatient
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <NewPatientForm onClose={mockOnClose} />
      </TestProviders>
    );
    
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Appointment Time/i), { target: { value: '2023-01-01T11:00' } });
    fireEvent.change(screen.getByLabelText(/Appointment Type/i), { target: { value: 'Office Visit' } });
    fireEvent.change(screen.getByLabelText(/Provider/i), { target: { value: 'Dr. Smith' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Add Patient/i }));
    
    expect(mockAddPatient).toHaveBeenCalledWith(expect.objectContaining({
      name: 'John Doe',
      dob: '1990-01-01',
      appointmentTime: expect.any(String),
      appointmentType: 'Office Visit',
      provider: 'Dr. Smith',
      status: 'scheduled'
    }));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes the form when cancel is clicked', () => {
    render(
      <TestProviders>
        <NewPatientForm onClose={mockOnClose} />
      </TestProviders>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockOnClose).toHaveBeenCalled();
    
    expect(mockAddPatient).not.toHaveBeenCalled();
  });
});
