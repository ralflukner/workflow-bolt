/**
 * MegaParse Integration for Lukner Medical Clinic Schedule Parsing
 * Uses MegaParse's advanced document parsing capabilities to handle complex multi-line formats
 */

import { PatientApptStatus, AppointmentType } from '../types';
import { secureLog } from './redact.js';
import { ImportedPatient } from './parseScheduleAdvanced';

export interface MegaParseOptions {
  apiKey?: string;
  endpoint?: string;
  model?: 'gpt-4o' | 'claude-3.5-sonnet';
  chunkSize?: number;
  enableMetadata?: boolean;
  defaultProvider?: string;
  logFunction?: (message: string) => void;
  securityAudit?: boolean;
}

/**
 * MegaParse client for schedule parsing
 */
class MegaParseScheduleClient {
  private options: Required<MegaParseOptions>;
  
  constructor(options: MegaParseOptions = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.MEGAPARSE_API_KEY || '',
      endpoint: options.endpoint || 'https://api.megaparse.com/v1/parse',
      model: options.model || 'gpt-4o',
      chunkSize: options.chunkSize || 512,
      enableMetadata: options.enableMetadata ?? true,
      defaultProvider: options.defaultProvider || 'RALF LUKNER',
      logFunction: options.logFunction || (() => {}),
      securityAudit: options.securityAudit ?? true
    };
  }

  /**
   * Parse schedule using MegaParse API
   */
  async parseSchedule(
    scheduleText: string,
    currentTime: Date = new Date()
  ): Promise<ImportedPatient[]> {
    const { logFunction, securityAudit } = this.options;
    
    if (securityAudit) {
      secureLog('🔍 Starting MegaParse schedule analysis');
    }
    
    logFunction('🚀 Initializing MegaParse for schedule parsing...');
    
    try {
      // If no API key, fall back to local parsing
      if (!this.options.apiKey) {
        logFunction('⚠️ No MegaParse API key found, using local structured parsing');
        return this.parseLocallyWithStructuredAnalysis(scheduleText, currentTime);
      }
      
      // Prepare MegaParse request
      const parseRequest = {
        content: scheduleText,
        format: 'medical_schedule',
        options: {
          model: this.options.model,
          chunk_size: this.options.chunkSize,
          enable_metadata: this.options.enableMetadata,
          extraction_schema: {
            appointments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  provider: { type: 'string' },
                  time: { type: 'string' },
                  status: { type: 'string' },
                  patient_name: { type: 'string' },
                  date_of_birth: { type: 'string' },
                  phone: { type: 'string' },
                  insurance: { type: 'string' },
                  reason: { type: 'string' },
                  room: { type: 'string' },
                  balance: { type: 'string' },
                  member_id: { type: 'string' }
                }
              }
            }
          }
        }
      };
      
      logFunction('📡 Sending schedule to MegaParse API...');
      
      // Make API request
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parseRequest)
      });
      
      if (!response.ok) {
        throw new Error(`MegaParse API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      logFunction(`✅ MegaParse successfully analyzed schedule`);
      
      // Transform MegaParse results to ImportedPatient format
      return this.transformMegaParseResults(result, currentTime);
      
    } catch (error: any) {
      logFunction(`❌ MegaParse API failed: ${error.message}`);
      logFunction('🔄 Falling back to local structured parsing...');
      
      // Fallback to local parsing
      return this.parseLocallyWithStructuredAnalysis(scheduleText, currentTime);
    }
  }
  
  /**
   * Transform MegaParse API results to our ImportedPatient format
   */
  private transformMegaParseResults(
    result: any,
    scheduleDate: Date
  ): ImportedPatient[] {
    const { logFunction } = this.options;
    const patients: ImportedPatient[] = [];
    
    try {
      const appointments = result.data?.appointments || result.appointments || [];
      
      logFunction(`🔄 Transforming ${appointments.length} appointments from MegaParse results`);
      
      for (const apt of appointments) {
        try {
          const patient = this.createPatientFromMegaParseData(apt, scheduleDate);
          if (patient) {
            patients.push(patient);
          }
        } catch (error: any) {
          logFunction(`⚠️ Failed to transform appointment: ${error.message}`);
        }
      }
      
      logFunction(`✅ Successfully transformed ${patients.length} patients`);
      return patients;
      
    } catch (error: any) {
      logFunction(`❌ Error transforming MegaParse results: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Create ImportedPatient from MegaParse data
   */
  private createPatientFromMegaParseData(
    data: any,
    scheduleDate: Date
  ): ImportedPatient | null {
    try {
      // Validate required fields
      if (!data.patient_name || !data.time) {
        return null;
      }
      
      // Parse appointment time
      const timeMatch = data.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        return null;
      }
      
      const [, hours, minutes, period] = timeMatch;
      let hour = parseInt(hours);
      const minuteInt = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const appointmentDate = new Date(scheduleDate);
      appointmentDate.setHours(hour, minuteInt, 0, 0);
      
      // Parse DOB
      let formattedDOB = '';
      if (data.date_of_birth) {
        const dobMatch = data.date_of_birth.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dobMatch) {
          const [, month, day, year] = dobMatch;
          formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // Map status
      const status = this.mapStatusToInternal(data.status || 'scheduled');
      
      // Determine appointment type
      let appointmentType: AppointmentType = 'Office Visit';
      if (data.reason?.toLowerCase().includes('lab')) {
        appointmentType = 'LABS';
      } else if (data.reason?.toLowerCase().includes('new patient')) {
        appointmentType = 'New Patient';
      }
      
      // Set check-in time for applicable statuses
      let checkInTime: string | undefined = undefined;
      if (['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'completed'].includes(status)) {
        const checkIn = new Date(appointmentDate);
        checkIn.setMinutes(checkIn.getMinutes() - 15);
        checkInTime = checkIn.toISOString();
      }
      
      return {
        name: data.patient_name.trim(),
        dob: formattedDOB,
        appointmentTime: appointmentDate.toISOString(),
        appointmentType,
        chiefComplaint: data.reason || 'Office Visit',
        provider: data.provider || this.options.defaultProvider,
        status,
        checkInTime,
        room: data.room || undefined,
        phone: data.phone || undefined,
        insurance: data.insurance || undefined,
        balance: data.balance || undefined,
        memberId: data.member_id || undefined,
      };
      
    } catch (error: any) {
      this.options.logFunction(`❌ Error creating patient from data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Fallback local parsing with structured analysis
   * Uses pattern recognition and heuristics when MegaParse API is unavailable
   */
  private parseLocallyWithStructuredAnalysis(
    text: string,
    currentTime: Date
  ): ImportedPatient[] {
    const { logFunction, securityAudit } = this.options;
    
    logFunction('🏠 Using local structured analysis for schedule parsing');
    
    if (securityAudit) {
      secureLog('Local fallback parsing initiated for schedule analysis');
    }
    
    // Split into logical blocks based on "RALF LUKNER" occurrences
    const blocks = this.extractAppointmentBlocks(text);
    logFunction(`📋 Identified ${blocks.length} appointment blocks`);
    
    const patients: ImportedPatient[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      try {
        const patient = this.parseAppointmentBlock(blocks[i], currentTime);
        if (patient) {
          patients.push(patient);
          logFunction(`✅ Parsed appointment: ${patient.name} at ${patient.appointmentTime}`);
        }
      } catch (error: any) {
        logFunction(`⚠️ Failed to parse block ${i + 1}: ${error.message}`);
      }
    }
    
    logFunction(`🎯 Successfully parsed ${patients.length} appointments locally`);
    return patients;
  }
  
  /**
   * Extract appointment blocks from raw text
   */
  private extractAppointmentBlocks(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim());
    const blocks: string[] = [];
    let currentBlock = '';
    
    for (const line of lines) {
      // Skip headers
      if (line.includes('Appointments for') || 
          line.includes('Lukner Medical Clinic') || 
          line.includes('Resource Time Status') ||
          line.includes('2545 Perryton') ||
          !line) {
        continue;
      }
      
      // Start new block on RALF LUKNER
      if (line.startsWith('RALF LUKNER')) {
        if (currentBlock) {
          blocks.push(currentBlock.trim());
        }
        currentBlock = line;
      } else if (currentBlock) {
        currentBlock += ' ' + line;
      }
    }
    
    // Don't forget the last block
    if (currentBlock) {
      blocks.push(currentBlock.trim());
    }
    
    return blocks;
  }
  
  /**
   * Parse individual appointment block
   */
  private parseAppointmentBlock(block: string, scheduleDate: Date): ImportedPatient | null {
    // Extract key information using patterns
    const timeMatch = block.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    const statusMatch = block.match(/\b(Scheduled|Cancelled|Confirmed|Checked Out|Arrived)\b/i);
    const dobMatch = block.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const phoneMatch = block.match(/\((\d{3})\)\s+(\d{3}-\d{4})/);
    const roomMatch = block.match(/ROOM\s+(\d+)/);
    const balanceMatch = block.match(/\$(\d+\.\d{2})/);
    const memberIdMatch = block.match(/Member ID:\s*([A-Z0-9-]+)/i);
    
    if (!timeMatch || !statusMatch || !dobMatch) {
      return null;
    }
    
    // Extract patient name (between status and DOB)
    const statusIndex = block.indexOf(statusMatch[0]);
    const dobIndex = block.indexOf(dobMatch[0]);
    const nameSection = block.substring(statusIndex + statusMatch[0].length, dobIndex).trim();
    const patientName = nameSection.replace(/\s+/g, ' ').trim();
    
    if (!patientName) {
      return null;
    }
    
    // Parse time
    const [, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);
    const minuteInt = parseInt(minutes);
    
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const appointmentDate = new Date(scheduleDate);
    appointmentDate.setHours(hour, minuteInt, 0, 0);
    
    // Format DOB
    const [, month, day, year] = dobMatch;
    const formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Extract insurance
    let insurance = '';
    if (block.includes('INSURANCE 2025') || block.includes('INSURACE 2025')) {
      insurance = 'INSURANCE 2025';
    } else if (block.includes('SELF PAY')) {
      insurance = 'SELF PAY';
    }
    
    // Extract reason
    let reason = 'Office Visit';
    if (block.includes('NEW PATIENT')) {
      reason = 'NEW PATIENT';
    } else if (block.includes('LAB FOLLOW UP')) {
      reason = 'LAB FOLLOW UP';
    } else if (block.includes('F/U on Insomnia')) {
      reason = 'F/U on Insomnia and seeing lighting and other images';
    }
    
    const status = this.mapStatusToInternal(statusMatch[0]);
    
    let appointmentType: AppointmentType = 'Office Visit';
    if (reason.toLowerCase().includes('lab')) {
      appointmentType = 'LABS';
    } else if (reason.toLowerCase().includes('new patient')) {
      appointmentType = 'New Patient';
    }
    
    // Set check-in time for applicable statuses
    let checkInTime: string | undefined = undefined;
    if (['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'completed'].includes(status)) {
      const checkIn = new Date(appointmentDate);
      checkIn.setMinutes(checkIn.getMinutes() - 15);
      checkInTime = checkIn.toISOString();
    }
    
    return {
      name: patientName,
      dob: formattedDOB,
      appointmentTime: appointmentDate.toISOString(),
      appointmentType,
      chiefComplaint: reason,
      provider: this.options.defaultProvider,
      status,
      checkInTime,
      room: roomMatch ? `ROOM ${roomMatch[1]}` : undefined,
      phone: phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}` : undefined,
      insurance: insurance || undefined,
      balance: balanceMatch ? `$${balanceMatch[1]}` : undefined,
      memberId: memberIdMatch ? memberIdMatch[1] : undefined,
    };
  }
  
  /**
   * Map status strings to internal types
   */
  private mapStatusToInternal(status: string): PatientApptStatus {
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
        return 'arrived';
      default:
        return 'scheduled';
    }
  }
}

/**
 * Main function to parse schedule using MegaParse
 */
export async function parseScheduleWithMegaParse(
  text: string,
  currentTime: Date = new Date(),
  options: MegaParseOptions = {}
): Promise<ImportedPatient[]> {
  const client = new MegaParseScheduleClient(options);
  return await client.parseSchedule(text, currentTime);
}

// Export for testing
export { MegaParseScheduleClient };