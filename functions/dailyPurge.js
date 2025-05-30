const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Scheduled function to purge old patient session data for HIPAA compliance
 * Runs daily at 2:00 AM UTC
 */
exports.dailyDataPurge = onSchedule('0 2 * * *', async (event) => {
  console.log('Starting daily data purge for HIPAA compliance...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Query for sessions older than yesterday
    const oldSessionsQuery = db.collection('daily_sessions')
      .where('date', '<', yesterday);
    
    const querySnapshot = await oldSessionsQuery.get();
    
    if (querySnapshot.empty) {
      console.log('No old sessions to purge');
      return { success: true, message: 'No old sessions found', deletedCount: 0 };
    }
    
// Chunk into <=500-write batches
let batch = db.batch();
let opCounter = 0;
let deleteCount = 0;
const commits = [];

querySnapshot.forEach((doc) => {
  batch.delete(doc.ref);
  deleteCount++;
  if (++opCounter === 500) {
    commits.push(batch.commit());
    batch = db.batch();
    opCounter = 0;
  }
});

// Flush remaining writes
commits.push(batch.commit());
await Promise.all(commits);
    
    console.log(`Successfully purged ${deleteCount} old sessions`);
    
    // Log the purge activity for audit purposes
    await db.collection('audit_logs').add({
      action: 'scheduled_purge',
      timestamp: new Date(),
      deletedSessionCount: deleteCount,
      purgedSessions: querySnapshot.docs.map(doc => doc.id),
      reason: 'HIPAA_compliance_daily_purge'
    });
    
    return {
      success: true,
      message: `Successfully purged ${deleteCount} old sessions`,
      deletedCount: deleteCount
    };
    
  } catch (error) {
    console.error('Daily purge failed:', error);
    
    // Log the error for monitoring
    await db.collection('audit_logs').add({
      action: 'scheduled_purge_failed',
      timestamp: new Date(),
      error: {
  message: error.message,
  stack: error.stack,
},
      reason: 'HIPAA_compliance_daily_purge_error'
    });
    
    throw error; // Re-throw to trigger Cloud Function retry
  }
});

/**
 * Manual purge function for admin use
 * Requires authentication and admin role
 * Note: Converted from scheduled to on-demand function to prevent unnecessary executions
 */
// DISABLED: Previously scheduled every minute causing unnecessary cost
// exports.manualDataPurge = onSchedule('* * * * *', async (event) => {
//   // This is a placeholder - in production, this would be an HTTP function
//   // with proper authentication and authorization
//   console.log('Manual purge function placeholder');
//   return { message: 'Use HTTP function for manual purge' };
// });

/**
 * Manual data purge function for authenticated admin use
 * Call this function only when manual purge is needed
 */
exports.manualDataPurge = onCall(async (request) => {
  // TODO: Add authentication check
  // if (!request.auth || !request.auth.token.admin) {
  //   throw new HttpsError('permission-denied', 'Admin access required');
  // }
  
  console.log('Manual purge function called by admin');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Query for all sessions (manual purge can be more aggressive)
    const allSessionsQuery = db.collection('daily_sessions');
    const querySnapshot = await allSessionsQuery.get();
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No sessions to purge', deletedCount: 0 };
    }
    
    // Chunk into <=500-write batches
    let batch = db.batch();
    let opCounter = 0;
    let deleteCount = 0;
    const commits = [];

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
      if (++opCounter === 500) {
        commits.push(batch.commit());
        batch = db.batch();
        opCounter = 0;
      }
    });

    // Flush remaining writes
    if (opCounter > 0) {
      commits.push(batch.commit());
    }
    await Promise.all(commits);
    
    // Log the manual purge activity
    await db.collection('audit_logs').add({
      action: 'manual_purge',
      timestamp: new Date(),
      deletedSessionCount: deleteCount,
      initiator: request.auth?.uid || 'unknown',
      reason: 'admin_manual_purge'
    });
    
    return {
      success: true,
      message: `Successfully purged ${deleteCount} sessions`,
      deletedCount: deleteCount
    };
    
  } catch (error) {
    console.error('Manual purge failed:', error);
    throw new HttpsError('internal', 'Manual purge failed');
  }
});

/**
 * Health check function to monitor purge system
 * Runs every hour
 */
exports.purgeHealthCheck = onSchedule('0 * * * *', async (event) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check for sessions older than 2 days
    const cutoffDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const oldSessionsQuery = db.collection('daily_sessions')
      .where('date', '<', cutoffDate);
    
    const oldSessions = await oldSessionsQuery.get();
    
    if (!oldSessions.empty) {
      console.warn(`Health check warning: Found ${oldSessions.size} sessions older than 2 days`);
      
      // Log health check warning
      await db.collection('audit_logs').add({
        action: 'health_check_warning',
        timestamp: new Date(),
        oldSessionCount: oldSessions.size,
        oldSessions: oldSessions.docs.map(doc => ({ id: doc.id, date: doc.data().date })),
        reason: 'sessions_not_purged_properly'
      });
      
      return {
        healthy: false,
        warning: `Found ${oldSessions.size} sessions older than 2 days`,
        oldSessionCount: oldSessions.size
      };
    }
    
    // Get total session count
    const allSessions = await db.collection('daily_sessions').get();
    
    console.log(`Health check passed: ${allSessions.size} total sessions, none older than 2 days`);
    
    return {
      healthy: true,
      totalSessions: allSessions.size,
      message: 'Purge system healthy'
    };
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    await db.collection('audit_logs').add({
      action: 'health_check_failed',
      timestamp: new Date(),
      error: error.message
    });
    
    return {
      healthy: false,
      error: error.message
    };
  }
}); 