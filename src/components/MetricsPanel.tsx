import React from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { Users, Clock, AlertTriangle } from 'lucide-react';

const MetricsPanel: React.FC = () => {
  const { getMetrics } = usePatientContext();
  const metrics = getMetrics();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg p-4 shadow-md flex items-center overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center opacity-10">
          <Users size={52} className="text-blue-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total Patients</p>
          <p className="text-2xl font-bold text-white">{metrics.totalPatients}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 shadow-md flex items-center overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center opacity-10">
          <Users size={52} className="text-amber-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Waiting Patients</p>
          <p className="text-2xl font-bold text-white">
            {metrics.patientsByStatus.arrived + metrics.patientsByStatus['appt-prep'] + metrics.patientsByStatus['ready-for-md']}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 shadow-md flex items-center overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center opacity-10">
          <Clock size={52} className="text-teal-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Avg. Wait Time</p>
          <p className="text-2xl font-bold text-white">
            {Math.round(metrics.averageWaitTime)} min
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 shadow-md flex items-center overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center opacity-10">
          <AlertTriangle size={52} className="text-red-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Patients Seen Today</p>
          <p className="text-2xl font-bold text-white">
            {metrics.patientsSeenToday}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
