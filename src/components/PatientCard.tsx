import React, { useState } from 'react';
import { Patient, PatientApptStatus } from '../types';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const { updatePatientStatus, assignRoom, updateCheckInTime, getWaitTime } = usePatientContext();
  const { formatDateTime, formatTime, getCurrentTime } = useTimeContext();
  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [checkInDateInput, setCheckInDateInput] = useState('');
  const [checkInTimeInput, setCheckInTimeInput] = useState('');

  const appointmentDate = new Date(patient.appointmentTime);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'arrived': return 'bg-amber-500';
      case 'appt-prep': return 'bg-purple-500';
      case 'ready-for-md': return 'bg-cyan-500';
      case 'With Doctor': return 'bg-blue-500';
      case 'seen-by-md': return 'bg-teal-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBorderColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'border-gray-500';
      case 'arrived': return 'border-amber-500';
      case 'appt-prep': return 'border-purple-500';
      case 'ready-for-md': return 'border-cyan-500';
      case 'With Doctor': return 'border-blue-500';
      case 'seen-by-md': return 'border-teal-500';
      case 'completed': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    assignRoom(patient.id, e.target.value);
  };

  const handleEditCheckIn = (): void => {
    if (patient.checkInTime) {
      const checkInDate = new Date(patient.checkInTime);
      // Format date as YYYY-MM-DD for input
      setCheckInDateInput(checkInDate.toISOString().split('T')[0]);
      // Format time as HH:MM for input
      setCheckInTimeInput(checkInDate.toTimeString().substring(0, 5));
    } else {
      const now = getCurrentTime();
      setCheckInDateInput(now.toISOString().split('T')[0]);
      setCheckInTimeInput(now.toTimeString().substring(0, 5));
    }
    setIsEditingCheckIn(true);
  };

  const handleSaveCheckIn = (): void => {
    if (checkInDateInput && checkInTimeInput) {
      // Combine date and time into ISO string
      const newCheckInTime = new Date(`${checkInDateInput}T${checkInTimeInput}:00`);
      updateCheckInTime(patient.id, newCheckInTime.toISOString());
      setIsEditingCheckIn(false);
    }
  };

  const handleCancelCheckIn = (): void => {
    setIsEditingCheckIn(false);
  };

  const getWaitTimeDisplay = (currentWaitTime: number): string => {
    const time = currentWaitTime;
    if (patient.completedTime) {
      return `Total: ${time} min`;
    }
    return `Wait: ${time} min`;
  };

  interface ActionButton {
    nextStatus: PatientApptStatus;
    label: string;
    color: string;
  }

  const getActionButton = (): ActionButton | null => {
    switch (patient.status) {
      case 'scheduled':
        return {
          nextStatus: 'arrived',
          label: 'Check In',
          color: 'amber'
        };
      case 'arrived':
        return {
          nextStatus: 'appt-prep',
          label: 'Start Prep',
          color: 'purple'
        };
      case 'appt-prep':
        return {
          nextStatus: 'ready-for-md',
          label: 'Prep Complete',
          color: 'cyan'
        };
      case 'ready-for-md':
        return {
          nextStatus: 'With Doctor',
          label: 'MD Ready',
          color: 'blue'
        };
      case 'With Doctor':
        return {
          nextStatus: 'seen-by-md',
          label: 'MD Complete',
          color: 'teal'
        };
      case 'seen-by-md':
        return {
          nextStatus: 'completed',
          label: 'Check Out',
          color: 'green'
        };
      default:
        return null;
    }
  };

  const handleStatusChange = (e: React.MouseEvent<HTMLButtonElement>, nextStatus: PatientApptStatus): void => {
    e.preventDefault();
    e.stopPropagation();
    updatePatientStatus(patient.id, nextStatus);
  };

  const buttonColors: Record<string, string> = {
    amber: 'bg-amber-500 hover:bg-amber-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    cyan: 'bg-cyan-500 hover:bg-cyan-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    teal: 'bg-teal-500 hover:bg-teal-600',
    green: 'bg-green-500 hover:bg-green-600'
  };

  return (
    <div className={`rounded-lg border-l-4 ${getBorderColor(patient.status)} bg-gray-800 p-4 shadow-md hover:shadow-lg transition-shadow mb-4`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
          <div className="text-sm text-gray-300">
            <p>DOB: {patient.dob}</p>
            {patient.appointmentType && (
              <p>{patient.appointmentType} - {patient.chiefComplaint}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`${getStatusColor(patient.status)} text-white text-xs px-2 py-1 rounded-full uppercase font-semibold`}>
            {patient.status}
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-400">Date</p>
          <p className="text-white">{appointmentDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/Chicago'
          })}</p>
          <p className="text-gray-400 mt-1">Time</p>
          <p className="text-white">{formatTime(appointmentDate)}</p>
        </div>
        <div>
          <p className="text-gray-400">Provider</p>
          <p className="text-white">{patient.provider || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-400">Check-in Time</p>
          {isEditingCheckIn && ['appt-prep', 'ready-for-md'].includes(patient.status) ? (
            <div className="flex flex-col space-y-1">
              <input
                type="date"
                value={checkInDateInput}
                onChange={(e) => setCheckInDateInput(e.target.value)}
                className="bg-gray-700 text-white rounded p-1 text-sm w-full"
              />
              <input
                type="time"
                value={checkInTimeInput}
                onChange={(e) => setCheckInTimeInput(e.target.value)}
                className="bg-gray-700 text-white rounded p-1 text-sm w-full"
              />
              <div className="flex space-x-1 mt-1">
                <button
                  onClick={handleSaveCheckIn}
                  className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelCheckIn}
                  className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <p className="text-white">
                {patient.checkInTime ? formatDateTime(new Date(patient.checkInTime)) : 'Not checked in'}
              </p>
              {['appt-prep', 'ready-for-md'].includes(patient.status) && patient.checkInTime && (
                <button
                  onClick={handleEditCheckIn}
                  className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-colors ml-2"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-400">{patient.completedTime ? 'Total Time' : 'Wait Time'}</p>
          <p className={`${getWaitTime(patient) > 15 ? 'text-red-400' : 'text-white'}`}>
            {getWaitTimeDisplay(getWaitTime(patient))}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Room</p>
          {['arrived', 'appt-prep', 'ready-for-md', 'With Doctor'].includes(patient.status) ? (
            <select 
              value={patient.room || ''}
              onChange={handleRoomChange}
              className="bg-gray-700 text-white rounded p-1 text-sm w-full"
            >
              <option value="">Select</option>
              <option value="1">Room 1</option>
              <option value="2">Room 2</option>
              <option value="3">Room 3</option>
              <option value="IV Hydr">IV Hydration</option>
              <option value="Spa 1">Spa 1</option>
              <option value="Spa 2">Spa 2</option>
              <option value="Spa Hydr">Spa Hydration</option>
              <option value="Lab">Lab</option>
              <option value="Lobby">Lobby</option>
              <option value="Waiting">Waiting</option>
            </select>
          ) : (
            <p className="text-white">{patient.room || 'N/A'}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        {(() => {
          const button = getActionButton();
          if (!button) return null;
          return (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleStatusChange(e, button.nextStatus)}
              className={`mt-2 px-3 py-1 ${buttonColors[button.color]} text-white rounded transition-colors`}
            >
              {button.label}
            </button>
          );
        })()}
      </div>
    </div>
  );
};

export default PatientCard;
