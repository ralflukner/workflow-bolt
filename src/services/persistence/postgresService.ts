/**
 * PostgreSQL Service for Patient Data Persistence
 * Replaces Firestore for HIPAA-compliant data storage
 */

import { Pool } from 'pg';
import { Patient, DailySession, SessionData } from '../../types';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || 'luknerlumina',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
export async function initializeDatabase() {
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
        deleted_at TIMESTAMP
      )
    `);

    // Create daily_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_sessions (
        id VARCHAR(255) PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_session_data_timestamp ON session_data(timestamp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_session_data_patient_id ON session_data(patient_id)');

    console.log('Database tables initialized successfully');
  } finally {
    client.release();
  }
}

// Patient operations
export const patientService = {
  async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const id = `PAT${Date.now()}`;
    const query = `
      INSERT INTO patients (id, first_name, last_name, date_of_birth, phone, email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [id, patient.firstName, patient.lastName, patient.dateOfBirth, patient.phone, patient.email];
    
    const result = await pool.query(query, values);
    return mapDbPatientToPatient(result.rows[0]);
  },

  async getById(id: string): Promise<Patient | null> {
    const query = 'SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return mapDbPatientToPatient(result.rows[0]);
  },

  async getAll(): Promise<Patient[]> {
    const query = 'SELECT * FROM patients WHERE deleted_at IS NULL ORDER BY last_name, first_name';
    const result = await pool.query(query);
    
    return result.rows.map(mapDbPatientToPatient);
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.firstName !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.dateOfBirth !== undefined) {
      updateFields.push(`date_of_birth = $${paramCount++}`);
      values.push(updates.dateOfBirth);
    }
    if (updates.phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updateFields.length === 0) return null;

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE patients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    
    return mapDbPatientToPatient(result.rows[0]);
  },

  async delete(id: string): Promise<boolean> {
    const query = 'UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    
    return result.rowCount > 0;
  },

  async search(searchTerm: string): Promise<Patient[]> {
    const query = `
      SELECT * FROM patients 
      WHERE deleted_at IS NULL 
        AND (
          LOWER(first_name) LIKE LOWER($1) 
          OR LOWER(last_name) LIKE LOWER($1)
          OR phone LIKE $1
          OR LOWER(email) LIKE LOWER($1)
        )
      ORDER BY last_name, first_name
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    
    return result.rows.map(mapDbPatientToPatient);
  }
};

// Daily session operations
export const dailySessionService = {
  async getOrCreateSession(date: string): Promise<DailySession> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Try to get existing session
      let result = await client.query(
        'SELECT * FROM daily_sessions WHERE date = $1',
        [date]
      );

      if (result.rows.length === 0) {
        // Create new session
        const id = `SESSION${Date.now()}`;
        result = await client.query(
          'INSERT INTO daily_sessions (id, date) VALUES ($1, $2) RETURNING *',
          [id, date]
        );
      }

      await client.query('COMMIT');
      return mapDbSessionToSession(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async addSessionData(sessionId: string, data: SessionData): Promise<void> {
    const id = `DATA${Date.now()}`;
    const query = `
      INSERT INTO session_data (id, session_id, patient_id, timestamp, data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [
      id,
      sessionId,
      data.patientId,
      new Date(data.timestamp),
      JSON.stringify(data)
    ];

    await pool.query(query, values);
  },

  async getSessionData(sessionId: string): Promise<SessionData[]> {
    const query = `
      SELECT data FROM session_data 
      WHERE session_id = $1 
      ORDER BY timestamp
    `;
    const result = await pool.query(query, [sessionId]);
    
    return result.rows.map(row => row.data);
  },

  async purgeOldSessions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = 'DELETE FROM daily_sessions WHERE date < $1';
    const result = await pool.query(query, [cutoffDate]);
    
    return result.rowCount;
  },

  async getSessionStats(): Promise<{ totalSessions: number; oldestSession: Date | null }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        MIN(date) as oldest
      FROM daily_sessions
    `;
    const result = await pool.query(query);
    
    return {
      totalSessions: parseInt(result.rows[0].total),
      oldestSession: result.rows[0].oldest
    };
  }
};

// Helper functions
function mapDbPatientToPatient(dbRow: any): Patient {
  return {
    id: dbRow.id,
    firstName: dbRow.first_name,
    lastName: dbRow.last_name,
    dateOfBirth: dbRow.date_of_birth,
    phone: dbRow.phone,
    email: dbRow.email
  };
}

function mapDbSessionToSession(dbRow: any): DailySession {
  return {
    id: dbRow.id,
    date: dbRow.date,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at
  };
}

// Export pool for direct queries if needed
export { pool }; 