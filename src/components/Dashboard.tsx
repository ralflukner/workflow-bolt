import React, { useState, useRef } from 'react';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';

import { DiagnosticPanel } from './DiagnosticPanel';
import { WaitTimeDiagnostic } from './WaitTimeDiagnostic';
import { PersistenceDiagnostic } from './PersistenceDiagnostic';
import { FirebaseDebugger } from './FirebaseDebugger';
import { ReportModal } from './ReportModal';
import { DashboardHeader } from './DashboardHeader';
import { PatientSection } from './PatientSection';
import { DebugTextWindow } from './DebugTextWindow';
import { useReportGeneration } from '../hooks/useReportGeneration';
import { PATIENT_SECTIONS } from '../constants/patientSections';
import TebraDebugDashboard from './TebraDebugDashboard';


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
  const [showDebugTextWindow, setShowDebugTextWindow] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // Guard against rapid export clicks
  const isExporting = useRef(false);

  const { generateReport } = useReportGeneration(patients, getCurrentTime, timeMode, getWaitTime);



  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isExpanded = (section: string) => expandedSection === section;

const handleExportSchedule = async (): Promise<void> => {
  if (isExporting.current) return;     // guard against rapid clicks
  isExporting.current = true;
  try {
    // generateReport('csv') returns void and triggers download directly
    generateReport('csv');
    // For modal display, generate text report
    const report = generateReport('text');
    setReportContent(report);
    setShowReportModal(true);
  } catch (err) {
    console.error('Failed to export schedule', err);
    alert('Unable to export schedule. Please try again.');
  } finally {
    isExporting.current = false;
  }
};


  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <DashboardHeader
        showDebugPanels={showDebugPanels}
        onToggleDebug={() => setShowDebugPanels(prev => !prev)}
        showDebugTextWindow={showDebugTextWindow}
        onToggleDebugTextWindow={() => setShowDebugTextWindow(prev => !prev)}
        onShowNewPatient={() => setShowNewPatientForm(true)}
        onShowImportSchedule={() => setShowImportSchedule(true)}
        onShowImportJSON={() => setShowImportJSON(true)}
        onExportJSON={() => exportPatientsToJSON()}
        onExportSchedule={handleExportSchedule}
      />

      <main>
        {showDebugPanels && (
          <>
            <FirebaseDebugger />
            <div className="mb-6">
              <TebraDebugDashboard />
            </div>
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DiagnosticPanel />
              <WaitTimeDiagnostic />
              <PersistenceDiagnostic />
            </div>
          </>
        )}
        
        {showDebugTextWindow ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 gap-6">
              {PATIENT_SECTIONS.map(section => (
                <PatientSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  status={section.status}
                  isExpanded={isExpanded(section.id)}
                  onToggle={toggleSection}
                  scrollPosition={scrollPosition}
                  onScroll={setScrollPosition}
                />
              ))}
            </div>
            <div className="lg:sticky lg:top-4" style={{ height: 'fit-content' }}>
              <DebugTextWindow 
                scrollPosition={scrollPosition}
                onScroll={setScrollPosition}
                patients={patients}
                getWaitTime={getWaitTime}
              />
            </div>
          </div>
        ) : (
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
        )}
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
