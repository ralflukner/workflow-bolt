import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Patient } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { debugLogger } from '../services/debugLogger';
import { parseSchedule } from '../utils/parseSchedule';

interface ImportScheduleProps {
  onClose: () => void;
}

// Status constants to prevent string drift
const STATUS_CONFIRMED = ['confirmed', 'scheduled', 'reminder sent'];
const STATUS_ARRIVED = ['arrived', 'checked in'];
const STATUS_APPT_PREP = ['roomed', 'appt prep started'];
const STATUS_CHECKED_OUT = ['checked out', 'checkedout'];
const STATUS_CANCELLED = ['cancelled', 'canceled'];
const HAS_CHECKED_IN = ['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'];
const STATUS_IN_ROOM = ['appt-prep', 'ready-for-md', 'With Doctor'];

const ImportSchedule: React.FC<ImportScheduleProps> = ({ onClose }) => {
  const { updatePatients } = usePatientContext();
  const [scheduleText, setScheduleText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const addLog = (message: string) => {
    debugLogger.addLog(message, 'ImportSchedule');
  };

  const parseSchedule = (text: string) => {
    const lines = text.trim().split('\n');
    const patients: Omit<Patient, 'id'>[] = [];

    addLog(`Processing ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.trim().split('\t');
      addLog(`Line ${i + 1}: ${parts.length} parts: [${parts.slice(0, 6).join(', ')}]`);
      
      if (parts.length < 6) {
        addLog(`Skipping line ${i + 1}: not enough columns (${parts.length})`);
        continue;
      }

      // Extract parts based on your actual data format
      // Format: Date, Time, Status, Name, DOB, Type, [more columns], Insurance, Amount
      const [date, time, status, name, dob, type] = parts;
      
      // Use the appointment type or default to "Office Visit"
      const chiefComplaint = type || "Follow-up";
      const checkInTimeStr = undefined; // Not present in this format
      const roomStr = undefined; // Not present in this format

      // Parse time
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        addLog(`Skipping line ${i + 1}: invalid time format "${time}"`);
        continue;
      }

      const [, hours, minutes, period] = timeMatch;
      let hour = parseInt(hours);
      const isPM = period.toUpperCase() === 'PM';

      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }

      // Parse date
      const dobParts = dob.split('/');
      if (dobParts.length !== 3) {
        addLog(`Skipping line ${i + 1}: invalid DOB format "${dob}"`);
        continue;
      }
      const [month, day, year] = dobParts;
      const formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Parse appointment date (MM/DD/YYYY)
      const dateParts = date.split('/');
      if (dateParts.length !== 3) {
        addLog(`Skipping line ${i + 1}: invalid date format "${date}"`);
        continue;
      }
      const [appointmentMonth, appointmentDay, appointmentYear] = dateParts;

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
      
      if (STATUS_CONFIRMED.includes(statusLower)) {
        patientStatus = 'scheduled';
      } else if (STATUS_ARRIVED.includes(statusLower)) {
        patientStatus = 'arrived';
      } else if (STATUS_APPT_PREP.includes(statusLower)) {
        patientStatus = 'appt-prep';
      } else if (statusLower === 'ready for md') {
        patientStatus = 'ready-for-md';
      } else if (statusLower === 'with doctor') {
        patientStatus = 'With Doctor';
      } else if (statusLower === 'seen by md') {
        patientStatus = 'seen-by-md';
      } else if (STATUS_CHECKED_OUT.includes(statusLower)) {
        patientStatus = 'completed';
      } else if (statusLower === 'rescheduled') {
        patientStatus = 'Rescheduled';
      } else if (STATUS_CANCELLED.includes(statusLower)) {
        patientStatus = 'Cancelled';
      } else if (statusLower === 'no show') {
        patientStatus = 'No Show';
      }

      // Set check-in time for patients who have already checked in
      let checkInTime = undefined;
      let room = undefined;

      // Check if this patient has checked in (based on status)
      const hasCheckedIn = HAS_CHECKED_IN.includes(patientStatus);
      
      if (hasCheckedIn) {
        if (checkInTimeStr) {
          // Parse check-in time from import data if available (format: "12:31 PM")
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
          } else {
            // Fallback: If checkInTimeStr exists but regex fails, 
            // set check-in time to 30 minutes before appointment
            const fallbackCheckInTime = new Date(appointmentDate);
            fallbackCheckInTime.setMinutes(fallbackCheckInTime.getMinutes() - 30);
            checkInTime = fallbackCheckInTime.toISOString();
          }
        } else {
          // If no explicit check-in time but patient has checked in status,
          // set check-in time to 30 minutes before appointment for testing
          const defaultCheckInTime = new Date(appointmentDate);
          defaultCheckInTime.setMinutes(defaultCheckInTime.getMinutes() - 30);
          checkInTime = defaultCheckInTime.toISOString();
        }
      }

      // Use room from import data if available, otherwise assign a default room for patients who are in a room
      if (roomStr) {
        room = roomStr.trim();
      } else if (STATUS_IN_ROOM.includes(patientStatus)) {
        room = 'Waiting'; // Default room assignment
      }

      // Map appointment type to valid enum values
      let appointmentType: AppointmentType = 'Office Visit';
      if (type && type.toLowerCase().includes('lab')) {
        appointmentType = 'LABS';
      }

      const patient = {
        name: name.trim(),
        dob: formattedDOB,
        appointmentTime: appointmentDate.toISOString(),
        appointmentType,
        chiefComplaint: chiefComplaint.trim(),
        provider: 'Dr. Lukner',
        status: patientStatus,
        checkInTime,
        room,
      };
      
      patients.push(patient);
      addLog(`Successfully parsed line ${i + 1}: ${patient.name} - ${patient.status}`);
    }

    return patients;
  };

  const handleImport = () => {
    addLog('🎯 Starting import process...');
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      addLog('📋 About to parse schedule text: ' + scheduleText.substring(0, 100) + '...');
      const patients = parseSchedule(scheduleText);

      addLog(`✅ Parsing complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        addLog('❌ No valid appointments found');
        setError('No valid appointments found in the schedule.');
        return;
      }

      // Add unique IDs to all patients
      addLog(`🏷️ Adding unique IDs to ${patients.length} patients`);
      const patientsWithIds = patients.map(patientData => ({
        ...patientData,
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      // Update all patients at once to avoid race conditions
      addLog(`➕ Updating context with all ${patientsWithIds.length} patients at once`);
      updatePatients(patientsWithIds);

      addLog('✅ Import process completed successfully');
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
            placeholder="06/28/2025&#9;09:00 AM&#9;Confirmed&#9;TONYA LEWIS&#9;04/03/1956&#9;Office Visit&#9;INSURANCE 2025&#9;$0.00"
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
