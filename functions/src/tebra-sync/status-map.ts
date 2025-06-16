/**
 * Maps Tebra appointment status to internal status format
 * @param raw - Raw status string from Tebra
 * @returns Mapped internal status
 * @throws Error if status is unrecognized
 */
export const tebraStatusToInternal = (raw: string): 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'No Show' | 'Arrived' | 'Roomed' | 'Ready for MD' | 'With Doctor' | 'Seen by MD' | 'Checked Out' => {
  const key = raw.trim().toLowerCase();
  
  // Log the raw status for debugging
  console.log('Mapping Tebra status:', { raw, normalized: key });
  
  switch (key) {
    case 'scheduled':   return 'Scheduled';
    case 'confirmed':   return 'Confirmed';
    case 'cancelled':   return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'no show':     return 'No Show';
    case 'arrived':     return 'Arrived';
    case 'roomed':      return 'Roomed';
    case 'ready for md': return 'Ready for MD';
    case 'with doctor': return 'With Doctor';
    case 'seen by md':  return 'Seen by MD';
    case 'checked out': return 'Checked Out';
    default: {
      // Default to 'Scheduled' instead of throwing error for unknown statuses
      console.warn('Unknown appointment status, defaulting to Scheduled:', {
        raw,
        normalized: key,
        timestamp: new Date().toISOString()
      });
      return 'Scheduled';
    }
  }
}; 