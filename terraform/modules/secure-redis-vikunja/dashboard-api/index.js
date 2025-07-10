const { Pool } = require('pg');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Database connection pool
let pool;

/**
 * Initialize database connection pool
 */
async function initializePool() {
  if (pool) return pool;

  // Get database password from Secret Manager
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.PROJECT_ID}/secrets/dashboard-db-password-${process.env.ENVIRONMENT}/versions/latest`,
  });

  const password = version.payload.data.toString('utf8');

  pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: password,
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
}

/**
 * Main Cloud Function handler
 */
exports.handleRequest = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const pool = await initializePool();

    switch (req.path) {
      case '/patients':
        await handlePatients(req, res, pool);
        break;
      case '/sessions':
        await handleSessions(req, res, pool);
        break;
      case '/health':
        res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
        break;
      default:
        res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handle patient-related requests
 */
async function handlePatients(req, res, pool) {
  switch (req.method) {
    case 'GET':
      const { status, q } = req.query;
      let query = 'SELECT * FROM patients WHERE 1=1';
      const params = [];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      if (q) {
        params.push(`%${q}%`);
        query += ` AND (name ILIKE $${params.length} OR mrn ILIKE $${params.length})`;
      }

      query += ' ORDER BY appointment_time ASC';

      const result = await pool.query(query, params);
      res.json({ patients: result.rows });
      break;

    case 'POST':
      const newPatient = req.body;
      const insertResult = await pool.query(
        `INSERT INTO patients (name, mrn, appointment_time, status, room, provider, chief_complaint, check_in_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          newPatient.name,
          newPatient.mrn,
          newPatient.appointmentTime,
          newPatient.status || 'scheduled',
          newPatient.room,
          newPatient.provider,
          newPatient.chiefComplaint,
          newPatient.checkInTime
        ]
      );
      res.json({ patient: insertResult.rows[0] });
      break;

    case 'PUT':
      if (req.path.includes('/batch')) {
        const { patients } = req.body;
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          for (const patient of patients) {
            await client.query(
              `INSERT INTO patients (id, name, mrn, appointment_time, status, room, provider, chief_complaint, check_in_time)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO UPDATE SET
                 name = EXCLUDED.name,
                 mrn = EXCLUDED.mrn,
                 appointment_time = EXCLUDED.appointment_time,
                 status = EXCLUDED.status,
                 room = EXCLUDED.room,
                 provider = EXCLUDED.provider,
                 chief_complaint = EXCLUDED.chief_complaint,
                 check_in_time = EXCLUDED.check_in_time`,
              [
                patient.id,
                patient.name,
                patient.mrn,
                patient.appointmentTime,
                patient.status,
                patient.room,
                patient.provider,
                patient.chiefComplaint,
                patient.checkInTime
              ]
            );
          }
          
          await client.query('COMMIT');
          res.json({ patients: patients });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle session-related requests
 */
async function handleSessions(req, res, pool) {
  switch (req.method) {
    case 'GET':
      const { startDate, endDate } = req.query;
      const result = await pool.query(
        'SELECT * FROM daily_sessions WHERE date >= $1 AND date <= $2 ORDER BY date DESC',
        [startDate, endDate]
      );
      res.json({ sessions: result.rows });
      break;

    case 'POST':
      const session = req.body;
      await pool.query(
        `INSERT INTO daily_sessions (id, date, patients, created_at, updated_at, version)
         VALUES ($1, $2, $3, NOW(), NOW(), 1)
         ON CONFLICT (id) DO UPDATE SET
           patients = $3,
           updated_at = NOW(),
           version = daily_sessions.version + 1`,
        [session.id, session.date, JSON.stringify(session.patients)]
      );
      res.json({ success: true });
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 