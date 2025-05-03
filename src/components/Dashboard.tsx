import React, { useState } from 'react';
import MetricsPanel from './MetricsPanel';
import TimeControl from './TimeControl';
import PatientList from './PatientList';
import NewPatientForm from './NewPatientForm';
import ImportSchedule from './ImportSchedule';
import AuthNav from './AuthNav';
import { PlusCircle, RefreshCw, Printer, ChevronDown, Upload, X } from 'lucide-react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';

interface ReportModalProps {
  onClose: () => void;
  reportContent: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, reportContent }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
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
  const { patients, getMetrics, getWaitTime } = usePatientContext();
  const { timeMode, getCurrentTime } = useTimeContext();
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showImportSchedule, setShowImportSchedule] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Function to generate the report
  const generateReport = () => {
    const metrics = getMetrics();
    const currentDate = getCurrentTime();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago'
    });

    // Start with the header and overall metrics
    let report = `PATIENT FLOW REPORT - ${formattedDate} (${timeMode.simulated ? 'SIMULATED' : 'REAL-TIME'} MODE)\n`;
    report += `==========================================================================\n\n`;
    report += `OVERALL METRICS:\n`;
    report += `----------------\n`;
    report += `Total Appointments: ${metrics.totalAppointments}\n`;
    report += `Patients Waiting: ${metrics.waitingCount}\n`;
    report += `Average Wait Time: ${Math.round(metrics.averageWaitTime)} minutes\n`;
    report += `Maximum Wait Time: ${metrics.maxWaitTime} minutes\n\n`;

    // Add the appointment table
    report += `APPOINTMENTS:\n`;
    report += `------------\n`;
    report += `Date\tTime\tStatus\tPatient Name\tDOB\tType\tVisit Type\n`;

    // Filter patients for the current date
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const patientsForDate = patients.filter(patient => {
      const appointmentDate = new Date(patient.appointmentTime);
      return appointmentDate.toISOString().split('T')[0] === currentDateStr;
    });

    // Sort patients by appointment time
    patientsForDate.sort((a, b) => {
      return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
    });

    // Add each patient to the report
    patientsForDate.forEach(patient => {
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
      } else if (status === 'with-doctor') {
        displayStatus = 'Seen by MD';
      } else if (status === 'seen-by-md') {
        displayStatus = 'Seen by MD';
      } else if (status === 'completed') {
        displayStatus = 'Checked Out';
      }

      // Format DOB
      const dobDate = new Date(patient.dob);
      const formattedDOB = dobDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Chicago'
      });

      // Add the patient to the report
      report += `${formattedAppointmentDate}\t${formattedAppointmentTime}\t${displayStatus}\t${patient.name}\t${formattedDOB}\t${patient.appointmentType || 'Office Visit'}\t${patient.visitType || 'Follow-Up'}\n`;
    });

    // Add wait time information for patients who have checked in
    report += `\nWAIT TIME DETAILS:\n`;
    report += `----------------\n`;

    const checkedInPatients = patientsForDate.filter(patient => 
      patient.checkInTime && ['arrived', 'appt-prep', 'ready-for-md', 'with-doctor', 'seen-by-md', 'completed'].includes(patient.status as string)
    );

    if (checkedInPatients.length === 0) {
      report += `No patients have checked in yet.\n`;
    } else {
      checkedInPatients.forEach(patient => {
        const waitTime = getWaitTime(patient);
        const checkInTime = new Date(patient.checkInTime!);
        const formattedCheckInTime = checkInTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Chicago'
        });

        report += `${patient.name} - Checked in at ${formattedCheckInTime} - Wait time: ${waitTime} minutes\n`;
      });
    }

    return report;
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
              <button 
                onClick={() => {
                  const report = generateReport();
                  setReportContent(report);
                  setShowReportModal(true);
                }}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                <Printer size={18} className="mr-1" />
                Print Report
              </button>
            </div>
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
              <PatientList status={"scheduled" as const} title="Scheduled Patients" />
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
              <PatientList status={"with-doctor" as const} title="With Doctor" />
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
        </div>
      </main>

      {showNewPatientForm && (
        <NewPatientForm onClose={() => setShowNewPatientForm(false)} />
      )}
      {showImportSchedule && (
        <ImportSchedule onClose={() => setShowImportSchedule(false)} />
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
