export const debugDateFormats = () => {
  const now = new Date();
  
  console.log('=== Date Format Debug ===');
  console.log('Current Date:', now);
  console.log('ISO String:', now.toISOString());
  console.log('ISO Date (YYYY-MM-DD):', now.toISOString().split('T')[0]);
  console.log('Local Date String:', now.toLocaleDateString());
  console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Timezone Offset:', now.getTimezoneOffset());
  
  // Test midnight edge case
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  console.log('Midnight Local:', midnight);
  console.log('Midnight ISO:', midnight.toISOString());
  console.log('Midnight Date Key:', midnight.toISOString().split('T')[0]);
  
  // Test end of day
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  console.log('End of Day Local:', endOfDay);
  console.log('End of Day ISO:', endOfDay.toISOString());
  console.log('End of Day Date Key:', endOfDay.toISOString().split('T')[0]);
  
  const toDateKey = (d: Date) =>
    d.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });

  return {
    toDateKey,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: now.getTimezoneOffset()
  };
};