import { TebraClient } from '../types/tebra';
import { Logger } from '../services/logger';
import { DailySessionRepo } from '../services/firestoreDailySession';
import { toDashboardPatient } from './mappers';

export interface SyncDeps {
  tebra: TebraClient;
  repo: DailySessionRepo;
  logger: Logger;
  now: () => Date;
  timezone: string; // "America/Chicago"
}

export const syncSchedule = async (
  { tebra, repo, logger, now, timezone }: SyncDeps,
  dateOverride?: string,
  uid = 'system',
): Promise<number> => {
  const today = dateOverride ?? (() => {
    // Get current date in the specified timezone properly
    const currentTime = now();
    const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: timezone }).format(currentTime);
    const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone: timezone }).format(currentTime);
    const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone: timezone }).format(currentTime);
    return `${year}-${month}-${day}`;
  })();

  logger.info('Syncing appointments for date:', today);
  logger.info('Timezone used:', timezone);

  const appointments = await tebra.getAppointments(today, today);
  logger.info('Fetched appointments', appointments.length);

  if (!appointments.length) {
    logger.warn('No appointments found', { date: today });
    return 0;
  }

  const providers = await tebra.getProviders();
  const providerMap = new Map(providers.map(p => [
    p.ProviderId || p.ID || p.Id, p
  ]));

  const patients: Array<ReturnType<typeof toDashboardPatient>> = [];

  for (const appt of appointments) {
    try {
      const patientId = appt.PatientId || appt.patientId;
      if (!patientId) throw new Error('Missing PatientId');

      const patient = await tebra.getPatientById(patientId);
      if (!patient) throw new Error(`Patient ${patientId} not found`);

      const providerId = appt.ProviderId || appt.providerId;
      patients.push(
        toDashboardPatient(appt, patient, providerMap.get(providerId)),
      );
    } catch (err) {
      logger.error('Failed to process appointment', { appt, err });
    }
  }

  await repo.save(today, patients, uid);
  logger.info(`Saved ${patients.length} patients for ${today}`);

  return patients.length;
}; 