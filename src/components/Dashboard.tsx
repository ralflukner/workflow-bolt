import React, { Component, RefObject } from 'react';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import { withContexts, WithContextsProps } from './withContexts';
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
import TebraDebugDashboardContainer from './TebraDebugDashboardContainer';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import SecurityNotice from './SecurityNotice';

interface State {
  showNewPatientForm: boolean;
  showImportSchedule: boolean;
  showImportJSON: boolean;
  showReportModal: boolean;
  reportContent: string;
  expandedSection: string | null;
  showDebugPanels: boolean;
  showDebugTextWindow: boolean;
  scrollPosition: number;
  showSecurityNotice: boolean;
}

class DashboardClass extends Component<WithContextsProps, State> {
  private isExporting: RefObject<boolean>;

  constructor(props: WithContextsProps) {
    super(props);
    this.state = {
      showNewPatientForm: false,
      showImportSchedule: false,
      showImportJSON: false,
      showReportModal: false,
      reportContent: '',
      expandedSection: null,
      showDebugPanels: false,
      showDebugTextWindow: false,
      scrollPosition: 0,
      showSecurityNotice: true,
    };
    this.isExporting = React.createRef();
    this.isExporting.current = false;
  }

  toggleSection = (section: string) => {
    this.setState(prevState => ({
      expandedSection: prevState.expandedSection === section ? null : section,
    }));
  };

  isExpanded = (section: string) => this.state.expandedSection === section;

  handleExportSchedule = async (): Promise<void> => {
    if (this.isExporting.current) return;
    this.isExporting.current = true;
    try {
      const { patients } = this.props.patientContext;
      const { getCurrentTime, timeMode } = this.props.timeContext;
      const { getWaitTime } = this.props.patientContext;
      const { generateReport } = useReportGeneration(patients, getCurrentTime, timeMode, getWaitTime);
      
      generateReport('csv');
      const report = generateReport('text');
      this.setState({ reportContent: report, showReportModal: true });
    } catch (err) {
      console.error('Failed to export schedule', err);
      alert('Unable to export schedule. Please try again.');
    } finally {
      this.isExporting.current = false;
    }
  };

  render() {
    const {
      showNewPatientForm,
      showImportSchedule,
      showImportJSON,
      showReportModal,
      reportContent,
      expandedSection,
      showDebugPanels,
      showDebugTextWindow,
      scrollPosition,
      showSecurityNotice,
    } = this.state;

    const { patients, getWaitTime, exportPatientsToJSON } = this.props.patientContext;

    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <DashboardHeader
          showDebugPanels={showDebugPanels}
          onToggleDebug={() => this.setState(prevState => ({ showDebugPanels: !prevState.showDebugPanels }))}
          showDebugTextWindow={showDebugTextWindow}
          onToggleDebugTextWindow={() => this.setState(prevState => ({ showDebugTextWindow: !prevState.showDebugTextWindow }))}
          onShowNewPatient={() => this.setState({ showNewPatientForm: true })}
          onShowImportSchedule={() => this.setState({ showImportSchedule: true })}
          onShowImportJSON={() => this.setState({ showImportJSON: true })}
          onExportJSON={exportPatientsToJSON}
          onExportSchedule={this.handleExportSchedule}
        />

        <main>
          <SecurityNotice
            isVisible={showSecurityNotice}
            onClose={() => this.setState({ showSecurityNotice: false })}
          />

          {showDebugPanels && (
            <>
              <FirebaseDebugger />
              <div className="mb-6">
                <DashboardErrorBoundary>
                  <TebraDebugDashboardContainer />
                </DashboardErrorBoundary>
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
                    isExpanded={this.isExpanded(section.id)}
                    onToggle={() => this.toggleSection(section.id)}
                    scrollPosition={scrollPosition}
                    onScroll={(pos) => this.setState({ scrollPosition: pos })}
                  />
                ))}
              </div>
              <div className="lg:sticky lg:top-4" style={{ height: 'fit-content' }}>
                <DebugTextWindow
                  scrollPosition={scrollPosition}
                  onScroll={(pos) => this.setState({ scrollPosition: pos })}
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
                  isExpanded={this.isExpanded(section.id)}
                  onToggle={() => this.toggleSection(section.id)}
                />
              ))}
            </div>
          )}
        </main>

        {showNewPatientForm && (
          <NewPatientForm onClose={() => this.setState({ showNewPatientForm: false })} />
        )}
        {showImportSchedule && (
          <ImportSchedule onClose={() => this.setState({ showImportSchedule: false })} />
        )}
        {showImportJSON && (
          <ImportJSON onClose={() => this.setState({ showImportJSON: false })} />
        )}
        {showReportModal && (
          <ReportModal
            onClose={() => this.setState({ showReportModal: false })}
            reportContent={reportContent}
          />
        )}
      </div>
    );
  }
}

export default withContexts(DashboardClass);