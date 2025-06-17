import React, { useState } from 'react';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { EnvDebugger } from './EnvDebugger';
import { DiagnosticPanel } from './DiagnosticPanel';
import { WaitTimeDiagnostic } from './WaitTimeDiagnostic';
import { PersistenceDiagnostic } from './PersistenceDiagnostic';
import { FirebaseDebugger } from './FirebaseDebugger';
import { ReportModal } from './ReportModal';
import { DashboardHeader } from './DashboardHeader';
import { PatientSection } from './PatientSection';
import { useReportGeneration } from '../hooks/useReportGeneration';
import { PATIENT_SECTIONS } from '../constants/patientSections';


const Dashboard: React.FC = () => {
  const { patients, getWaitTime, exportPatientsToJSON } = usePatientContext();
  const { timeMode, getCurrentTime } = useTimeContext();
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showImportSchedule, setShowImportSchedule] = useState(false);
  const [showImportJSON, setShowImportJSON] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDebugPanels, setShowDebugPanels] = useState<boolean>(false);

  const { generateReport } = useReportGeneration(patients, getCurrentTime, timeMode, getWaitTime);



  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isExpanded = (section: string) => expandedSection === section;

  const handleExportSchedule = () => {
    generateReport('csv');
    const report = generateReport();
    setReportContent(report);
    setShowReportModal(true);
  };


  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <DashboardHeader
        showDebugPanels={showDebugPanels}
        onToggleDebug={() => setShowDebugPanels(prev => !prev)}
        onShowNewPatient={() => setShowNewPatientForm(true)}
        onShowImportSchedule={() => setShowImportSchedule(true)}
        onShowImportJSON={() => setShowImportJSON(true)}
        onExportJSON={exportPatientsToJSON}
        onExportSchedule={handleExportSchedule}
      />

      <main>
        {showDebugPanels && (
          <>
            <EnvDebugger />
            <FirebaseDebugger />
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DiagnosticPanel />
              <WaitTimeDiagnostic />
              <PersistenceDiagnostic />
            </div>
          </>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PATIENT_SECTIONS.map(section => (
            <PatientSection
              key={section.id}
              id={section.id}
              title={section.title}
              status={section.status}
              isExpanded={isExpanded(section.id)}
              onToggle={toggleSection}
            />
          ))}
        </div>
      </main>

      {showNewPatientForm && (
        <NewPatientForm onClose={() => setShowNewPatientForm(false)} />
      )}
      {showImportSchedule && (
        <ImportSchedule onClose={() => setShowImportSchedule(false)} />
      )}
      {showImportJSON && (
        <ImportJSON onClose={() => setShowImportJSON(false)} />
      )}
      {showReportModal && (
        <ReportModal 
          onClose={() => setShowReportModal(false)} 
          reportContent={reportContent} 
        />
      )}
    </div>
  );
};

export default Dashboard;
