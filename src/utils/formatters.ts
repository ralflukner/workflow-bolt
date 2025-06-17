/**
 * Format a date string to a time string in the format "h:mm AM/PM"
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  // Format time without timezone conversion to avoid time shift issues
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

/**
 * Format a date string to a date string in the format "MM/DD/YYYY"
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Format date without timezone conversion to avoid date shift issues
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
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