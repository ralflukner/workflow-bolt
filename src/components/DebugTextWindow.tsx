import React from 'react';
import type { Patient } from '../types';
// import { usePatientContext } from '../hooks/usePatientContext';

interface DebugTextWindowProps {
  scrollPosition?: number;
  onScroll?: (position: number) => void;
  patients: Patient[];
  getWaitTime: (patient: Patient) => number | undefined;
}

// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
export class DebugTextWindow extends React.Component<DebugTextWindowProps> {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;

  constructor(props: DebugTextWindowProps) {
    super(props);
    this.textAreaRef = React.createRef();
  }

  componentDidUpdate(prevProps: DebugTextWindowProps) {
    // Log patient updates for debugging
    if (this.props.patients !== prevProps.patients) {
      console.log('[DebugTextWindow] Patients updated:', this.props.patients.length, 'patients');
      console.log('[DebugTextWindow] Patient data:', this.props.patients);
    }
    // Sync scroll position when it changes from parent
    if (
      this.props.scrollPosition !== undefined &&
      this.props.scrollPosition !== prevProps.scrollPosition &&
      this.textAreaRef.current
    ) {
      const maxScroll = this.textAreaRef.current.scrollHeight - this.textAreaRef.current.clientHeight;
      this.textAreaRef.current.scrollTop = this.props.scrollPosition * maxScroll;
    }
  }

  handleScroll = () => {
    const { onScroll } = this.props;
    if (this.textAreaRef.current && onScroll) {
      const maxScroll = this.textAreaRef.current.scrollHeight - this.textAreaRef.current.clientHeight;
      const relativePosition = maxScroll > 0 ? this.textAreaRef.current.scrollTop / maxScroll : 0;
      onScroll(relativePosition);
    }
  };

  formatPatientData = (patient: Patient): string => {
    const waitTime = this.props.getWaitTime(patient);
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

  render() {
    const { patients } = this.props;
    const allPatientsText = patients
      .sort((a, b) => {
        // Sort by status order similar to how they appear in sections
        const statusOrder = [
          'scheduled', 'Confirmed', 'arrived', 
          'appt-prep', 'ready-for-md', 'With Doctor', 
          'seen-by-md', 'completed', 'Rescheduled', 'Cancelled', 'No Show'
        ];
        const aIndex = statusOrder.indexOf(a.status);
        const bIndex = statusOrder.indexOf(b.status);
        if (aIndex !== bIndex) return aIndex - bIndex;
        // Then by appointment time
        return a.appointmentTime.localeCompare(b.appointmentTime);
      })
      .map(this.formatPatientData)
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
            ref={this.textAreaRef}
            value={allPatientsText}
            readOnly
            onScroll={this.handleScroll}
            className="w-full h-full bg-gray-900 text-gray-300 font-mono text-xs p-3 rounded border border-gray-700 resize-none min-h-[400px]"
            aria-label="Debug patient data text view"
          />
        </div>
      </div>
    );
  }
}