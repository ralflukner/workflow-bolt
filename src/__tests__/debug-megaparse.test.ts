/**
 * Debug test for MegaParse implementation
 */

import { MegaParseScheduleClient } from '../utils/megaParseSchedule';

describe('Debug MegaParse', () => {
  test('should debug block extraction', () => {
    const realData = `Appointments for Tuesday, July 01, 2025
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
lab follow up $0.00`;

    const client = new MegaParseScheduleClient({
      logFunction: (msg) => console.log('CLIENT LOG:', msg)
    });

    // Access the private method for testing
    const extractBlocks = (client as any).extractAppointmentBlocks.bind(client);
    const blocks = extractBlocks(realData);
    
    console.log('=== DEBUG: Raw input lines ===');
    realData.split('\n').forEach((line, i) => {
      console.log(`Line ${i}: "${line.trim()}"`);
    });
    
    console.log('\n=== DEBUG: Extracted blocks ===');
    blocks.forEach((block, i) => {
      console.log(`Block ${i}: "${block}"`);
    });
    
    console.log(`\nTotal blocks extracted: ${blocks.length}`);
    
    // Should find blocks starting with RALF LUKNER
    expect(blocks.length).toBeGreaterThan(0);
    
    // Test individual block parsing
    if (blocks.length > 0) {
      console.log('\n=== DEBUG: Parsing first block ===');
      const parseBlock = (client as any).parseAppointmentBlock.bind(client);
      const result = parseBlock(blocks[0], new Date('2025-07-01'));
      console.log('Parsed result:', result);
    }
  });

  test('should debug regex patterns', () => {
    const testBlock = "RALF LUKNER 9:45 AM Cancelled ANITA BURGER 12/05/1956 (503) 420-6404 ((M)) - - Office Visit Lukner Medical Clinic Reason: Office Visit Comment: New patient orientation, new to Pampa Member ID: 7R43-CA8- RQ85 $0.00";
    
    console.log('=== DEBUG: Testing regex patterns ===');
    console.log('Test block:', testBlock);
    
    // Test time pattern
    const timeMatch = testBlock.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i);
    console.log('Time match:', timeMatch);
    
    // Test status pattern
    const statusMatch = testBlock.match(/\b(Scheduled|Cancelled|Confirmed|Checked Out|Arrived)\b/i);
    console.log('Status match:', statusMatch);
    
    // Test DOB pattern
    const dobMatch = testBlock.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    console.log('DOB match:', dobMatch);
    
    // Test phone pattern
    const phoneMatch = testBlock.match(/\((\d{3})\)\s+(\d{3}-\d{4})/);
    console.log('Phone match:', phoneMatch);
    
    if (timeMatch && statusMatch && dobMatch) {
      console.log('\n=== All required patterns found ===');
      
      // Test name extraction
      const statusIndex = testBlock.indexOf(statusMatch[0]);
      const dobIndex = testBlock.indexOf(dobMatch[0]);
      const nameSection = testBlock.substring(statusIndex + statusMatch[0].length, dobIndex).trim();
      const patientName = nameSection.replace(/\s+/g, ' ').trim();
      
      console.log('Status index:', statusIndex);
      console.log('DOB index:', dobIndex);
      console.log('Name section:', nameSection);
      console.log('Patient name:', patientName);
    }
  });
});