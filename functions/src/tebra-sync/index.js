const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { consoleLogger } = require('../services/logger');
const { firestoreDailySessionRepo } = require('../services/firestoreDailySession');
const { tebraProxyClient } = require('../tebra-proxy-client');
const { syncSchedule } = require('./syncSchedule');

const tebraSyncTodaysSchedule = onCall({ cors: true }, async (req) => {
  try {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Authentication required');

    // Date validation
    const date = req.data?.date;
    if (date !== undefined) {
      // Only allow YYYY-MM-DD (ISO-8601 date, no time)
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (typeof date !== 'string' || !isoDateRegex.test(date)) {
        throw new HttpsError(
          'invalid-argument',
          "If provided, 'date' must be a string in YYYY-MM-DD (ISO-8601) format, e.g. '2024-06-12'."
        );
      }
    }

    const count = await syncSchedule(
      {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: consoleLogger,
        now: () => new Date(),
        timezone: 'America/Chicago',
      },
      date,
      req.auth.uid,
    );
    return { success: true, imported: count, message: `Successfully synced ${count} appointments` };
  } catch (err) {
    consoleLogger.error('❌ Sync failed:', err.message);
    // If it's already an HttpsError, rethrow; otherwise, wrap as internal
    if (err.code) throw err;
    throw new HttpsError('internal', err.message);
  }
});

module.exports = { tebraSyncTodaysSchedule };