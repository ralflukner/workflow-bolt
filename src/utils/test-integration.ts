import { DailySessionService } from '../services/firebase/dailySessionService';
import tebraApi from '../services/tebraApi';
import { TebraIntegrationService, createTebraConfig } from '../tebra-soap/tebra-integration-service';
import { Patient } from '../types';

/**
 * Integration testing utility for Firebase and Tebra operations
 * This demonstrates real-world usage of both systems
 */
export class IntegrationTestUtility {
  private firebaseService: DailySessionService;
  private tebraIntegrationService: TebraIntegrationService;

  constructor() {
    this.firebaseService = new DailySessionService();
    
    // Get credentials from environment variables
    const credentials = {
      username: process.env.REACT_APP_TEBRA_USERNAME || '',
      password: process.env.REACT_APP_TEBRA_PASSWORD || '',
      customerKey: process.env.REACT_APP_TEBRA_CUSTKEY || '',
      wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL || ''
    };
    
    const config = createTebraConfig(credentials, {
      syncInterval: 5, // 5 minutes for testing
      lookAheadDays: 1,
      autoSync: false, // Manual control for testing
      fallbackToMockData: false
    });
    
    this.tebraIntegrationService = new TebraIntegrationService(config);
  }

  /**
   * Create a test patient "Test Test" and save to Firebase
   */
  async createTestPatient(): Promise<Patient> {
    const testPatient: Patient = {
      id: `test-patient-${Date.now()}`,
      name: 'Test Test',
      dob: '1985-06-15',
      appointmentTime: new Date().toISOString(),
      appointmentType: 'Office Visit',
      status: 'scheduled',
      provider: 'Dr. Test Provider',
      room: 'Room 101',
      chiefComplaint: 'Integration test patient'
    };

    console.log('🔥 Creating test patient in Firebase...');
    await this.firebaseService.saveTodaysSession([testPatient]);
    console.log('✅ Test patient saved to Firebase successfully');
    
    return testPatient;
  }

  /**
   * Retrieve patients from Firebase
   */
  async getFirebasePatients(): Promise<Patient[]> {
    console.log('🔥 Retrieving patients from Firebase...');
    const patients = await this.firebaseService.loadTodaysSession();
    console.log(`✅ Retrieved ${patients.length} patients from Firebase`);
    
    return patients;
  }

  /**
   * Search for "Test Test" patient in Tebra EHR
   */
  async searchTebraForTestPatient(): Promise<void> {
    console.log('🏥 Testing Tebra EHR connection...');
    
    try {
      // Test connection first
      const isConnected = await tebraApi.testConnection();
      if (!isConnected) {
        console.log('❌ Tebra connection failed');
        return;
      }
      console.log('✅ Tebra connection successful');

      // Search for patients with last name "Test"
      console.log('🏥 Searching for Test patients in Tebra...');
      // Note: getAllPatients is not available in the new tebraApi
      // Using searchPatients instead
      const allPatients = await tebraApi.searchPatients({ lastName: '' });
      console.log(`✅ Retrieved ${allPatients.length} total patients from Tebra`);

      // Filter for Test Test patient
      const testPatients = allPatients.filter(patient => 
        patient.FirstName.toLowerCase().includes('test') && 
        patient.LastName.toLowerCase().includes('test')
      );

      if (testPatients.length > 0) {
        console.log(`✅ Found ${testPatients.length} Test patients in Tebra:`, testPatients);
      } else {
        console.log('ℹ️ No Test Test patient found in Tebra EHR');
        console.log('ℹ️ This is expected if the test patient doesn\'t exist in the actual EHR');
      }

    } catch (error) {
      console.error('❌ Tebra search error:', error);
    }
  }

  /**
   * Test full integration flow: Tebra -> Firebase -> Retrieve
   */
  async testFullIntegration(): Promise<void> {
    console.log('\n🚀 Starting Full Integration Test...\n');

    try {
      // Initialize the integration service
      console.log('🔧 Initializing Tebra integration service...');
      await this.tebraIntegrationService.initialize();
      console.log('✅ Tebra integration service initialized');

      // Try to sync from Tebra
      console.log('🏥 Attempting to sync schedule from Tebra...');
      const syncResult = await this.tebraIntegrationService.syncTodaysSchedule();
      
      if (syncResult.success) {
        console.log(`✅ Sync successful: ${syncResult.appointmentsFound} appointments, ${syncResult.patientsFound} patients`);
      } else {
        console.log(`❌ Sync failed: ${syncResult.errors.join(', ')}`);
      }

      // Check what's in Firebase after sync
      const firebasePatients = await this.getFirebasePatients();
      console.log(`📊 Firebase now contains ${firebasePatients.length} patients`);

      // Display patient details
      if (firebasePatients.length > 0) {
        console.log('👥 Patients in Firebase:');
        firebasePatients.forEach((patient, index) => {
          console.log(`  ${index + 1}. ${patient.name} (DOB: ${patient.dob}, Status: ${patient.status})`);
        });
      }

    } catch (error) {
      console.error('❌ Integration test error:', error);
    }
  }

  /**
   * Run complete test suite
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Integration Test Suite\n');
    console.log('================================\n');

    try {
      // Test 1: Firebase Operations
      console.log('1️⃣ Testing Firebase Operations');
      console.log('------------------------------');
      await this.createTestPatient();
      const retrievedPatients = await this.getFirebasePatients();
      
      const foundTestPatient = retrievedPatients.find(p => p.name === 'Test Test');
      if (foundTestPatient) {
        console.log('✅ Test patient found in Firebase after save/retrieve');
      } else {
        console.log('❌ Test patient not found in Firebase');
      }
      console.log('');

      // Test 2: Tebra Operations  
      console.log('2️⃣ Testing Tebra EHR Operations');
      console.log('-------------------------------');
      await this.searchTebraForTestPatient();
      console.log('');

      // Test 3: Full Integration
      console.log('3️⃣ Testing Full Integration Flow');
      console.log('--------------------------------');
      await this.testFullIntegration();
      console.log('');

      console.log('🎉 Integration test suite completed!');

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    }
  }

  /**
   * Get Firebase session statistics
   */
  async getFirebaseStats(): Promise<void> {
    try {
      const stats = await this.firebaseService.getSessionStats();
      console.log('📊 Firebase Statistics:');
      console.log(`  - Backend: ${stats.backend}`);
      console.log(`  - Current session date: ${stats.currentSessionDate}`);
      console.log(`  - Has current session: ${stats.hasCurrentSession}`);
      console.log(`  - Total sessions: ${stats.totalSessions || 0}`);
      console.log(`  - Oldest session: ${stats.oldestSession || 'None'}`);
    } catch (error) {
      console.error('❌ Failed to get Firebase stats:', error);
    }
  }

  /**
   * Get Tebra rate limiter statistics
   */
  getTebraStats(): void {
    try {
      // Note: Rate limiter stats are not available in the new tebraApi
      console.log('⏱️ Tebra Rate Limiter Statistics: Not available in new API');
    } catch (error) {
      console.error('❌ Failed to get Tebra stats:', error);
    }
  }
}

// Export helper function for easy testing
export async function runIntegrationTests(): Promise<void> {
  const testUtil = new IntegrationTestUtility();
  await testUtil.runAllTests();
}

// Export individual test functions
export async function testFirebaseOperations(): Promise<void> {
  const testUtil = new IntegrationTestUtility();
  console.log('🔥 Testing Firebase Operations Only\n');
  
  const testPatient = await testUtil.createTestPatient();
  const patients = await testUtil.getFirebasePatients();
  
  console.log(`\n📊 Results: Created 1, Retrieved ${patients.length}`);
  console.log('Test patient:', testPatient);
  console.log('Retrieved patients:', patients);
}

export async function testTebraOperations(): Promise<void> {
  const testUtil = new IntegrationTestUtility();
  console.log('🏥 Testing Tebra Operations Only\n');
  
  await testUtil.searchTebraForTestPatient();
  // testUtil.getTebraStats(); // Not available in new API
} 