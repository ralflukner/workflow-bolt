import { Patient, AppointmentType } from '../types';
import { TebraAppointment, TebraPatient, TebraProvider } from './tebra-api-service.types';

export class TebraDataTransformer {
  static combineToInternalPatient(
    appointment: TebraAppointment,
    patient: TebraPatient,
    providers: TebraProvider[]
  ): Patient {
    const provider = providers.find(p => p.ProviderId === appointment.ProviderId);
    
    // Map appointment type to internal AppointmentType
    const appointmentType: AppointmentType | undefined = 
      appointment.AppointmentType === 'Office Visit' || appointment.AppointmentType === 'LABS' 
        ? appointment.AppointmentType as AppointmentType
        : 'Office Visit'; // Default fallback
    
    return {
      id: patient.PatientId,
      name: `${patient.FirstName} ${patient.LastName}`,
      dob: patient.DateOfBirth,
      appointmentTime: `${appointment.AppointmentDate}T${appointment.AppointmentTime}`,
      appointmentType,
      provider: provider ? `${provider.Title} ${provider.FirstName} ${provider.LastName}` : 'Unknown Provider',
      status: 'scheduled',
      checkInTime: undefined,
      room: undefined
    };
  }
} 