import React, { useState } from 'react';
import MetricsPanel from './MetricsPanel';
import TimeControl from './TimeControl';
import PatientList from './PatientList';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import ImportJSON from './ImportJSON';
import TebraIntegration from './TebraIntegrationNew';
import MonitoringStatus from './MonitoringStatus';
import AuthNav from './AuthNav';
import { PlusCircle, FileDown, ChevronDown, Upload, X, Download, Bug } from 'lucide-react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Patient } from '../types';
import { EnvDebugger } from './EnvDebugger';
import { DiagnosticPanel } from './DiagnosticPanel';
import { WaitTimeDiagnostic } from './WaitTimeDiagnostic';
import { PersistenceDiagnostic } from './PersistenceDiagnostic';
import { FirebaseDebugger } from './FirebaseDebugger';

interface ReportModalProps {
  onClose: () => void;
  reportContent: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, reportContent }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Patient Flow Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <pre className="bg-gray-700 p-4 rounded text-white font-mono text-sm whitespace-pre-wrap overflow-auto">
          {reportContent}
        </pre>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              // Create a blob and download the report
              const blob = new Blob([reportContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'patient-flow-report.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors mr-2"
          >
            Download
          </button>
          <button
            onClick={() => {
              // Create a printable version of the report
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html lang="en">
                    <head>
                      <title>Patient Flow Report</title>
                      <style>
                        body {
                          font-family: monospace;
                          white-space: pre-wrap;
                          padding: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      ${reportContent.replace(/\n/g, '<br>')}
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors mr-2"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Helper function to format patient data
  const formatPatientData = (patient: Patient) => {
    const appointmentDate = new Date(patient.appointmentTime);
    const formattedAppointmentDate = appointmentDate.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago'
    });

    const formattedAppointmentTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });

    // Map internal status to display status
    let displayStatus = 'Scheduled';
    const status = patient.status as string;
    if (status === 'arrived') {
      displayStatus = 'Checked In';
    } else if (status === 'appt-prep') {
      displayStatus = 'Appt Prep Started';
    } else if (status === 'ready-for-md') {
      displayStatus = 'Ready for MD';
    } else if (status === 'With Doctor') {
      displayStatus = 'With Doctor';
    } else if (status === 'seen-by-md') {
      displayStatus = 'Seen by MD';
    } else if (status === 'completed') {
      displayStatus = 'Checked Out';
    } else if (status === 'Confirmed') {
      displayStatus = 'Confirmed';
    } else if (status === 'Rescheduled') {
      displayStatus = 'Rescheduled';
    } else if (status === 'Cancelled') {
      displayStatus = 'Cancelled';
    }

    // Format DOB
    const dobDate = new Date(patient.dob);
    const formattedDOB = dobDate.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago'
    });

    // Format Check-In Time if it exists
    let formattedCheckInTime = '';
    if (patient.checkInTime) {
      const checkInTime = new Date(patient.checkInTime);
      formattedCheckInTime = checkInTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
      });
    }

    return {
      formattedAppointmentDate,
      formattedAppointmentTime,
      displayStatus,
      formattedDOB,
      formattedCheckInTime,
      appointmentType: patient.appointmentType || 'Office Visit',
      chiefComplaint: patient.chiefComplaint || 'Follow-Up',
      room: patient.room || ''
    };
  };

  // Modify the existing generateReport function in Dashboard.tsx
  const generateReport = (format: 'text' | 'csv' = 'text') => {
    const currentDate = getCurrentTime();

    // Ensure we're using the correct date for the report header
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });

    // No filtering - include all appointments in memory
    const patientsForDate = [...patients];

    // Sort patients by appointment time
    patientsForDate.sort((a, b) => {
      return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
    });

    // Calculate custom metrics for all in-house and checked-out patients
    const checkedInPatients = patientsForDate.filter(patient => 
      patient.checkInTime && ['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'].includes(patient.status as string)
    );

    const allWaitTimes = checkedInPatients.map(getWaitTime);
    const meanWaitTime = allWaitTimes.length > 0
      ? Math.round(allWaitTimes.reduce((acc, time) => acc + time, 0) / allWaitTimes.length)
      : 0;
    const maxWaitTime = allWaitTimes.length > 0
      ? Math.max(...allWaitTimes)
      : 0;

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Time',
        'Status',
        'Patient Name',
        'DOB',
        'Type',
        'Chief Complaint',
        'Check-In Time', // Added Check-In Time column
        'Room' // Added Room column
      ];

      // Create CSV content
      let csvContent = headers.join(',') + '\n';

      // Add patient data rows
      patientsForDate.forEach(patient => {
        const formattedData = formatPatientData(patient);

        // Add the patient row to CSV content
        const row = [
          formattedData.formattedAppointmentDate,
          formattedData.formattedAppointmentTime,
          formattedData.displayStatus,
          patient.name,
          formattedData.formattedDOB,
          formattedData.appointmentType,
          formattedData.chiefComplaint,
          formattedData.formattedCheckInTime, // Added Check-In Time
          formattedData.room // Added Room
        ];

        // Escape any commas in text fields
        const escapedRow = row.map(field => {
          if (field && field.includes(',')) {
            return `"${field}"`;
          }
          return field;
        });

        csvContent += escapedRow.join(',') + '\n';
      });

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Format the filename with the current date
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }).replace(/\//g, '-');

      a.download = `patient-schedule-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return ''; // Return empty string as we don't need to display anything
    } else {
      // Generate a text report
      // Start with the header and overall metrics
      let report = `PATIENT FLOW REPORT - ${formattedDate} (${timeMode.simulated ? 'SIMULATED' : 'REAL-TIME'} MODE)\n`;
      report += `==========================================================================\n\n`;
      report += `OVERALL METRICS:\n`;
      report += `----------------\n`;
      report += `Total Appointments: ${patientsForDate.length}\n`;

      // Use the custom calculated metrics instead of the dashboard metrics
      report += `Patients Waiting: ${checkedInPatients.length}\n`;
      report += `Average Wait Time: ${meanWaitTime} minutes\n`;
      report += `Maximum Wait Time: ${maxWaitTime} minutes\n\n`;

      // Add the appointment table
      report += `APPOINTMENTS:\n`;
      report += `------------\n`;

      // Define column headers and their widths
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

      // Create the column headers row
      const headerRow = columns.map(col => col.header.padEnd(col.width)).join('');
      report += headerRow + '\n';

      // Create a separator line under the headers for better readability
      report += columns.map(col => '-'.repeat(col.width)).join('') + '\n';

      // Add each patient to the report with aligned columns
      patientsForDate.forEach(patient => {
        const formattedData = formatPatientData(patient);

        // Create an array of fields to display
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

        // Join fields into a row and add to report
        report += fields.join('') + '\n';
      });

      // Update the wait time details section
      report += `\nWAIT TIME DETAILS:\n`;
      report += `----------------\n`;

      if (checkedInPatients.length === 0) {
        report += `No patients have checked in yet.\n`;
      } else {
        // Add mean and maximum wait times to the report
        report += `Mean Wait Time (all in-house and checked-out patients): ${meanWaitTime} minutes\n`;
        report += `Maximum Wait Time (all in-house and checked-out patients): ${maxWaitTime} minutes\n\n`;

        // List individual patient wait times
        checkedInPatients.forEach(patient => {
          const waitTime = getWaitTime(patient);
          // Use the formatPatientData helper to get consistent formatting
          const formattedData = formatPatientData(patient);
          const formattedCheckInTime = formattedData.formattedCheckInTime;

          report += `${patient.name} - Checked in at ${formattedCheckInTime} - Wait time: ${waitTime} minutes\n`;
        });
      }

      return report;
    }
  };

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

          <div className="flex items-center space-x-4">
            <AuthNav />
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowImportSchedule(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
              >
                <Upload size={18} className="mr-1" />
                Import Schedule
              </button>
              <button 
                onClick={() => setShowImportJSON(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
              >
                <Upload size={18} className="mr-1" />
                Import JSON
              </button>
              <button 
                onClick={() => setShowNewPatientForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                <PlusCircle size={18} className="mr-1" />
                New Patient
              </button>
              <button 
                onClick={exportPatientsToJSON}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors"
              >
                <Download size={18} className="mr-1" />
                Export JSON
              </button>
              <button 
                onClick={() => {
                  // Generate and download CSV
                  generateReport('csv');

                  // Also show the text report in modal
                  const report = generateReport();
                  setReportContent(report);
                  setShowReportModal(true);
                }}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
              >
                <FileDown size={18} className="mr-1" />
                Export Schedule
              </button>
              {/* Debug toggle */}
              <button 
                onClick={() => setShowDebugPanels(prev => !prev)}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                <Bug size={18} className="mr-1" />
                {showDebugPanels ? 'Hide' : 'Show'} Debug
              </button>
            </div>
          </div>
        </div>

        <div>
          <MetricsPanel />
          <div className="mt-4">
            <TimeControl />
          </div>
          <div className="mt-4">
            <TebraIntegration />
          </div>
          <div className="mt-4">
            <MonitoringStatus />
          </div>
        </div>
      </header>

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
              <PatientList status={"scheduled" as const} title="Scheduled Patients" />
            </div>
          </div>

          <div>
            <button 
              onClick={() => toggleSection('Confirmed')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Confirmed Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('Confirmed') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('Confirmed') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status={"Confirmed" as const} title="Confirmed Patients" />
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
              <PatientList status={"arrived" as const} title="Arrived Patients" />
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
              <PatientList status={"appt-prep" as const} title="Appointment Prep" />
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
              <PatientList status={"ready-for-md" as const} title="Ready for MD" />
            </div>
          </div>

          <div>
            <button 
              onClick={() => toggleSection('With Doctor')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">With Doctor</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('With Doctor') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('With Doctor') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status={"With Doctor" as const} title="With Doctor" />
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
              <PatientList status={"seen-by-md" as const} title="Seen by MD" />
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
              <PatientList status={"completed" as const} title="Completed" />
            </div>
          </div>

          <div>
            <button 
              onClick={() => toggleSection('Rescheduled')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Rescheduled Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('Rescheduled') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('Rescheduled') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status={"Rescheduled" as const} title="Rescheduled Patients" />
            </div>
          </div>

          <div>
            <button 
              onClick={() => toggleSection('Cancelled')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">Cancelled Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('Cancelled') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('Cancelled') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status={"Cancelled" as const} title="Cancelled Patients" />
            </div>
          </div>

          <div>
            <button 
              onClick={() => toggleSection('No Show')}
              className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <span className="text-white font-semibold">No Show Patients</span>
              <ChevronDown 
                size={20} 
                className={`text-white transition-transform ${isExpanded('No Show') ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`${isExpanded('No Show') || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
              <PatientList status={"No Show" as const} title="No Show Patients" />
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
