import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, PatientApptStatus, AppointmentType } from '../types';
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

      // Extract all parts, with check-in time and room being optional (last columns)
      const [date, time, status, name, dob, type, chiefComplaint, checkInTimeStr, roomStr] = parts;

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

      // Convert status to proper PatientApptStatus type
      const externalStatus = status.trim() as PatientApptStatus;

      // Map external status to internal workflow status
      let patientStatus: PatientApptStatus = 'scheduled';
      const statusLower = externalStatus.toLowerCase();
      
      if (['confirmed', 'scheduled', 'reminder sent'].includes(statusLower)) {
        patientStatus = 'scheduled';
      } else if (['arrived', 'checked in'].includes(statusLower)) {
        patientStatus = 'arrived';
      } else if (['roomed', 'appt prep started'].includes(statusLower)) {
        patientStatus = 'appt-prep';
      } else if (statusLower === 'ready for md') {
        patientStatus = 'ready-for-md';
      } else if (statusLower === 'with doctor') {
        patientStatus = 'With Doctor';
      } else if (statusLower === 'seen by md') {
        patientStatus = 'seen-by-md';
      } else if (['checked out', 'checkedout'].includes(statusLower)) {
        patientStatus = 'completed';
      } else if (statusLower === 'rescheduled') {
        patientStatus = 'Rescheduled';
      } else if (['cancelled', 'canceled'].includes(statusLower)) {
        patientStatus = 'Cancelled';
      } else if (statusLower === 'no show') {
        patientStatus = 'No Show';
      }

      // Set check-in time for patients who have already checked in
      let checkInTime = undefined;
      let room = undefined;

      // Parse check-in time from import data if available
      if (checkInTimeStr && ['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'].includes(patientStatus)) {
        // Parse the check-in time (format: "12:31 PM")
        const checkInMatch = checkInTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (checkInMatch) {
          const [, checkInHours, checkInMinutes, checkInPeriod] = checkInMatch;
          let checkInHour = parseInt(checkInHours);
          const isCheckInPM = checkInPeriod.toUpperCase() === 'PM';

          if (isCheckInPM && checkInHour !== 12) {
            checkInHour += 12;
          } else if (!isCheckInPM && checkInHour === 12) {
            checkInHour = 0;
          }

          // Create check-in time using the appointment date but with check-in time
          const checkInDate = new Date(
            parseInt(appointmentYear), 
            parseInt(appointmentMonth) - 1,
            parseInt(appointmentDay),
            checkInHour,
            parseInt(checkInMinutes),
            0,
            0
          );

          checkInTime = checkInDate.toISOString();
        }
      }

      // Use room from import data if available, otherwise assign a default room for patients who are in a room
      if (roomStr) {
        room = roomStr.trim();
      } else if (['appt-prep', 'ready-for-md', 'With Doctor'].includes(patientStatus)) {
        room = 'Waiting'; // Default room assignment
      }

      patients.push({
        name: name.trim(),
        dob: formattedDOB,
        appointmentTime: appointmentDate.toISOString(),
        appointmentType: type as AppointmentType,
        chiefComplaint: chiefComplaint.trim(),
        provider: 'Dr. Lukner',
        status: patientStatus,
        checkInTime,
        room,
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

      // Show a success message briefly then close
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
            placeholder="MM/DD/YYYY&#9;9:00AM&#9;Confirmed&#9;PATIENT NAME&#9;MM/DD/YYYY&#9;Office Visit&#9;Follow-Up&#9;12:31 PM&#9;Room 1"
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
