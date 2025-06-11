const tebraStatusToInternal = (raw) => {
  const key = raw.trim().toLowerCase();
  switch (key) {
    case 'confirmed':   return 'Confirmed';
    case 'cancelled':   return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'no show':     return 'No Show';
    default:            return 'Scheduled';
  }
};

const toDashboardPatient = (appointment, patient, provider) => ({
  id: patient.PatientId || patient.Id || '',
  name: `${patient.FirstName} ${patient.LastName}`.trim(),
  dob: patient.DateOfBirth || patient.DOB || '',
  appointmentTime:
    appointment.StartTime ||
    appointment.AppointmentTime ||
    `${appointment.Date || appointment.AppointmentDate || ''} ${appointment.Time || ''}`.trim(),
  appointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
  provider: provider
    ? `${provider.Title || provider.Degree || 'Dr.'} ${provider.FirstName} ${provider.LastName}`
    : 'Unknown Provider',
  status: tebraStatusToInternal(appointment.Status || appointment.status || ''),
  phone: patient.Phone || patient.PhoneNumber,
  email: patient.Email || patient.EmailAddress,
});

const syncSchedule = async (
  { tebra, repo, logger, now, timezone },
  dateOverride,
  uid = 'system',
) => {
  const today = dateOverride ||
    new Date(now().toLocaleString('en-US', { timeZone: timezone }))
      .toISOString().split('T')[0];

  logger.info('🔍 Syncing appointments for', today);

  const appointments = await tebra.getAppointments(today, today);
  logger.info('📋 Fetched appointments:', appointments.length);

  if (!appointments.length) {
    logger.warn('⚠️ No appointments found', { date: today });
    return 0;
  }

  const providers = await tebra.getProviders();
  const providerMap = new Map(providers.map(p => [
    p.ProviderId || p.ID || p.Id, p
  ]));
  logger.info('👥 Loaded providers:', providers.length);

  // Use bounded concurrency to avoid overwhelming the API
  const pLimit = require('p-limit');
  const limit = pLimit(10); // limit concurrency to 10

  const patientPromises = appointments.map(appt =>
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

  await repo.save(today, patients, uid);
  logger.info(`✅ Saved ${patients.length} patients for ${today}`);

  return patients.length;
};

module.exports = { syncSchedule };