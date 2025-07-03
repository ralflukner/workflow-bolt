/**
 * Test the real schedule format from Lukner Medical Clinic
 */

import { parseScheduleAdvanced } from '../utils/parseScheduleAdvanced';

describe('Real Schedule Format Tests', () => {
  const realScheduleData = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
2545 Perryton Pkwy Ste 31, Pampa, TX 79065-2820
Resource Time Status Patient Contact Primary Ins. Eligibility Reason Location Notes Balance
RALF LUKNER 9:45 AM Cancelled ANITA BURGER
12/05/1956
(503) 420-6404
((M))
- - Office Visit Lukner
Medical
Clinic
Reason: Office
Visit Comment:
New patient
orientation, new
to Pampa
Member ID:
7R43-CA8-
RQ85
$0.00
RALF LUKNER
ROOM 1
10:30
AM
Checked
Out
VANCE VANCE
MOXOM
11/28/1939
(806) 205-1310
((M))
INSURACE 2025 - Office Visit Lukner
Medical
Clinic
lab follow up $0.00
RALF LUKNER
ROOM 2
11:00
AM
Checked
Out
NICHOLAS
GARCIA
8/25/1994
(806) 440-4243
((M))
INSURANCE 2025 - Office Visit Lukner
Medical
Clinic
- $50.00
RALF LUKNER 4:30
PM
Scheduled MATT D
WINBORNE
9/03/1976
(806) 662-3778
((M))
INSURANCE 2025 - Office Visit Lukner
Medical
Clinic
- $81.29`;

  test('should parse real Lukner Medical Clinic format', () => {
    const logMessages: string[] = [];
    const logFunction = (message: string) => {
      logMessages.push(message);
      console.log(message);
    };

    const patients = parseScheduleAdvanced(realScheduleData, new Date('2025-07-01'), {
      logFunction,
      securityAudit: true
    });

    console.log('Log messages:', logMessages);
    console.log('Parsed patients:', patients);

    expect(patients.length).toBeGreaterThan(0);
    
    if (patients.length > 0) {
      const firstPatient = patients[0];
      expect(firstPatient.name).toBeTruthy();
      expect(firstPatient.dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(firstPatient.provider).toBe('RALF LUKNER');
      expect(firstPatient.appointmentTime).toBeTruthy();
    }
  });

  test('should handle single appointment entry', () => {
    const singleEntry = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 4:30
PM
Scheduled MATT D
WINBORNE
9/03/1976
(806) 662-3778
((M))
INSURANCE 2025 - Office Visit Lukner
Medical
Clinic
- $81.29`;

    const logMessages: string[] = [];
    const logFunction = (message: string) => {
      logMessages.push(message);
      console.log('DEBUG:', message);
    };

    const patients = parseScheduleAdvanced(singleEntry, new Date('2025-07-01'), { logFunction });
    
    console.log('Single entry log messages:', logMessages);
    console.log('Single entry patients:', patients);
    
    expect(patients).toHaveLength(1);
    expect(patients[0].name).toBe('MATT D WINBORNE');
    expect(patients[0].dob).toBe('1976-09-03');
    expect(patients[0].phone).toBe('(806) 662-3778');
    expect(patients[0].status).toBe('scheduled');
    expect(patients[0].insurance).toBe('INSURANCE 2025');
    expect(patients[0].balance).toBe('$81.29');
  });
});