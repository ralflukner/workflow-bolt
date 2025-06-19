import React, { useRef, useEffect } from 'react';
import type { Patient } from '../types';
import { usePatientContext } from '../hooks/usePatientContext';

interface DebugTextWindowProps {
  scrollPosition?: number;
  onScroll?: (position: number) => void;
}

export const DebugTextWindow: React.FC<DebugTextWindowProps> = ({ 
  scrollPosition = 0, 
  onScroll 
}) => {
  const { patients, getWaitTime } = usePatientContext();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('[DebugTextWindow] Patients updated:', patients.length, 'patients');
    console.log('[DebugTextWindow] Patient data:', patients);
  }, [patients]);

  // Sync scroll position when it changes from parent
  useEffect(() => {
    if (textAreaRef.current && scrollPosition !== undefined) {
      const maxScroll = textAreaRef.current.scrollHeight - textAreaRef.current.clientHeight;
      textAreaRef.current.scrollTop = scrollPosition * maxScroll;
    }
  }, [scrollPosition]);

  // Handle local scroll and notify parent
  const handleScroll = () => {
    if (textAreaRef.current && onScroll) {
      const maxScroll = textAreaRef.current.scrollHeight - textAreaRef.current.clientHeight;
      const relativePosition = maxScroll > 0 ? textAreaRef.current.scrollTop / maxScroll : 0;
      onScroll(relativePosition);
    }
  };

  const formatPatientData = (patient: Patient): string => {
    const waitTime = getWaitTime(patient);
    const waitTimeStr = waitTime ? `Wait: ${waitTime}min` : '';
    
    return [
      `ID: ${patient.id}`,
      `Name: ${patient.name}`,
      `DOB: ${patient.dob}`,
      `Status: ${patient.status}`,
      `Provider: ${patient.provider}`,
      `Appt Time: ${patient.appointmentTime}`,
      patient.appointmentType ? `Type: ${patient.appointmentType}` : '',
      patient.chiefComplaint ? `Chief Complaint: ${patient.chiefComplaint}` : '',
      patient.room ? `Room: ${patient.room}` : '',
      patient.checkInTime ? `Check-in: ${patient.checkInTime}` : '',
      patient.withDoctorTime ? `With Doctor: ${patient.withDoctorTime}` : '',
      patient.completedTime ? `Completed: ${patient.completedTime}` : '',
      waitTimeStr,
      '---'
    ].filter(Boolean).join('\n');
  };

  const allPatientsText = patients
    .sort((a, b) => {
      // Sort by status order similar to how they appear in sections
      const statusOrder = [
        'scheduled', 'Confirmed', 'Rescheduled', 'arrived', 
        'appt-prep', 'ready-for-md', 'With Doctor', 
        'seen-by-md', 'completed', 'Cancelled', 'No Show'
      ];
      const aIndex = statusOrder.indexOf(a.status);
      const bIndex = statusOrder.indexOf(b.status);
      if (aIndex !== bIndex) return aIndex - bIndex;
      
      // Then by appointment time
      return a.appointmentTime.localeCompare(b.appointmentTime);
    })
    .map(formatPatientData)
    .join('\n\n');

  return (
    <div className="bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <div className="bg-gray-700 px-4 py-3">
        <h3 className="text-white font-semibold">Debug Text View</h3>
      </div>
      <div className="flex-1 p-4">
        <label htmlFor="debug-textarea" className="sr-only">
          Debug patient data text view
        </label>
        <textarea
          id="debug-textarea"
          ref={textAreaRef}
          value={allPatientsText}
          readOnly
          onScroll={handleScroll}
          className="w-full h-full bg-gray-900 text-gray-300 font-mono text-xs p-3 rounded border border-gray-700 resize-none min-h-[400px]"
          aria-label="Debug patient data text view"
        />
      </div>
    </div>
  );
};