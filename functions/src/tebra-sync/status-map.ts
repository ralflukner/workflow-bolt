/**
 * Maps Tebra appointment status to internal status format
 * @param raw - Raw status string from Tebra
 * @returns Mapped internal status
 * @throws Error if status is unrecognized
 */
export const tebraStatusToInternal = (raw: string): 'scheduled' | 'cancelled' | 'rescheduled' | 'no-show' | 'arrived' | 'appt-prep' | 'ready-for-md' | 'with-doctor' | 'seen-by-md' | 'completed' => {
  const key = raw.trim().toLowerCase();
  
  // Log the raw status for debugging
  console.log('Mapping Tebra status:', { raw, normalized: key });
  
  switch (key) {
    case 'scheduled':    return 'scheduled';
    case 'confirmed':    return 'scheduled';
    case 'cancelled':    return 'cancelled';
    case 'rescheduled':  return 'rescheduled';
    case 'no show':
    case 'no-show':      return 'no-show';
    case 'arrived':      return 'arrived';
    case 'checked in':
    case 'checked-in':   return 'arrived';
    case 'roomed':       return 'appt-prep';
    case 'ready for md':
    case 'ready for m.d.': return 'ready-for-md';
    case 'with doctor':  return 'with-doctor';
    case 'seen by md':   return 'seen-by-md';
    case 'checked out':
    case 'checked-out':  return 'completed';
    default: {
      // Default to 'scheduled' instead of throwing error for unknown statuses
      console.warn('Unknown appointment status, defaulting to scheduled:', {
        raw,
        normalized: key,
        timestamp: new Date().toISOString()
      });
      return 'scheduled';
    }
  }
};

/**
 * Determines if a patient status indicates they have checked in
 * @param status - Internal status from tebraStatusToInternal
 * @returns True if patient has checked in (arrived or beyond)
 */
export const isCheckedIn = (status: ReturnType<typeof tebraStatusToInternal>): boolean => {
  const checkedInStatuses = ['arrived', 'appt-prep', 'ready-for-md', 'with-doctor', 'seen-by-md', 'completed'];
  return checkedInStatuses.includes(status);
}; 