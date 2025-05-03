import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, AppointmentStatus, AppointmentType } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface ImportScheduleProps {
  onClose: () => void;
}

const ImportSchedule: React.FC<ImportScheduleProps> = ({ onClose }) => {
  const { addPatient, clearPatients } = usePatientContext();
  const [scheduleText, setScheduleText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const parseSchedule = (text: string) => {
    const lines = text.trim().split('\n');
    const patients: Omit<Patient, 'id'>[] = [];

    for (const line of lines) {
      const parts = line.trim().split('\t');
      if (parts.length < 7) continue;

      const [date, time, status, name, dob, type, visitType] = parts;

      // Parse time
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) continue;

      const [, hours, minutes, period] = timeMatch;
      let hour = parseInt(hours);
      const isPM = period.toUpperCase() === 'PM';

      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }

      // Parse date
      const [month, day, year] = dob.split('/');
      const formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Parse appointment date (MM/DD/YYYY)
      const [appointmentMonth, appointmentDay, appointmentYear] = date.split('/');

      // Create appointment time
      const appointmentDate = new Date(
        parseInt(appointmentYear), 
        parseInt(appointmentMonth) - 1, // Month is 0-indexed in JavaScript
        parseInt(appointmentDay),
        hour, 
        parseInt(minutes), 
        0, 
        0
      );

      // Convert status to proper AppointmentStatus type
      const appointmentStatus = status.trim() as AppointmentStatus;

      // Map AppointmentStatus to PatientStatus
      let patientStatus = 'scheduled' as const;
      if (appointmentStatus === 'Confirmed' || appointmentStatus === 'Scheduled' || appointmentStatus === 'Reminder Sent') {
        patientStatus = 'scheduled';
      } else if (appointmentStatus === 'Arrived' || appointmentStatus === 'Checked In') {
        patientStatus = 'arrived';
      } else if (appointmentStatus === 'Roomed' || appointmentStatus === 'Appt Prep Started') {
        patientStatus = 'appt-prep';
      } else if (appointmentStatus === 'Ready for MD') {
        patientStatus = 'ready-for-md';
      } else if (appointmentStatus === 'Seen by MD') {
        patientStatus = 'seen-by-md';
      } else if (appointmentStatus === 'Checked Out') {
        patientStatus = 'completed';
      } else if (appointmentStatus === 'No Show' || appointmentStatus === 'Rescheduled' || appointmentStatus === 'Cancelled') {
        patientStatus = 'completed'; // Marking these as completed since they're no longer active
      }

      patients.push({
        name: name.trim(),
        dob: formattedDOB,
        appointmentTime: appointmentDate.toISOString(),
        appointmentType: type as AppointmentType,
        visitType: visitType.trim(),
        provider: 'Dr. Lukner',
        status: patientStatus,
      });
    }

    return patients;
  };

  const handleImport = () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const patients = parseSchedule(scheduleText);

      if (patients.length === 0) {
        setError('No valid appointments found in the schedule.');
        return;
      }

      // Clear existing patients before importing new ones
      clearPatients();

      for (const patient of patients) {
        addPatient(patient);
      }

      setSuccess(`Successfully imported ${patients.length} appointments`);

      // Show success message briefly then close
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse schedule. Please check the format.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Import Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={processing}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">
            Paste schedule data (tab-separated):
          </label>
          <textarea
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            className={`w-full h-64 bg-gray-700 text-white border rounded p-2 font-mono ${
              error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-600'
            }`}
            placeholder="MM/DD/YYYY&#9;9:00AM&#9;Confirmed&#9;PATIENT NAME&#9;MM/DD/YYYY&#9;Office Visit&#9;Follow-Up"
            disabled={processing}
          />
        </div>

        {(error || success) && (
          <div className={`flex items-center gap-2 mb-4 ${error ? 'text-red-400' : 'text-green-400'}`}>
            {error ? <AlertCircle size={18} /> : <Check size={18} />}
            <p>{error || success}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors ${success ? 'hidden' : ''}`}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={success ? onClose : handleImport}
            disabled={!scheduleText.trim() || processing}
            className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${
              processing ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {processing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <>
                {success ? 'Close' : 'Import Schedule'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportSchedule;
