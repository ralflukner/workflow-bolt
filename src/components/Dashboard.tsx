import React, { Component, RefObject } from 'react';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '../types/index';
import { DiagnosticPanel } from './DiagnosticPanel';
import { WaitTimeDiagnostic } from './WaitTimeDiagnostic';
import { PersistenceDiagnostic } from './PersistenceDiagnostic';
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

import { PatientContextType } from '../contexts/PatientContext';
import { TimeContextType } from '../contexts/TimeContext';

interface DashboardProps extends WithContextsProps {
  patientContext: PatientContextType;
  timeContext: TimeContextType;
}

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

  private generateReportContent = (format: 'csv' | 'text'): string => {
    const { patients, getWaitTime } = this.props.patientContext;
    const { getCurrentTime, timeMode } = this.props.timeContext;

    if (format === 'csv') {
      let csvContent = 'Patient Name,Status,Wait Time\n';
      patients.forEach((p: Patient) => {
        const waitTime = getWaitTime(p);
        csvContent += `${p.name},${p.status},${waitTime || 'N/A'}\n`;
      });
      return csvContent;
    } else if (format === 'text') {
      let textContent = '--- Patient Report ---\n\n';
      patients.forEach((p: Patient) => {
        const waitTime = getWaitTime(p);
        textContent += `Name: ${p.name}\nStatus: ${p.status}\nWait Time: ${waitTime || 'N/A'}\n\n`;
      });
      return textContent;
    }
    return '';
  };

  handleExportSchedule = async (): Promise<void> => {
    if (this.isExporting.current) return;
    this.isExporting.current = true;
    try {
      const { patients, getWaitTime } = this.props.patientContext;
      const { getCurrentTime, timeMode } = this.props.timeContext;
      
      // Generate CSV report directly
      this.generateCSVReport(patients, getCurrentTime);
      
      // Generate text report for modal
      const report = this.generateTextReport(patients, getCurrentTime, timeMode, getWaitTime);
      this.setState({ reportContent: report, showReportModal: true });
    } catch (err) {
      console.error('Failed to export schedule', err);
      alert('Unable to export schedule. Please try again.');
    } finally {
      this.isExporting.current = false;
    }
  };

  private generateCSVReport = (patients: Patient[], getCurrentTime: () => Date) => {
    const currentDate = getCurrentTime();
    const headers = [
      'Date', 'Time', 'Status', 'Patient Name', 'DOB', 
      'Type', 'Chief Complaint', 'Check-In Time', 'Room'
    ];

    let csvContent = headers.join(',') + '\n';

    const sortedPatients = [...patients].sort((a, b) => 
      new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime()
    );

    sortedPatients.forEach(patient => {
      const formattedData = formatPatientData(patient);
      const row = [
        formattedData.formattedAppointmentDate,
        formattedData.formattedAppointmentTime,
        formattedData.displayStatus,
        patient.name,
        formattedData.formattedDOB,
        formattedData.appointmentType,
        formattedData.chiefComplaint,
        formattedData.formattedCheckInTime,
        formattedData.room
      ];

      const escapedRow = row.map(field => {
        if (field == null) return '';
        const needsQuotes = /[,"\n]/.test(field);
        const safe = String(field).replace(/"/g, '""');
        return needsQuotes ? `"${safe}"` : safe;
      });

      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-schedule-${formatDateForFilename(currentDate)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          onToggleDebugTextWindow={() => this.setState(prevState => ({ showDebugTextWindow: !prevState.showDebugTextWindow }))}
          showDebugTextWindow={showDebugTextWindow}
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
                  <TebraDebugDashboardWrapper />
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

export default withContexts<DashboardProps>(DashboardClass);