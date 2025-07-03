/**
 * Integration test for MegaParse with the exact failing data from Lukner Medical Clinic
 */

import { parseScheduleWithMegaParse } from '../utils/megaParseSchedule';

describe('MegaParse Integration Test', () => {
  // The exact data that was causing failures in the original system
  const realFailingData = `Appointments for Tuesday, July 01, 2025
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

  test('MegaParse successfully parses the failing Lukner Medical Clinic data', async () => {
    console.log('🧪 Testing MegaParse with real failing data...');
    
    const logMessages: string[] = [];
    const logFunction = (message: string) => {
      logMessages.push(message);
      console.log('📋', message);
    };

    const patients = await parseScheduleWithMegaParse(
      realFailingData, 
      new Date(2025, 6, 1), // July 1st, 2025 (month is 0-indexed)
      {
        logFunction,
        securityAudit: true,
        defaultProvider: 'RALF LUKNER'
      }
    );

    console.log(`\n✅ MegaParse Results: Found ${patients.length} patients`);
    
    // Should find all 4 patients
    expect(patients).toHaveLength(4);
    
    // Verify each patient has expected data
    const expectedPatients = [
      {
        name: 'ANITA BURGER',
        status: 'Cancelled',
        time: '9:45 AM',
        dob: '1956-12-05',
        phone: '(503) 420-6404'
      },
      {
        name: 'VANCE VANCE MOXOM',
        status: 'completed',
        time: '10:30 AM',
        dob: '1939-11-28',
        phone: '(806) 205-1310',
        room: 'ROOM 1'
      },
      {
        name: 'NICHOLAS GARCIA',
        status: 'completed',
        time: '11:00 AM', 
        dob: '1994-08-25',
        phone: '(806) 440-4243',
        room: 'ROOM 2'
      },
      {
        name: 'MATT D WINBORNE',
        status: 'scheduled',
        time: '4:30 PM',
        dob: '1976-09-03',
        phone: '(806) 662-3778'
      }
    ];

    for (let i = 0; i < expectedPatients.length; i++) {
      const actual = patients[i];
      const expected = expectedPatients[i];
      
      console.log(`\n👤 Patient ${i + 1}: ${actual.name}`);
      console.log(`   Status: ${actual.status} (expected: ${expected.status})`);
      console.log(`   DOB: ${actual.dob} (expected: ${expected.dob})`);
      console.log(`   Phone: ${actual.phone} (expected: ${expected.phone})`);
      
      expect(actual.name).toBe(expected.name);
      expect(actual.status).toBe(expected.status);
      expect(actual.dob).toBe(expected.dob);
      expect(actual.phone).toBe(expected.phone);
      expect(actual.provider).toBe('RALF LUKNER');
      expect(actual.appointmentTime).toBeTruthy();
      
      if (expected.room) {
        expect(actual.room).toBe(expected.room);
      }
    }

    console.log('\n🎉 All patient data correctly parsed by MegaParse!');
    console.log('\n📊 Summary:');
    console.log(`   - Total patients: ${patients.length}`);
    console.log(`   - Cancelled: ${patients.filter(p => p.status === 'Cancelled').length}`);
    console.log(`   - Completed: ${patients.filter(p => p.status === 'completed').length}`);
    console.log(`   - Scheduled: ${patients.filter(p => p.status === 'scheduled').length}`);
    
    // Verify all have proper appointments times
    patients.forEach(patient => {
      const aptTime = new Date(patient.appointmentTime);
      expect(aptTime.getFullYear()).toBe(2025);
      expect(aptTime.getMonth()).toBe(6); // July is month 6 (0-indexed)
      expect(aptTime.getDate()).toBe(1);
    });
  }, 10000);

  test('MegaParse demonstrates improvement over legacy parser', async () => {
    console.log('\n🔀 Comparing MegaParse vs Legacy Parser...');
    
    // Import legacy parser for comparison
    const { parseSchedule } = await import('../utils/parseSchedule');
    
    // Test legacy parser (should fail)
    let legacyResults: any[] = [];
    try {
      legacyResults = parseSchedule(realFailingData, new Date(2025, 6, 1));
    } catch (error) {
      console.log('❌ Legacy parser failed as expected:', error);
    }
    
    // Test MegaParse (should succeed)
    const megaParseResults = await parseScheduleWithMegaParse(
      realFailingData, 
      new Date(2025, 6, 1),
      { defaultProvider: 'RALF LUKNER' }
    );
    
    console.log(`\n📈 Comparison Results:`);
    console.log(`   Legacy parser: ${legacyResults.length} patients`);
    console.log(`   MegaParse: ${megaParseResults.length} patients`);
    
    // MegaParse should significantly outperform legacy parser
    expect(megaParseResults.length).toBeGreaterThan(legacyResults.length);
    expect(megaParseResults.length).toBe(4); // Should find all 4 patients
    
    console.log('✅ MegaParse successfully handles complex format that legacy parser cannot!');
  });
});