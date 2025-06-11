import { onCall } from 'firebase-functions/v2/https';
import { consoleLogger } from '../services/logger';
import { firestoreDailySessionRepo } from '../services/firestoreDailySession';
import { tebraProxyClient } from '../tebra-proxy-client';
import { syncSchedule } from './syncSchedule';

exports.tebraSyncTodaysSchedule = onCall({ cors: true }, async (req) => {
  try {
    if (!req.auth) throw new Error('Authentication required');
    const count = await syncSchedule(
      {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: consoleLogger,
        now: () => new Date(),
        timezone: 'America/Chicago',
      },
      req.data?.date,
      req.auth.uid,
    );
    return { success: true, imported: count };
  } catch (err) {
    consoleLogger.error('Sync failed', err);
    return { success: false, message: (err as Error).message };
  }
}); 