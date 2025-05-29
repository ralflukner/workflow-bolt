const { onSchedule } = require('firebase-functions/v2/scheduler');
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
    
    // Use batch for efficient deletion
    const batch = db.batch();
    let deleteCount = 0;
    
    querySnapshot.forEach((doc) => {
      console.log(`Scheduling deletion of session: ${doc.id}`);
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    // Commit the batch deletion
    await batch.commit();
    
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
      error: error.message,
      reason: 'HIPAA_compliance_daily_purge_error'
    });
    
    throw error; // Re-throw to trigger Cloud Function retry
  }
});

/**
 * Manual purge function for admin use
 * Requires authentication and admin role
 */
exports.manualDataPurge = onSchedule('* * * * *', async (event) => {
  // This is a placeholder - in production, this would be an HTTP function
  // with proper authentication and authorization
  console.log('Manual purge function placeholder');
  return { message: 'Use HTTP function for manual purge' };
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