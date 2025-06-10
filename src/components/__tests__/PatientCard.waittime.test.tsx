import { render, screen } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { Patient } from '../../types';

describe('PatientCard Wait Time Display', () => {
  const mockPatient: Patient = {
    id: '123',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2025-06-05T09:00:00',
    status: 'arrived',
    provider: 'Dr. Test',
    checkInTime: new Date('2025-06-05T09:30:00').toISOString()
  };

  it('should display wait time correctly', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });
});
