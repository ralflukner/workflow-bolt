import { Patient } from '../types';
import { formatPatientData, formatDate, formatDateForFilename } from '../utils/patientFormatting';

export const useReportGeneration = (
  patients: Patient[],
  getCurrentTime: () => Date,
  timeMode: { simulated: boolean },
  getWaitTime: (patient: Patient) => number
) => {
  const generateReport = (format: 'text' | 'csv' = 'text') => {
    const currentDate = getCurrentTime();
    const formattedDate = formatDate(currentDate);
    
    const patientsForDate = [...patients];
    patientsForDate.sort((a, b) => 
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

    if (format === 'csv') {
      return generateCSVReport(patientsForDate, currentDate);
    }
    
    return generateTextReport(
      patientsForDate, 
      checkedInPatients, 
      formattedDate, 
      timeMode, 
      meanWaitTime, 
      maxWaitTime, 
      getWaitTime
    );
  };

  const generateCSVReport = (patientsForDate: Patient[], currentDate: Date) => {
    const headers = [
      'Date', 'Time', 'Status', 'Patient Name', 'DOB', 
      'Type', 'Chief Complaint', 'Check-In Time', 'Room'
    ];

    let csvContent = headers.join(',') + '\n';

    patientsForDate.forEach(patient => {
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
        if (field && field.includes(',')) {
          return `"${field}"`;
        }
        return field;
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

    return '';
  };

  const generateTextReport = (
    patientsForDate: Patient[],
    checkedInPatients: Patient[],
    formattedDate: string,
    timeMode: { simulated: boolean },
    meanWaitTime: number,
    maxWaitTime: number,
    getWaitTime: (patient: Patient) => number
  ) => {
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
      report += `Maximum Wait Time (all in-house and checked-out patients): ${maxWaitTime} minutes\n\n`;

      checkedInPatients.forEach(patient => {
        const waitTime = getWaitTime(patient);
        const formattedData = formatPatientData(patient);
        const formattedCheckInTime = formattedData.formattedCheckInTime;
        report += `${patient.name} - Checked in at ${formattedCheckInTime} - Wait time: ${waitTime} minutes\n`;
      });
    }

    return report;
  };

  return { generateReport };
};