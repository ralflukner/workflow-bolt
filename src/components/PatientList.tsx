import React from 'react';
import { PatientApptStatus } from '../types';
import { usePatientContext } from '../hooks/usePatientContext';
import PatientCard from './PatientCard';

interface PatientListProps {
  status: PatientApptStatus;
  title: string;
}

const PatientList: React.FC<PatientListProps> = ({ status, title }) => {
  const { getPatientsByStatus } = usePatientContext();
  const patients = getPatientsByStatus(status);

  const getHeaderColor = () => {
    switch (status) {
      case 'scheduled': return 'bg-gray-700';
      case 'Confirmed': return 'bg-green-800';
      case 'Rescheduled': return 'bg-orange-700';
      case 'Cancelled': return 'bg-red-700';
      case 'No Show': return 'bg-red-800';
      case 'arrived': return 'bg-amber-700';
      case 'appt-prep': return 'bg-purple-700';
      case 'ready-for-md': return 'bg-cyan-700';
      case 'With Doctor': return 'bg-blue-700';
      case 'seen-by-md': return 'bg-teal-700';
      case 'completed': return 'bg-green-700';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
      <div className={`${getHeaderColor()} px-4 py-3`}>
        <h2 className="text-white font-semibold flex items-center justify-between">
          <span>{title}</span>
          <span className="bg-gray-800 text-white text-sm px-2 py-1 rounded-full">
            {patients.length}
          </span>
        </h2>
      </div>
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No patients in this category</p>
        )}
      </div>
    </div>
  );
};

export default PatientList;
