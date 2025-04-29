import React, { useState } from 'react';
import MetricsPanel from './MetricsPanel';
import TimeControl from './TimeControl';
import PatientList from './PatientList';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import { PlusCircle, RefreshCw, Printer, ChevronDown, Upload } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showImportSchedule, setShowImportSchedule] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const isExpanded = (section: string) => expandedSection === section;
  
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-0">
            Patient Flow Management
          </h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowImportSchedule(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
            >
              <Upload size={18} className="mr-1" />
              Import Schedule
            </button>
            <button 
              onClick={() => setShowNewPatientForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              <PlusCircle size={18} className="mr-1" />
              New Patient
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              <RefreshCw size={18} className="mr-1" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              <Printer size={18} className="mr-1" />
              Print Report
            </button>
          </div>
        </div>
        
        <div>
          <MetricsPanel />
          <div className="mt-4">
            <TimeControl />
          </div>
        </div>
      </header>
      
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <button 
              onClick={() => toggleSection('scheduled')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Scheduled Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('scheduled') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('scheduled') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="scheduled" title="Scheduled Patients" />
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => toggleSection('arrived')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Arrived Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('arrived') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('arrived') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="arrived" title="Arrived Patients" />
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => toggleSection('appt-prep')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Appointment Prep</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('appt-prep') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('appt-prep') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="appt-prep" title="Appointment Prep" />
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => toggleSection('ready-for-md')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Ready for MD</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('ready-for-md') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('ready-for-md') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="ready-for-md" title="Ready for MD" />
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => toggleSection('with-doctor')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">With Doctor</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('with-doctor') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('with-doctor') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="with-doctor" title="With Doctor" />
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => toggleSection('seen-by-md')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Seen by MD</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('seen-by-md') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('seen-by-md') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="seen-by-md" title="Seen by MD" />
            </div>
          </div>
          <div>
            <button 
              onClick={() => toggleSection('completed')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Completed</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('completed') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('completed') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status="completed" title="Completed" />
            </div>
          </div>
        </div>
      </main>
      
      {showNewPatientForm && (
        <NewPatientForm onClose={() => setShowNewPatientForm(false)} />
      )}
      {showImportSchedule && (
        <ImportSchedule onClose={() => setShowImportSchedule(false)} />
      )}
    </div>
  );
};

export default Dashboard;