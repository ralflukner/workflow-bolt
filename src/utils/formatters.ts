/**
 * Format a date string to a time string in the format "h:mm AM/PM"
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago'
  });
};

/**
 * Format a date string to a date string in the format "MM/DD/YYYY"
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago'
  });
};

/**
 * Format a patient's DOB from ISO format to MM/DD/YYYY format
 * @param dob - DOB in ISO format (YYYY-MM-DD)
 * @returns Formatted DOB string
 */
export const formatDOB = (dob: string): string => {
  // Handle the case where dob might be a full ISO string or just a date
  const dateOnly = dob.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${month}/${day}/${year}`;
};