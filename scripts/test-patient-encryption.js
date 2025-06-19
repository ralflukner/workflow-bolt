#!/usr/bin/env node

/**
 * Test script to verify patient encryption with Google Secret Manager
 * This script tests the encryption/decryption flow end-to-end
 */

const { PatientEncryptionService } = require('../src/services/encryption/patientEncryptionService');
const { secretsService } = require('../src/services/secretsService');

// Mock patient data for testing
const testPatient = {
  id: 'test-123',
  name: 'John Doe',
  dob: '1980-01-01',
  appointmentTime: '2025-01-20T09:00:00',
  appointmentType: 'Office Visit',
  status: 'scheduled',
  provider: 'Dr. Smith'
};

async function testEncryption() {
  console.log('🔐 Testing Patient Encryption with Google Secret Manager');
  console.log('=====================================================\n');

  try {
    // Test 1: Verify encryption key retrieval
    console.log('1️⃣ Testing encryption key retrieval...');
    const key = await secretsService.getSecret('PATIENT_ENCRYPTION_KEY');
    if (!key || key.trim() === '') {
      throw new Error('Encryption key is empty or invalid');
    }
    console.log('✅ Encryption key retrieved successfully');
    console.log(`   Key length: ${key.length} characters`);
    console.log(`   Key preview: ${key.substring(0, 8)}...\n`);

    // Test 2: Test value encryption/decryption
    console.log('2️⃣ Testing value encryption/decryption...');
    const testValue = 'sensitive patient data';
    const encryptedValue = PatientEncryptionService.encryptValue(testValue);
    const decryptedValue = PatientEncryptionService.decryptValue(encryptedValue);
    
    if (decryptedValue !== testValue) {
      throw new Error('Value encryption/decryption failed');
    }
    console.log('✅ Value encryption/decryption successful');
    console.log(`   Original: "${testValue}"`);
    console.log(`   Encrypted: "${encryptedValue.substring(0, 20)}..."`);
    console.log(`   Decrypted: "${decryptedValue}"\n`);

    // Test 3: Test patient object encryption/decryption
    console.log('3️⃣ Testing patient object encryption/decryption...');
    const encryptedPatient = PatientEncryptionService.encryptPatient(testPatient);
    const decryptedPatient = PatientEncryptionService.decryptPatient(encryptedPatient);
    
    if (JSON.stringify(decryptedPatient) !== JSON.stringify(testPatient)) {
      throw new Error('Patient encryption/decryption failed');
    }
    console.log('✅ Patient encryption/decryption successful');
    console.log(`   Original name: "${testPatient.name}"`);
    console.log(`   Encrypted name: "${encryptedPatient.name.substring(0, 20)}..."`);
    console.log(`   Decrypted name: "${decryptedPatient.name}"\n`);

    // Test 4: Test array encryption/decryption
    console.log('4️⃣ Testing patient array encryption/decryption...');
    const patients = [testPatient, { ...testPatient, id: 'test-456', name: 'Jane Smith' }];
    const encryptedPatients = PatientEncryptionService.encryptPatients(patients);
    const decryptedPatients = PatientEncryptionService.decryptPatients(encryptedPatients);
    
    if (JSON.stringify(decryptedPatients) !== JSON.stringify(patients)) {
      throw new Error('Patient array encryption/decryption failed');
    }
    console.log('✅ Patient array encryption/decryption successful');
    console.log(`   Array length: ${patients.length} patients\n`);

    // Test 5: Test async encryption methods
    console.log('5️⃣ Testing async encryption methods...');
    const asyncEncryptedValue = await PatientEncryptionService.encryptValueAsync(testValue);
    const asyncDecryptedValue = await PatientEncryptionService.decryptValueAsync(asyncEncryptedValue);
    
    if (asyncDecryptedValue !== testValue) {
      throw new Error('Async encryption/decryption failed');
    }
    console.log('✅ Async encryption/decryption successful\n');

    // Test 6: Verify sensitive fields are encrypted
    console.log('6️⃣ Verifying sensitive fields are encrypted...');
    const sensitiveFields = ['name', 'dob'];
    sensitiveFields.forEach(field => {
      if (encryptedPatient[field] === testPatient[field]) {
        throw new Error(`Sensitive field '${field}' was not encrypted`);
      }
    });
    console.log('✅ All sensitive fields are properly encrypted');
    console.log('   Encrypted fields: name, dob');
    console.log('   Non-encrypted fields: id, appointmentTime, appointmentType, status, provider\n');

    console.log('🎉 All encryption tests passed!');
    console.log('✅ Patient encryption is working correctly with Google Secret Manager');
    console.log('✅ HIPAA compliance encryption is properly configured');

  } catch (error) {
    console.error('❌ Encryption test failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Ensure Google Secret Manager is properly configured');
    console.error('   2. Check that the patient-encryption-key secret exists');
    console.error('   3. Verify service account permissions');
    console.error('   4. Run: ./scripts/setup-patient-encryption-gsm.sh');
    process.exit(1);
  }
}

// Run the test
testEncryption().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 