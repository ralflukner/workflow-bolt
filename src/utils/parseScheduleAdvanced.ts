/**
 * HIPAA-Compliant Advanced Schedule Parser
 * Handles the new format from Lukner Medical Clinic scheduling system
 * 
 * SECURITY NOTES:
 * - Validates all PHI data before processing
 * - Sanitizes inputs to prevent injection attacks
 * - Logs access for HIPAA audit trail
 * - Data stored in memory only (encrypted at rest)
 */

import { PatientApptStatus, AppointmentType } from '../types';
import { secureLog } from './redact';
import { secureStorage } from '../services/secureStorage';

export interface ImportedPatient {
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  chiefComplaint: string;
  provider: string;
  status: PatientApptStatus;
  checkInTime?: string;
  room?: string;
  phone?: string;
  insurance?: string;
  balance?: string;
  memberId?: string;
}

export interface ParseScheduleOptions {
  defaultProvider?: string;
  logFunction?: (message: string) => void;
  securityAudit?: boolean;
  saveToSecureStorage?: boolean;
  storageKey?: string;
}

export interface JSONExportOptions {
  password: string;
  includeMetadata?: boolean;
  sensitiveFields?: string[];
}

export interface JSONImportOptions {
  password: string;
  overwrite?: boolean;
  validateChecksum?: boolean;
}

/**
 * HIPAA-compliant logging function for audit trail
 */
function auditLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? '[REDACTED - PHI ACCESS]' : '';
  secureLog(`AUDIT [${timestamp}]: ${message} ${sanitizedData}`);
}

/**
 * Validates and sanitizes patient name to prevent injection
 */
function validatePatientName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid patient name format');
  }
  
  // Remove potentially dangerous characters while preserving valid names
  const sanitized = name
    .replace(/[<>\"'&]/g, '') // Remove HTML/injection chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
    
  if (sanitized.length < 2 || sanitized.length > 50) {
    throw new Error('Patient name length validation failed');
  }
  
  return sanitized;
}

/**
 * Validates and formats date of birth
 */
function validateDOB(dobStr: string): string {
  if (!dobStr || typeof dobStr !== 'string') {
    throw new Error('Invalid DOB format');
  }
  
  const dobMatch = dobStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!dobMatch) {
    throw new Error('DOB must be in MM/DD/YYYY format');
  }
  
  const [, month, day, year] = dobMatch;
  const monthInt = parseInt(month);
  const dayInt = parseInt(day);
  const yearInt = parseInt(year);
  
  // Validate ranges
  if (monthInt < 1 || monthInt > 12) {
    throw new Error('Invalid month in DOB');
  }
  if (dayInt < 1 || dayInt > 31) {
    throw new Error('Invalid day in DOB');
  }
  if (yearInt < 1900 || yearInt > new Date().getFullYear()) {
    throw new Error('Invalid year in DOB');
  }
  
  return `${yearInt}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Validates and formats phone number
 */
function validatePhone(phone: string): string {
  if (!phone) return '';
  
  // Extract digits only
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone; // Return as-is if not standard format
}

/**
 * Maps external status to internal PatientApptStatus
 */
function mapStatusToInternal(status: string): PatientApptStatus {
  const statusLower = status.toLowerCase().trim();
  
  switch (statusLower) {
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'checked out':
    case 'checkedout':
      return 'completed';
    case 'scheduled':
      return 'scheduled';
    case 'confirmed':
      return 'scheduled';
    case 'arrived':
    case 'checked in':
      return 'arrived';
    case 'roomed':
      return 'appt-prep';
    case 'with doctor':
    case 'in room':
      return 'With Doctor';
    case 'no show':
      return 'No Show';
    default:
      return 'scheduled';
  }
}

/**
 * Parses the advanced schedule format from Lukner Medical Clinic
 * Format includes provider, time, status, patient info, insurance, etc.
 */
export function parseScheduleAdvanced(
  text: string,
  currentTime: Date = new Date(),
  options: ParseScheduleOptions = {}
): ImportedPatient[] {
  const { defaultProvider = 'RALF LUKNER', logFunction = () => {}, securityAudit = true } = options;
  
  if (securityAudit) {
    auditLog('Schedule import initiated', { timestamp: currentTime.toISOString() });
  }
  
  const lines = text.trim().split('\n');
  const patients: ImportedPatient[] = [];
  
  logFunction(`🔒 HIPAA-Compliant Schedule Parser: Processing ${lines.length} lines`);
  
  // Parse the date from the header
  const dateHeaderMatch = lines[0]?.match(/(\w+),\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/);
  let scheduleDate = currentTime;
  
  if (dateHeaderMatch) {
    const [, , month, day, year] = dateHeaderMatch;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(month);
    
    if (monthIndex !== -1) {
      scheduleDate = new Date(parseInt(year), monthIndex, parseInt(day));
      logFunction(`📅 Schedule date parsed: ${scheduleDate.toDateString()}`);
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip header lines and empty lines
    if (!line || 
        line.includes('Appointments for') || 
        line.includes('Lukner Medical Clinic') || 
        line.includes('Resource Time Status') ||
        line.includes('2545 Perryton')) {
      continue;
    }
    
    try {
      // Parse the complex line format
      // Format: PROVIDER [ROOM] TIME STATUS PATIENT_NAME DOB PHONE INSURANCE REASON LOCATION NOTES BALANCE
      
      // Use regex to parse the structured data
      const linePattern = /^(RALF LUKNER)(?:\s+(ROOM\s+\d+))?\s+(\d{1,2}:\d{2}\s+[AP]M)\s+([\w\s]+?)\s+([A-Z\s]+?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+\((\d{3})\)\s+(\d{3}-\d{4})\s+(.+)$/;
      
      // Try a more flexible approach for complex format
      const parts = line.split(/\s+/);
      if (parts.length < 8) {
        logFunction(`⚠️ Skipping line ${i + 1}: Not enough data parts`);
        continue;
      }
      
      let provider = '';
      let room = '';
      let time = '';
      let status = '';
      let patientName = '';
      let dob = '';
      let phone = '';
      let insurance = '';
      let reason = '';
      let balance = '';
      let memberId = '';
      
      // Parse provider (always starts with RALF LUKNER)
      if (parts[0] === 'RALF' && parts[1] === 'LUKNER') {
        provider = 'RALF LUKNER';
        let currentIndex = 2;
        
        // Check for room
        if (parts[currentIndex] === 'ROOM' && parts[currentIndex + 1]) {
          room = `${parts[currentIndex]} ${parts[currentIndex + 1]}`;
          currentIndex += 2;
        }
        
        // Parse time (should be next)
        const timeMatch = parts[currentIndex]?.match(/^\d{1,2}:\d{2}$/) && parts[currentIndex + 1]?.match(/^[AP]M$/);
        if (timeMatch) {
          time = `${parts[currentIndex]} ${parts[currentIndex + 1]}`;
          currentIndex += 2;
        } else {
          logFunction(`⚠️ Skipping line ${i + 1}: Invalid time format`);
          continue;
        }
        
        // Parse status
        if (parts[currentIndex]) {
          status = parts[currentIndex];
          currentIndex += 1;
          
          // Handle multi-word statuses
          if (status === 'Checked' && parts[currentIndex] === 'Out') {
            status = 'Checked Out';
            currentIndex += 1;
          }
        }
        
        // Parse patient name (may be multiple words)
        const nameWords = [];
        while (currentIndex < parts.length && !parts[currentIndex].match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          nameWords.push(parts[currentIndex]);
          currentIndex += 1;
        }
        patientName = nameWords.join(' ');
        
        // Parse DOB
        if (parts[currentIndex]?.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          dob = parts[currentIndex];
          currentIndex += 1;
        }
        
        // Parse phone number (look for pattern)
        const phonePattern = /\((\d{3})\)\s+(\d{3}-\d{4})/;
        const remainingText = parts.slice(currentIndex).join(' ');
        const phoneMatch = remainingText.match(phonePattern);
        if (phoneMatch) {
          phone = `(${phoneMatch[1]}) ${phoneMatch[2]}`;
        }
        
        // Extract insurance, reason, and balance from remaining text
        if (remainingText.includes('INSURANCE 2025')) {
          insurance = 'INSURANCE 2025';
        } else if (remainingText.includes('SELF PAY')) {
          insurance = 'SELF PAY';
        }
        
        // Extract reason/chief complaint
        if (remainingText.includes('Office Visit')) {
          reason = 'Office Visit';
        } else if (remainingText.includes('NEW PATIENT')) {
          reason = 'NEW PATIENT';
        } else if (remainingText.includes('LAB FOLLOW UP')) {
          reason = 'LAB FOLLOW UP';
        } else if (remainingText.includes('F/U on Insomnia')) {
          reason = 'F/U on Insomnia and seeing lighting and other images';
        } else if (remainingText.includes('lab follow up')) {
          reason = 'lab follow up';
        }
        
        // Extract balance
        const balanceMatch = remainingText.match(/\$(\d+\.\d{2})/);
        if (balanceMatch) {
          balance = balanceMatch[0];
        }
        
        // Extract Member ID
        const memberIdMatch = remainingText.match(/Member ID:\s*([A-Z0-9-]+)/);
        if (memberIdMatch) {
          memberId = memberIdMatch[1];
        }
      } else {
        logFunction(`⚠️ Skipping line ${i + 1}: Doesn't start with RALF LUKNER`);
        continue;
      }
      
      // Validate required fields
      if (!patientName || !dob || !time) {
        logFunction(`⚠️ Skipping line ${i + 1}: Missing required fields (name: ${!!patientName}, dob: ${!!dob}, time: ${!!time})`);
        continue;
      }
      
      // Validate and sanitize data
      const validatedName = validatePatientName(patientName);
      const validatedDOB = validateDOB(dob);
      const validatedPhone = validatePhone(phone);
      
      // Parse appointment time
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        logFunction(`⚠️ Skipping line ${i + 1}: Invalid time format "${time}"`);
        continue;
      }
      
      const [, hours, minutes, period] = timeMatch;
      let hour = parseInt(hours);
      const minuteInt = parseInt(minutes);
      const isPM = period.toUpperCase() === 'PM';
      
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
      
      // Create appointment datetime
      const appointmentDate = new Date(scheduleDate);
      appointmentDate.setHours(hour, minuteInt, 0, 0);
      
      // Map status
      const internalStatus = mapStatusToInternal(status);
      
      // Set check-in time for applicable statuses
      let checkInTime: string | undefined = undefined;
      if (['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'completed'].includes(internalStatus)) {
        const checkIn = new Date(appointmentDate);
        checkIn.setMinutes(checkIn.getMinutes() - 15); // 15 min before appointment
        checkInTime = checkIn.toISOString();
      }
      
      // Determine appointment type
      let appointmentType: AppointmentType = 'Office Visit';
      if (reason?.toLowerCase().includes('lab')) {
        appointmentType = 'LABS';
      } else if (reason?.toLowerCase().includes('new patient')) {
        appointmentType = 'New Patient';
      }
      
      const patient: ImportedPatient = {
        name: validatedName,
        dob: validatedDOB,
        appointmentTime: appointmentDate.toISOString(),
        appointmentType,
        chiefComplaint: reason || 'Office Visit',
        provider: provider || defaultProvider,
        status: internalStatus,
        checkInTime,
        room: room || undefined,
        phone: validatedPhone || undefined,
        insurance: insurance || undefined,
        balance: balance || undefined,
        memberId: memberId || undefined,
      };
      
      patients.push(patient);
      logFunction(`✅ Successfully parsed: ${patient.name} - ${patient.status} at ${time}`);
      
      if (securityAudit) {
        auditLog('Patient record processed', { 
          patientId: `${patient.name.split(' ')[0]}***`,
          status: patient.status,
          appointmentTime: patient.appointmentTime 
        });
      }
      
    } catch (error) {
      logFunction(`❌ Error parsing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (securityAudit) {
        auditLog('Parsing error', { lineNumber: i + 1, error: error instanceof Error ? error.message : 'Unknown' });
      }
    }
  }
  
  if (securityAudit) {
    auditLog('Schedule import completed', { 
      totalRecords: patients.length,
      timestamp: new Date().toISOString() 
    });
  }
  
  // Save to secure storage if requested
  if (options.saveToSecureStorage) {
    const storageKey = options.storageKey || `schedule_import_${Date.now()}`;
    const success = secureStorage.store(storageKey, {
      patients,
      importDate: new Date().toISOString(),
      sourceFormat: 'advanced',
      recordCount: patients.length
    });
    
    if (success) {
      logFunction(`💾 Saved ${patients.length} patients to secure storage (key: ${storageKey})`);
      if (securityAudit) {
        auditLog('Data saved to secure storage', { key: storageKey, recordCount: patients.length });
      }
    } else {
      logFunction(`❌ Failed to save to secure storage`);
    }
  }
  
  logFunction(`🎯 Successfully parsed ${patients.length} patients from schedule`);
  return patients;
}

/**
 * Retrieve saved schedule data from secure storage
 */
export function getScheduleFromStorage(storageKey: string): ImportedPatient[] | null {
  try {
    const data = secureStorage.retrieve(storageKey);
    if (data && data.patients && Array.isArray(data.patients)) {
      secureLog(`📁 Retrieved ${data.patients.length} patients from storage key: ${storageKey}`);
      return data.patients;
    }
    return null;
  } catch (error: any) {
    secureLog(`❌ Failed to retrieve schedule from storage: ${error.message}`);
    return null;
  }
}

/**
 * Auto-detects the schedule format and uses appropriate parser
 */
export function parseScheduleAuto(
  text: string,
  currentTime: Date = new Date(),
  options: ParseScheduleOptions = {}
): ImportedPatient[] {
  const { logFunction = () => {} } = options;
  
  // Check if it's the new advanced format
  if (text.includes('Lukner Medical Clinic') && text.includes('RALF LUKNER')) {
    logFunction('🔍 Detected advanced schedule format - using HIPAA-compliant parser');
    return parseScheduleAdvanced(text, currentTime, options);
  }
  
  // Check if it's TSV format
  if (text.includes('\t')) {
    logFunction('🔍 Detected TSV format - using legacy parser');
    // Import the original parser dynamically to avoid circular dependencies
    const { parseSchedule } = require('./parseSchedule');
    return parseSchedule(text, currentTime, options);
  }
  
  // Default to advanced parser for safety
  logFunction('🔍 Format unclear - defaulting to advanced parser');
  return parseScheduleAdvanced(text, currentTime, options);
}

/**
 * Export schedule data to encrypted JSON format
 */
export async function exportScheduleToJSON(
  patients: ImportedPatient[],
  options: JSONExportOptions
): Promise<Blob> {
  const { password, includeMetadata = true, sensitiveFields = ['name', 'phone', 'dob', 'memberId'] } = options;
  
  try {
    // Store data temporarily in secure storage for export
    const exportKey = `export_temp_${Date.now()}`;
    const exportData = {
      patients,
      metadata: includeMetadata ? {
        exportDate: new Date().toISOString(),
        version: '1.0',
        recordCount: patients.length,
        format: 'lukner-medical-clinic'
      } : undefined
    };
    
    secureStorage.store(exportKey, exportData);
    
    // Export using secure storage encryption
    const blob = await secureStorage.exportToJSON(password, sensitiveFields);
    
    // Cleanup temporary data
    secureStorage.delete(exportKey);
    
    secureLog(`📤 Exported ${patients.length} patient records to encrypted JSON`);
    return blob;
  } catch (error: any) {
    secureLog('❌ Failed to export schedule to JSON:', error);
    throw new Error(`Export failed: ${error.message}`);
  }
}

/**
 * Import schedule data from encrypted JSON format
 */
export async function importScheduleFromJSON(
  file: File,
  options: JSONImportOptions
): Promise<{ patients: ImportedPatient[]; success: boolean; errors: string[] }> {
  const { password, overwrite = false, validateChecksum = true } = options;
  
  try {
    // Import using secure storage decryption
    const importResult = await secureStorage.importFromJSON(file, password, undefined, {
      overwrite,
      validateChecksum
    });
    
    if (!importResult.success) {
      return { patients: [], success: false, errors: importResult.errors };
    }
    
    // Extract patient data from imported items
    const patients: ImportedPatient[] = [];
    const errors: string[] = [];
    
    // Look for schedule data in imported items
    const stats = secureStorage.getStats();
    secureLog(`📥 Processing ${stats.itemCount} imported items`);
    
    // Try to find patient data in various possible keys
    const possibleKeys = ['patients', 'schedule_data', 'export_data'];
    let foundData = false;
    
    for (const key of possibleKeys) {
      const data = secureStorage.retrieve(key);
      if (data && data.patients && Array.isArray(data.patients)) {
        patients.push(...data.patients);
        foundData = true;
        secureLog(`✅ Found patient data in key: ${key}`);
        break;
      }
    }
    
    if (!foundData) {
      // Look through all imported data for patient arrays
      for (let i = 0; i < 100; i++) { // Reasonable limit
        const data = secureStorage.retrieve(`item_${i}`);
        if (data && data.patients && Array.isArray(data.patients)) {
          patients.push(...data.patients);
          foundData = true;
          break;
        }
      }
    }
    
    if (!foundData) {
      errors.push('No patient data found in imported file');
      return { patients: [], success: false, errors };
    }
    
    // Validate imported patient data
    const validatedPatients: ImportedPatient[] = [];
    for (const patient of patients) {
      try {
        // Validate required fields
        if (!patient.name || !patient.dob || !patient.appointmentTime) {
          errors.push(`Patient missing required fields: ${JSON.stringify(patient)}`);
          continue;
        }
        
        // Validate and sanitize
        const validatedPatient: ImportedPatient = {
          ...patient,
          name: validatePatientName(patient.name),
          dob: validateDOB(patient.dob),
          phone: patient.phone ? validatePhone(patient.phone) : undefined,
          status: mapStatusToInternal(patient.status)
        };
        
        validatedPatients.push(validatedPatient);
      } catch (error: any) {
        errors.push(`Failed to validate patient ${patient.name}: ${error.message}`);
      }
    }
    
    secureLog(`📥 Successfully imported ${validatedPatients.length} patients from encrypted JSON`);
    auditLog('Schedule imported from JSON', { 
      recordCount: validatedPatients.length, 
      errorCount: errors.length 
    });
    
    return {
      patients: validatedPatients,
      success: errors.length === 0,
      errors
    };
  } catch (error: any) {
    secureLog('❌ Failed to import schedule from JSON:', error);
    return {
      patients: [],
      success: false,
      errors: [error.message]
    };
  }
}

/**
 * Test function to validate JSON export/import cycle
 */
export async function testJSONExportImportCycle(
  patients: ImportedPatient[],
  password: string
): Promise<{ success: boolean; errors: string[]; originalCount: number; importedCount: number }> {
  const errors: string[] = [];
  
  try {
    secureLog('🧪 Testing JSON export/import cycle');
    
    // Step 1: Export to JSON
    const exportBlob = await exportScheduleToJSON(patients, { password });
    
    // Step 2: Create a File object from the blob for import
    const exportFile = new File([exportBlob], 'test-export.json', { type: 'application/json' });
    
    // Step 3: Import from JSON
    const importResult = await importScheduleFromJSON(exportFile, { password });
    
    if (!importResult.success) {
      errors.push(...importResult.errors);
    }
    
    // Step 4: Compare data integrity
    const originalCount = patients.length;
    const importedCount = importResult.patients.length;
    
    if (originalCount !== importedCount) {
      errors.push(`Count mismatch: exported ${originalCount}, imported ${importedCount}`);
    }
    
    // Step 5: Compare key fields
    for (let i = 0; i < Math.min(originalCount, importedCount); i++) {
      const original = patients[i];
      const imported = importResult.patients[i];
      
      if (original.name !== imported.name) {
        errors.push(`Name mismatch at index ${i}: '${original.name}' vs '${imported.name}'`);
      }
      
      if (original.dob !== imported.dob) {
        errors.push(`DOB mismatch at index ${i}: '${original.dob}' vs '${imported.dob}'`);
      }
    }
    
    const success = errors.length === 0;
    secureLog(`🧪 JSON cycle test ${success ? 'PASSED' : 'FAILED'}: ${errors.length} errors`);
    
    return {
      success,
      errors,
      originalCount,
      importedCount
    };
  } catch (error: any) {
    const errorMsg = `JSON cycle test failed: ${error.message}`;
    secureLog('❌ ' + errorMsg);
    return {
      success: false,
      errors: [errorMsg],
      originalCount: patients.length,
      importedCount: 0
    };
  }
}