/**
 * Maps Tebra appointment status to internal status format
 * @param raw - Raw status string from Tebra
 * @returns Mapped internal status
 * @throws Error if status is unrecognized
 */
export const tebraStatusToInternal = (raw: string): 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'No Show' => {
  const key = raw.trim().toLowerCase();
  
  // Log the raw status for debugging
  console.log('Mapping Tebra status:', { raw, normalized: key });
  
  switch (key) {
    case 'scheduled':   return 'Scheduled';
    case 'confirmed':   return 'Confirmed';
    case 'cancelled':   return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'no show':     return 'No Show';
    default: {
      const error = new Error(`Unrecognized appointment status: "${raw}"`);
      console.error('Status mapping error:', {
        raw,
        normalized: key,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}; 