import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientApptStatus } from '../types';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { formatTime as utilFormatTime, formatDate, formatDOB } from '../utils/formatters';

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const { updatePatientStatus, assignRoom, updateCheckInTime, getWaitTime } = usePatientContext();
  const { formatDateTime, getCurrentTime } = useTimeContext();
  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [checkInDateInput, setCheckInDateInput] = useState('');
  const [checkInTimeInput, setCheckInTimeInput] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'Confirmed': return 'bg-green-600';
      case 'Rescheduled': return 'bg-orange-500';
      case 'Cancelled': return 'bg-red-500';
      case 'No Show': return 'bg-red-600';
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
      case 'Confirmed': return 'border-green-600';
      case 'Rescheduled': return 'border-orange-500';
      case 'Cancelled': return 'border-red-500';
      case 'No Show': return 'border-red-600';
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
      case 'Confirmed':
      case 'Rescheduled':
      case 'Cancelled':
        return null;
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

  const toggleStatusDropdown = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (patient.status === 'scheduled') {
      setIsStatusDropdownOpen(!isStatusDropdownOpen);
    }
  };

  const handleStatusOptionChange = (e: React.MouseEvent, status: PatientApptStatus): void => {
    e.preventDefault();
    e.stopPropagation();
    updatePatientStatus(patient.id, status);
    setIsStatusDropdownOpen(false);
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
            <p>DOB: {formatDOB(patient.dob)}</p>
            {patient.appointmentType && (
              <p>{patient.appointmentType} - {patient.chiefComplaint}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div 
            className={`${getStatusColor(patient.status)} text-white text-xs px-2 py-1 rounded-full uppercase font-semibold ${patient.status === 'scheduled' ? 'cursor-pointer hover:opacity-80' : ''} relative`}
            onClick={toggleStatusDropdown}
          >
            {patient.status}
            {isStatusDropdownOpen && patient.status === 'scheduled' && (
              <div ref={statusDropdownRef} className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    onClick={(e) => handleStatusOptionChange(e, 'Confirmed')}
                  >
                    Confirmed
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    onClick={(e) => handleStatusOptionChange(e, 'Rescheduled')}
                  >
                    Rescheduled
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    onClick={(e) => handleStatusOptionChange(e, 'Cancelled')}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-400">Date</p>
          <p className="text-white">{formatDate(patient.appointmentTime)}</p>
          <p className="text-gray-400 mt-1">Time</p>
          <p className="text-white">{utilFormatTime(patient.appointmentTime)}</p>
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
              <option value="Televisit">Televisit</option>
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
