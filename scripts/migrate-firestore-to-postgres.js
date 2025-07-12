#!/usr/bin/env node

/**
 * Migration script: Firestore to PostgreSQL
 * Migrates patient data and daily sessions from Firestore to PostgreSQL
 */

const admin = require('firebase-admin');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin (for reading Firestore data)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'luknerlumina-firebase'
  });
}

const db = admin.firestore();

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || 'luknerlumina',
});

// Progress tracking
let progress = {
  patients: { total: 0, migrated: 0, errors: 0 },
  sessions: { total: 0, migrated: 0, errors: 0 }
};

async function initializePostgresTables() {
  console.log('🔧 Initializing PostgreSQL tables...');
  
  const client = await pool.connect();
  try {
    // Create patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(255) PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        firebase_id VARCHAR(255) UNIQUE
      )
    `);

    // Create daily_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_sessions (
        id VARCHAR(255) PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        firebase_id VARCHAR(255) UNIQUE
      )
    `);

    // Create session_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_data (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES daily_sessions(id) ON DELETE CASCADE,
        patient_id VARCHAR(255),
        timestamp TIMESTAMP NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL tables initialized');
  } finally {
    client.release();
  }
}

async function migratePatients() {
  console.log('\n📋 Migrating patients...');
  
  try {
    // Get all patients from Firestore
    const patientsSnapshot = await db.collection('patients').get();
    progress.patients.total = patientsSnapshot.size;
    console.log(`Found ${progress.patients.total} patients to migrate`);

    for (const doc of patientsSnapshot.docs) {
      try {
        const patientData = doc.data();
        
        // Extract name parts
        const nameParts = (patientData.name || '').split(' ');
        const firstName = nameParts[0] || patientData.firstName || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || patientData.lastName || 'Unknown';
        
        // Insert into PostgreSQL
        await pool.query(`
          INSERT INTO patients (
            id, first_name, last_name, date_of_birth, 
            phone, email, firebase_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (firebase_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = CURRENT_TIMESTAMP
        `, [
          patientData.id || doc.id,
          firstName,
          lastName,
          patientData.dob || patientData.dateOfBirth || null,
          patientData.phone || null,
          patientData.email || null,
          doc.id,
          patientData.createdAt?.toDate() || new Date()
        ]);

        progress.patients.migrated++;
        
        if (progress.patients.migrated % 100 === 0) {
          console.log(`Progress: ${progress.patients.migrated}/${progress.patients.total} patients`);
        }
      } catch (error) {
        console.error(`Error migrating patient ${doc.id}:`, error.message);
        progress.patients.errors++;
      }
    }

    console.log(`✅ Patients migration complete: ${progress.patients.migrated} migrated, ${progress.patients.errors} errors`);
  } catch (error) {
    console.error('❌ Failed to migrate patients:', error);
  }
}

async function migrateDailySessions() {
  console.log('\n📅 Migrating daily sessions...');
  
  try {
    // Get all daily sessions from Firestore
    const sessionsSnapshot = await db.collection('dailySessions').get();
    progress.sessions.total = sessionsSnapshot.size;
    console.log(`Found ${progress.sessions.total} sessions to migrate`);

    for (const doc of sessionsSnapshot.docs) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const sessionData = doc.data();
        const sessionDate = doc.id; // Usually in YYYY-MM-DD format
        
        // Insert session
        const sessionResult = await client.query(`
          INSERT INTO daily_sessions (id, date, firebase_id, created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (firebase_id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          `SESSION_${sessionDate.replace(/-/g, '')}`,
          sessionDate,
          doc.id,
          sessionData.createdAt?.toDate() || new Date()
        ]);

        const sessionId = sessionResult.rows[0].id;

        // Migrate session data (patient activities)
        if (sessionData.patients && Array.isArray(sessionData.patients)) {
          for (const patient of sessionData.patients) {
            await client.query(`
              INSERT INTO session_data (
                id, session_id, patient_id, timestamp, data
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              `DATA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sessionId,
              patient.id || null,
              patient.timestamp || new Date(),
              JSON.stringify(patient)
            ]);
          }
        }

        await client.query('COMMIT');
        progress.sessions.migrated++;
        
        if (progress.sessions.migrated % 10 === 0) {
          console.log(`Progress: ${progress.sessions.migrated}/${progress.sessions.total} sessions`);
        }
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error migrating session ${doc.id}:`, error.message);
        progress.sessions.errors++;
      } finally {
        client.release();
      }
    }

    console.log(`✅ Sessions migration complete: ${progress.sessions.migrated} migrated, ${progress.sessions.errors} errors`);
  } catch (error) {
    console.error('❌ Failed to migrate sessions:', error);
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const patientCount = await pool.query('SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL');
    const sessionCount = await pool.query('SELECT COUNT(*) FROM daily_sessions');
    const dataCount = await pool.query('SELECT COUNT(*) FROM session_data');
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Patients in PostgreSQL: ${patientCount.rows[0].count}`);
    console.log(`- Daily sessions in PostgreSQL: ${sessionCount.rows[0].count}`);
    console.log(`- Session data records: ${dataCount.rows[0].count}`);
    
    console.log('\n🔥 Firestore Summary:');
    console.log(`- Patients migrated: ${progress.patients.migrated}/${progress.patients.total}`);
    console.log(`- Sessions migrated: ${progress.sessions.migrated}/${progress.sessions.total}`);
    console.log(`- Total errors: ${progress.patients.errors + progress.sessions.errors}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting Firestore to PostgreSQL migration...');
  console.log('================================================\n');
  
  try {
    // Initialize tables
    await initializePostgresTables();
    
    // Run migrations
    await migratePatients();
    await migrateDailySessions();
    
    // Verify results
    await verifyMigration();
    
    console.log('\n✅ Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Update frontend to use PostgreSQL service');
    console.log('2. Test all functionality');
    console.log('3. Keep Firestore data for 30 days as backup');
    console.log('4. Monitor for any issues');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run migration
main().catch(console.error); 