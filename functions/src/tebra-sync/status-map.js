// Auto-generated from status-map.ts to satisfy Node.js require in syncSchedule.js
// Do not edit manual logic here; update status-map.ts instead.

/**
 * Map Tebra appointment status to internal status string.
 * @param {string} raw
 * @returns {string}
 */
function tebraStatusToInternal(raw) {
  const key = String(raw || '').trim().toLowerCase();
  switch (key) {
    case 'scheduled':    return 'scheduled';
    case 'confirmed':    return 'scheduled';
    case 'cancelled':    return 'cancelled';
    case 'rescheduled':  return 'rescheduled';
    case 'no show':      return 'no-show';
    case 'arrived':      return 'arrived';
    case 'roomed':       return 'appt-prep';
    case 'ready for md': return 'ready-for-md';
    case 'with doctor':  return 'with-doctor';
    case 'seen by md':   return 'seen-by-md';
    case 'checked out':  return 'completed';
    default:
      console.warn('[status-map] Unknown appointment status, defaulting to scheduled:', key);
      return 'scheduled';
  }
}

/**
 * Determine if internal status means the patient is checked in.
 * @param {string} status
 * @returns {boolean}
 */
function isCheckedIn(status) {
  return [
    'arrived',
    'appt-prep',
    'ready-for-md',
    'with-doctor',
    'seen-by-md',
    'completed'
  ].includes(status);
}

module.exports = { tebraStatusToInternal, isCheckedIn }; 