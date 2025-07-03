const pLimit = require('p-limit');
const { isCheckedIn } = require('./status-map');

const tebraStatusToInternal = (raw) => {
  const key = raw.trim().toLowerCase();
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
    default:             return 'scheduled';
  }
};

const toDashboardPatient = (appointment, patient, provider) => {
  const status = tebraStatusToInternal(appointment.Status || appointment.status || '');
  const appointmentTime = 
    appointment.StartTime ||
    appointment.AppointmentTime ||
    `${appointment.Date || appointment.AppointmentDate || ''} ${appointment.Time || ''}`.trim();
  
  // Determine if patient should be marked as checked in
  // Any status beyond scheduled indicates the patient has arrived
  const checkedInStatus = isCheckedIn(status);
  
  return {
    id: patient.PatientId || patient.Id || '',
    name: `${patient.FirstName} ${patient.LastName}`.trim(),
    dob: patient.DateOfBirth || patient.DOB || '',
    appointmentTime: appointmentTime,
    appointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
    provider: provider
      ? `${provider.Title || provider.Degree || 'Dr.'} ${provider.FirstName} ${provider.LastName}`
      : 'Unknown Provider',
    status: status,
    phone: patient.Phone || patient.PhoneNumber,
    email: patient.Email || patient.EmailAddress,
    // Add checkInTime for patients who have arrived
    checkInTime: checkedInStatus ? appointmentTime : undefined,
  };
};

const syncSchedule = async (
  { tebra, repo, logger, now, timezone },
  dateOverride,
  uid = 'system',
) => {
  // Support date ranges or single dates
  let fromDate, toDate;
  if (dateOverride) {
    if (typeof dateOverride === 'object' && dateOverride.fromDate && dateOverride.toDate) {
      fromDate = dateOverride.fromDate;
      toDate = dateOverride.toDate;
    } else if (typeof dateOverride === 'string') {
      fromDate = toDate = dateOverride;
    }
  } else {
    // Default to today
    const currentTime = now();
    const localTimeString = currentTime.toLocaleString('en-US', { timeZone: timezone });
    const today = new Date(localTimeString).toISOString().split('T')[0];
    
    logger.info('📅 Date calculation debug:', {
      currentTime: currentTime.toISOString(),
      timezone: timezone,
      localTimeString: localTimeString,
      calculatedToday: today
    });
    
    fromDate = toDate = today;
  }

  logger.info('🔍 Syncing appointments for date range:', { 
    fromDate, 
    toDate,
    dateOverride: dateOverride || 'none',
    timezone: timezone
  });

  // Add detailed debugging for the Tebra API call
  logger.info('📞 Calling tebra.getAppointments with dates:', { fromDate, toDate });
  
  let appointmentsArray;
  try {
    const appointments = await tebra.getAppointments(fromDate, toDate);
    
    // Log the raw response details
    logger.info('📋 Raw appointments response type:', typeof appointments);
    logger.info('📋 Raw appointments response:', JSON.stringify(appointments, null, 2));
    logger.info('📊 Array check - isArray:', Array.isArray(appointments));
    logger.info('📊 Length/count:', appointments?.length || 'no length property');

    // Handle different response structures
    appointmentsArray = appointments;
    if (!Array.isArray(appointments)) {
      logger.error('❌ Expected array but got:', typeof appointments);
      logger.error('❌ Response content:', appointments);
      
      // Try to extract appointments from different possible structures
      if (appointments && appointments.appointments) {
        appointmentsArray = appointments.appointments;
        logger.info('🔧 Found appointments in .appointments property');
      } else if (appointments && appointments.data) {
        appointmentsArray = appointments.data;
        logger.info('🔧 Found appointments in .data property');
      } else {
        logger.error('❌ Cannot find appointments array in response');
        return 0;
      }
    }
    
    if (!Array.isArray(appointmentsArray)) {
      logger.error('❌ Still not an array after extraction:', typeof appointmentsArray);
      return 0;
    }

    if (!appointmentsArray.length) {
      logger.warn('⚠️ No appointments found in array', { 
        fromDate, 
        toDate,
        arrayLength: appointmentsArray.length,
        firstFewItems: appointmentsArray.slice(0, 3)
      });
      return 0;
    }

    logger.info('✅ Found appointments to process:', appointmentsArray.length);
  } catch (error) {
    logger.error('❌ Failed to get appointments:', error);
    logger.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return 0;
  }

  const providers = await tebra.getProviders();
  const providerMap = new Map(providers.map(p => [
    p.ProviderId || p.ID || p.Id, p
  ]));
  logger.info('👥 Loaded providers:', providers.length);

  // Use bounded concurrency to avoid overwhelming the API
  const limit = pLimit(10); // limit concurrency to 10

  const patientPromises = appointmentsArray.map(appt =>
    limit(async () => {
      try {
        const patientId = appt.PatientId || appt.patientId;
        if (!patientId) {
          logger.warn('⚠️ Skipping appointment with missing PatientId', appt);
          return null;
        }

        const patient = await tebra.getPatientById(patientId);
        if (!patient) {
          logger.warn(`⚠️ Patient ${patientId} not found`);
          return null;
        }

        const providerId = appt.ProviderId || appt.providerId;
        return toDashboardPatient(appt, patient, providerMap.get(providerId));
      } catch (err) {
        logger.error('❌ Failed to process appointment', { appt, err: err.message });
        return null; // skip this one
      }
    })
  );

  logger.info('🚀 Processing appointments with bounded concurrency (max 10)');
  const patientResults = await Promise.all(patientPromises);
  const patients = patientResults.filter(Boolean);

  await repo.save(fromDate, patients, uid);
  logger.info(`✅ Saved ${patients.length} patients for ${fromDate} to ${toDate}`);

  return patients.length;
};

module.exports = { syncSchedule };