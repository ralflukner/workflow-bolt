const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { consoleLogger } = require('../services/logger');
const { firestoreDailySessionRepo } = require('../services/firestoreDailySession');
const { tebraProxyClient } = require('../tebra-proxy-client');
const { syncSchedule } = require('./syncSchedule');

const tebraSyncTodaysSchedule = onCall({ cors: true }, async (req) => {
  try {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Authentication required');

    // Date validation - support both single date and date range
    const { date, fromDate, toDate } = req.data || {};
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    let dateParam;
    if (fromDate && toDate) {
      // Date range mode
      if (!isoDateRegex.test(fromDate) || !isoDateRegex.test(toDate)) {
        throw new HttpsError(
          'invalid-argument',
          "Both 'fromDate' and 'toDate' must be strings in YYYY-MM-DD format."
        );
      }
      dateParam = { fromDate, toDate };
    } else if (date) {
      // Single date mode
      if (!isoDateRegex.test(date)) {
        throw new HttpsError(
          'invalid-argument',
          "'date' must be a string in YYYY-MM-DD format."
        );
      }
      dateParam = date;
    }

    consoleLogger.info('📅 tebraSyncTodaysSchedule called with:', {
      date,
      fromDate,
      toDate,
      dateParam,
      currentServerTime: new Date().toISOString(),
      timezone: 'America/Chicago'
    });

    const count = await syncSchedule(
      {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: consoleLogger,
        now: () => new Date(),
        timezone: 'America/Chicago',
      },
      dateParam,
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