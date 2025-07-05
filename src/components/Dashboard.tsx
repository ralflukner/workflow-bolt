import React, { Component } from 'react';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient, PatientStatus, PatientStatusUtils, PatientStatusCategories } from '../types';
import { DiagnosticPanel } from './DiagnosticPanel';
import { WaitTimeDiagnostic } from './WaitTimeDiagnostic';
import PersistenceDiagnosticWrapper from "./PersistenceDiagnosticWrapper";
import { FirebaseDebugger } from './FirebaseDebugger';
import { ReportModal } from './ReportModal';
import { DashboardHeader } from './DashboardHeader';
import { PatientSection } from './PatientSection';
import { DebugTextWindow } from './DebugTextWindow';
import { formatPatientData, formatDate, formatDateForFilename } from '../utils/patientFormatting';
import { PATIENT_SECTIONS } from '../constants/patientSections';
import TebraDebugDashboardWrapper from './TebraDebugDashboardWrapper';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import SecurityNotice from './SecurityNotice';
import MetricsPanel from './MetricsPanel';
import TebraIntegrationSimple from './TebraIntegrationSimple';
import ErrorBoundary from './ErrorBoundary';


interface DashboardProps extends WithContextsProps {}

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

class DashboardClass extends Component<DashboardProps, State> {
  private isExporting: { current: boolean };

  constructor(props: DashboardProps) {
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
    this.isExporting = { current: false };
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
            await this.generateScheduleReports();
        } catch (err) {
            this.handleExportError(err);
        } finally {
            this.isExporting.current = false;
        }
    };

    private generateScheduleReports = async (): Promise<void> => {
        const {patients, getWaitTime} = this.props.patientContext;
        const {getCurrentTime, timeMode} = this.props.timeContext;

        // Generate CSV report for download
        this.generateCSVReport(patients, getCurrentTime);

        // Generate text report for modal display
        const textReport = this.generateTextReport(patients, getCurrentTime, timeMode, getWaitTime);

        this.setState({
            reportContent: textReport,
            showReportModal: true
        });
    };

    private handleExportError = (error: unknown): void => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to export schedule:', errorMessage);
        alert('Unable to export schedule. Please try again.');
    };

    private generateCSVReport = (patients: Patient[], getCurrentTime: () => Date): void => {
        const timestamp = getCurrentTime();
        const filename = `patient-schedule-${formatDateForFilename(timestamp)}.csv`;
        const csvContent = this.buildCSVContent(patients);
        this.downloadCSV(csvContent, filename);
    };

    private buildCSVContent(patients: Patient[]): string {
        const headers = [
            'Date', 'Time', 'Status', 'Patient Name', 'DOB',
            'Type', 'Chief Complaint', 'Check-In Time', 'Room'
        ];
        const sorted = [...patients].sort(this.compareByAppointment);
        const rows = sorted.map(patient => {
            const data = formatPatientData(patient);
            const values = [
                data.formattedAppointmentDate,
                data.formattedAppointmentTime,
                data.displayStatus,
                patient.name,
                data.formattedDOB,
                data.appointmentType,
                data.chiefComplaint,
                data.formattedCheckInTime,
                data.room
            ];
            return values.map(this.escapeCSVField).join(',');
        });
        return [headers.join(','), ...rows].join('\n') + '\n';
    }

    private compareByAppointment(a: Patient, b: Patient): number {
        return new Date(a.appointmentTime).getTime()
            - new Date(b.appointmentTime).getTime();
    }

    private escapeCSVField(field?: string | null): string {
        if (field == null) return '';
        const escaped = String(field).replace(/"/g, '""');
        return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }

    private downloadCSV(content: string, filename: string): void {
        const blob = new Blob([content], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

  private generateTextReport = (
    patients: Patient[], 
    getCurrentTime: () => Date, 
    timeMode: { simulated: boolean }, 
    getWaitTime: (patient: Patient) => number
  ): string => {
    const currentDate = getCurrentTime();
    const formattedDate = formatDate(currentDate);

    const patientsForDate = [...patients].sort((a, b) => 
      new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime()
    );

    const checkedInPatients = patientsForDate.filter(patient => 
      patient.checkInTime && 
      ['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed']
        .includes(patient.status as string)
    );

    const allWaitTimes = checkedInPatients.map(getWaitTime);
    const meanWaitTime = allWaitTimes.length > 0
      ? Math.round(allWaitTimes.reduce((acc, time) => acc + time, 0) / allWaitTimes.length)
      : 0;
    const maxWaitTime = allWaitTimes.length > 0 ? Math.max(...allWaitTimes) : 0;

    let report = `PATIENT FLOW REPORT - ${formattedDate} (${timeMode.simulated ? 'SIMULATED' : 'REAL-TIME'} MODE)\n`;
    report += `==========================================================================\n\n`;
    report += `OVERALL METRICS:\n`;
    report += `----------------\n`;
    report += `Total Appointments: ${patientsForDate.length}\n`;
    report += `Patients Waiting: ${checkedInPatients.length}\n`;
    report += `Average Wait Time: ${meanWaitTime} minutes\n`;
    report += `Maximum Wait Time: ${maxWaitTime} minutes\n\n`;

    report += `APPOINTMENTS:\n`;
    report += `------------\n`;

    const columns = [
      { header: 'Date', width: 12 },
      { header: 'Time', width: 10 },
      { header: 'Status', width: 20 },
      { header: 'Patient Name', width: 25 },
      { header: 'DOB', width: 12 },
      { header: 'Type', width: 15 },
      { header: 'Chief Complaint', width: 15 },
      { header: 'Room', width: 10 }
    ];

    const headerRow = columns.map(col => col.header.padEnd(col.width)).join('');
    report += headerRow + '\n';
    report += columns.map(col => '-'.repeat(col.width)).join('') + '\n';

    patientsForDate.forEach(patient => {
      const formattedData = formatPatientData(patient);
      const fields = [
        formattedData.formattedAppointmentDate.padEnd(columns[0].width),
        formattedData.formattedAppointmentTime.padEnd(columns[1].width),
        formattedData.displayStatus.padEnd(columns[2].width),
        patient.name.padEnd(columns[3].width),
        formattedData.formattedDOB.padEnd(columns[4].width),
        formattedData.appointmentType.padEnd(columns[5].width),
        formattedData.chiefComplaint.padEnd(columns[6].width),
        formattedData.room.padEnd(columns[7].width)
      ];
      report += fields.join('') + '\n';
    });

    report += `\nWAIT TIME DETAILS:\n`;
    report += `----------------\n`;

    if (checkedInPatients.length === 0) {
      report += `No patients have checked in yet.\n`;
    } else {
      report += `Mean Wait Time (all in-house and checked-out patients): ${meanWaitTime} minutes\n`;
      report += `Maximum Wait Time: ${maxWaitTime} minutes\n\n`;

      checkedInPatients.forEach(patient => {
        const waitTime = getWaitTime(patient);
        const formattedData = formatPatientData(patient);
        const formattedCheckInTime = formattedData.formattedCheckInTime;
        report += `${patient.name} - Checked in at ${formattedCheckInTime} - Wait time: ${waitTime} minutes\n`;
      });
    }

    return report;
  };

  private getPatientsByStatus = (patients: Patient[]) => {
    // Type-safe status counting using enum values
    const statusCounts = patients.reduce((acc, patient) => {
      const status = patient.status || PatientStatus.SCHEDULED;
      acc[status as string] = (acc[status as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Ensure we have all expected statuses with default 0 values
    const allStatuses = Object.values(PatientStatus);
    const result: Record<string, number> = {};
    
    allStatuses.forEach(status => {
      result[status] = statusCounts[status as string] || 0;
    });
    
    return result;
  };

  private getAverageWaitTime = (patients: Patient[]) => {
    const checkedInPatients = patients.filter(p => p.checkInTime);
    if (checkedInPatients.length === 0) return 0;
    
    const totalWaitTime = checkedInPatients.reduce((sum, patient) => {
      const waitTime = this.props.patientContext.getWaitTime(patient);
      return sum + (isNaN(waitTime) ? 0 : waitTime);
    }, 0);
    
    const average = totalWaitTime / checkedInPatients.length;
    return isNaN(average) ? 0 : average;
  };

  private getPatientsSeenToday = (patients: Patient[]) => {
    const today = new Date().toDateString();
    return patients.filter(patient => {
      const appointmentDate = new Date(patient.appointmentTime).toDateString();
      return appointmentDate === today && PatientStatusUtils.isCompleted(patient.status as PatientStatus);
    }).length;
  };

  render() {
    const {
      showNewPatientForm,
      showImportSchedule,
      showImportJSON,
      showReportModal,
      reportContent,
        showDebugPanels,
      showDebugTextWindow,
      scrollPosition,
      showSecurityNotice,
    } = this.state;

    const { patients, getWaitTime, exportPatientsToJSON } = this.props.patientContext;

    // Helper to render PatientSection components, with optional scroll props
    const renderPatientSections = (includeScroll: boolean) => (
      PATIENT_SECTIONS.map(section => (
        <PatientSection
          key={section.id}
          id={section.id}
          title={section.title}
          status={section.status}
          isExpanded={this.isExpanded(section.id)}
          onToggle={() => this.toggleSection(section.id)}
          {...(includeScroll ? {
            scrollPosition,
            onScroll: (pos: number) => this.setState({ scrollPosition: pos }),
          } : {})}
        />
      ))
    );

    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <DashboardHeader
          showDebugPanels={showDebugPanels}
          onToggleDebug={() => this.setState(prevState => ({ showDebugPanels: !prevState.showDebugPanels }))}
          onToggleDebugTextWindow={() => this.setState(prevState => ({ showDebugTextWindow: !prevState.showDebugTextWindow }))}
          showDebugTextWindow={showDebugTextWindow}
          onShowNewPatient={() => this.setState({ showNewPatientForm: true })}
          onShowImportSchedule={() => this.setState({ showImportSchedule: true })}
          onShowImportJSON={() => this.setState({ showImportJSON: true })}
          onExportJSON={exportPatientsToJSON}
          onExportSchedule={this.handleExportSchedule}
        />

        {/* Simple components without useEffect complexity */}
        <MetricsPanel 
          metrics={{
            totalPatients: patients.length,
            patientsByStatus: this.getPatientsByStatus(patients),
            averageWaitTime: this.getAverageWaitTime(patients),
            patientsSeenToday: this.getPatientsSeenToday(patients)
          }}
        />
        <TebraIntegrationSimple 
          onSyncToday={() => console.log('Sync Today requested')}
          onTestConnection={() => console.log('Test Connection requested')}
          isConnected={true}
          lastSync={new Date().toLocaleString()}
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
                  <TebraDebugDashboardWrapper />
                </DashboardErrorBoundary>
              </div>
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DiagnosticPanel />
                <WaitTimeDiagnostic />
                <PersistenceDiagnosticWrapper 
                  patientContext={this.props.patientContext}
                  timeContext={this.props.timeContext}
                />
              </div>
            </>
          )}

          {showDebugTextWindow ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 gap-6">
                {renderPatientSections(true)}
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
              {renderPatientSections(false)}
            </div>
          )}
        </main>

        {showNewPatientForm && (
          <NewPatientForm onClose={() => this.setState({ showNewPatientForm: false })} />
        )}
        {showImportSchedule && (
          <ErrorBoundary fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Import Schedule Error</h2>
                <p className="text-gray-600 mb-4">The import schedule component failed to load.</p>
                <button
                  onClick={() => this.setState({ showImportSchedule: false })}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          }>
            <ImportSchedule onClose={() => this.setState({ showImportSchedule: false })} />
          </ErrorBoundary>
        )}
        {showImportJSON && (
          <ErrorBoundary fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Import JSON Error</h2>
                <p className="text-gray-600 mb-4">The import JSON component failed to load.</p>
                <button
                  onClick={() => this.setState({ showImportJSON: false })}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          }>
            <ImportJSON onClose={() => this.setState({ showImportJSON: false })} />
          </ErrorBoundary>
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