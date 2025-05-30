import { dailySessionService } from './dailySessionService';

/**
 * Scheduled purge function for HIPAA compliance
 * This function should be called daily by a Cloud Function or cron job
 */
export async function scheduledPurge(): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
  error?: string;
}> {
  try {
    console.log('Starting scheduled purge for HIPAA compliance...');
    
    // Get session stats before purge
    const statsBefore = await dailySessionService.getSessionStats();
    console.log(`Sessions before purge: ${statsBefore.totalSessions}`);
    
    // Perform the purge
    await dailySessionService.purgeOldSessions();
    
    // Get session stats after purge
    const statsAfter = await dailySessionService.getSessionStats();
    const deletedCount = statsBefore.totalSessions - statsAfter.totalSessions;
    
    console.log(`Scheduled purge completed. Deleted ${deletedCount} old sessions.`);
    
    return {
      success: true,
      message: `Successfully purged ${deletedCount} old sessions`,
      deletedCount
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during purge';
    console.error('Scheduled purge failed:', errorMessage);
    
    return {
      success: false,
      message: 'Scheduled purge failed',
      error: errorMessage
    };
  }
}

/**
 * Cloud Function for scheduled purging
 * Example usage in Firebase Functions:
 * 
 * ```typescript
 * import { onSchedule } from 'firebase-functions/v2/scheduler';
 * import { scheduledPurge } from './scheduledPurge';
 * 
 * export const dailyDataPurge = onSchedule('0 2 * * *', async (event) => {
 *   const result = await scheduledPurge();
 *   console.log('Purge result:', result);
 *   return result;
 * });
 * ```
 */

/**
 * Manual purge for testing/admin purposes
 */
export async function manualPurge(confirmationKey: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  // Require confirmation key for safety
  if (confirmationKey !== process.env.PURGE_CONFIRM_KEY) {
    return {
      success: false,
      message: 'Invalid confirmation key',
      error: 'Confirmation key required for manual purge'
    };
  }
  
  try {
    console.log('Starting manual purge of all data...');
    
    await dailySessionService.purgeAllSessions();
    
    console.log('Manual purge completed successfully');
    
    return {
      success: true,
      message: 'All session data has been purged'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during manual purge';
    console.error('Manual purge failed:', errorMessage);
    
    return {
      success: false,
      message: 'Manual purge failed',
      error: errorMessage
    };
  }
}

/**
 * Health check for the purge system
 */
export async function purgeHealthCheck(): Promise<{
  healthy: boolean;
  sessionCount: number;
  oldestSession?: string;
  newestSession?: string;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    const stats = await dailySessionService.getSessionStats();
    const sessionDates = await dailySessionService.getSessionDates();
    
    // Check if there are too many sessions (more than 2 days worth)
    if (stats.totalSessions > 2) {
      issues.push(`Too many sessions: ${stats.totalSessions} (expected <= 2)`);
    }
    
    // Check if there are very old sessions
    if (sessionDates.length > 0) {
      const oldestDate = new Date(sessionDates[sessionDates.length - 1]);
      const daysDiff = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 1) {
        issues.push(`Oldest session is ${daysDiff} days old (should be <= 1 day)`);
      }
    }
    
    return {
      healthy: issues.length === 0,
      sessionCount: stats.totalSessions,
      oldestSession: sessionDates.length > 0 ? sessionDates[sessionDates.length - 1] : undefined,
      newestSession: sessionDates.length > 0 ? sessionDates[0] : undefined,
      issues
    };
    
  } catch (error) {
    return {
      healthy: false,
      sessionCount: 0,
      issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
} 