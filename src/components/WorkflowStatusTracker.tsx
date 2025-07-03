import React, { useContext, useMemo } from 'react';
import { PatientContext } from '../context/PatientContextDef';
import { Patient, PatientApptStatus } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';

interface WorkflowStep {
  id: string;
  label: string;
  status: PatientApptStatus[];
  color: string;
  icon: string;
}

interface WorkflowStatusProps {
  patientId?: string;
  className?: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'scheduled',
    label: 'Scheduled',
    status: ['scheduled', 'Scheduled'],
    color: 'bg-blue-100 text-blue-800',
    icon: '📅'
  },
  {
    id: 'arrived',
    label: 'Checked In',
    status: ['arrived', 'Arrived', 'Checked In'],
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  {
    id: 'prep',
    label: 'Appointment Prep',
    status: ['appt-prep', 'Roomed', 'Appt Prep Started'],
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🏥'
  },
  {
    id: 'ready',
    label: 'Ready for Doctor',
    status: ['ready-for-md', 'Ready for MD'],
    color: 'bg-orange-100 text-orange-800',
    icon: '⏳'
  },
  {
    id: 'with-doctor',
    label: 'With Doctor',
    status: ['With Doctor'],
    color: 'bg-purple-100 text-purple-800',
    icon: '👨‍⚕️'
  },
  {
    id: 'seen',
    label: 'Seen by Doctor',
    status: ['seen-by-md', 'Seen by MD'],
    color: 'bg-indigo-100 text-indigo-800',
    icon: '📋'
  },
  {
    id: 'completed',
    label: 'Checked Out',
    status: ['completed', 'Checked Out'],
    color: 'bg-gray-100 text-gray-800',
    icon: '🏁'
  }
];

const SPECIAL_STATUS_STYLES: Record<string, { color: string; icon: string }> = {
  'cancelled': { color: 'bg-red-100 text-red-800', icon: '❌' },
  'Cancelled': { color: 'bg-red-100 text-red-800', icon: '❌' },
  'no-show': { color: 'bg-red-100 text-red-800', icon: '🚫' },
  'No Show': { color: 'bg-red-100 text-red-800', icon: '🚫' },
  'rescheduled': { color: 'bg-yellow-100 text-yellow-800', icon: '📅' },
  'Rescheduled': { color: 'bg-yellow-100 text-yellow-800', icon: '📅' }
};

export const WorkflowStatusTracker: React.FC<WorkflowStatusProps> = ({ 
  patientId,
  className = '' 
}) => {
  const { patients } = useContext(PatientContext);
  const { getCurrentTime } = useTimeContext();

  const patient = useMemo(() => {
    if (patientId) {
      return patients.find(p => p.id === patientId);
    }
    return null;
  }, [patients, patientId]);

  const getCurrentStep = (status: PatientApptStatus) => {
    return WORKFLOW_STEPS.find(step => 
      step.status.includes(status)
    );
  };

  const getStatusTimestamp = (patient: Patient) => {
    const status = patient.status;
    
    // Return most relevant timestamp based on current status
    if (['completed', 'Checked Out'].includes(status)) {
      return patient.completedTime;
    }
    if (['With Doctor', 'seen-by-md', 'Seen by MD'].includes(status)) {
      return patient.withDoctorTime;
    }
    if (['arrived', 'Arrived', 'Checked In', 'appt-prep', 'Roomed', 'ready-for-md'].includes(status)) {
      return patient.checkInTime;
    }
    
    // Default to appointment time for scheduled patients
    return patient.appointmentTime;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Not set';
    
    const date = new Date(timestamp);
    const now = getCurrentTime();
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getElapsedTime = (timestamp?: string) => {
    if (!timestamp) return null;
    
    const start = new Date(timestamp);
    const now = getCurrentTime();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${hours}h ${remainingMins}m ago`;
    }
  };

  if (!patient) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-gray-500 text-center">
          {patientId ? 'Patient not found' : 'No patient selected'}
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep(patient.status);
  const specialStatus = SPECIAL_STATUS_STYLES[patient.status];
  const timestamp = getStatusTimestamp(patient);
  const elapsed = getElapsedTime(timestamp);

  // If it's a special status (cancelled, no-show, etc.)
  if (specialStatus) {
    return (
      <div className={`p-4 rounded-lg border-2 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Workflow Status</h3>
          <span className="text-xs text-gray-500">{patient.name}</span>
        </div>
        
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${specialStatus.color}`}>
          <span className="mr-2">{specialStatus.icon}</span>
          {patient.status}
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <div>Time: {formatTimestamp(timestamp)}</div>
          {elapsed && <div>Duration: {elapsed}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-2 bg-white ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Workflow Status</h3>
        <span className="text-xs text-gray-500">{patient.name}</span>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = currentStep?.id === step.id;
          const isPast = currentStep && WORKFLOW_STEPS.findIndex(s => s.id === currentStep.id) > index;
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step indicator */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${isActive ? step.color : isPast ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}
              `}>
                {isActive ? step.icon : isPast ? '✓' : step.icon}
              </div>
              
              {/* Step label */}
              <div className="ml-3 flex-1">
                <div className={`text-sm font-medium ${isActive ? 'text-gray-900' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.label}
                </div>
              </div>
              
              {/* Connection line */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`absolute left-4 mt-8 w-0.5 h-3 ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} 
                     style={{ marginTop: '2rem' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Status Details */}
      {currentStep && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${currentStep.color}`}>
              <span className="mr-2">{currentStep.icon}</span>
              Current: {patient.status}
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div>Updated: {formatTimestamp(timestamp)}</div>
            {elapsed && <div>Duration: {elapsed}</div>}
            {patient.room && <div>Room: {patient.room}</div>}
            {patient.provider && <div>Provider: {patient.provider}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusTracker;