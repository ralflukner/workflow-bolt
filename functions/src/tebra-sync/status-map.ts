export const tebraStatusToInternal = (raw: string): 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'No Show' => {
  const key = raw.trim().toLowerCase();
  switch (key) {
    case 'confirmed':   return 'Confirmed';
    case 'cancelled':   return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'no show':     return 'No Show';
    default:            return 'Scheduled';
  }
}; 