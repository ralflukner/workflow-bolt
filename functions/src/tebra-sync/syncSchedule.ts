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
  const today = dateOverride ??
    new Date(now().toLocaleString('en-US', { timeZone: timezone }))
      .toISOString().split('T')[0];

  logger.info('Syncing appointments for', today);

  const appointments = await tebra.getAppointments(today, today);
  logger.info('Fetched appointments', appointments.length);

  if (!appointments.length) {
    logger.warn('No appointments found', { date: today });
    return 0;
  }

  const providers = await tebra.getProviders();
  const providerMap = new Map(providers.map(p => [p.ProviderId, p]));

  const patients: Array<ReturnType<typeof toDashboardPatient>> = [];

  for (const appt of appointments) {
    try {
      const patientId = appt.PatientId;
      if (!patientId) throw new Error('Missing PatientId');

      const patient = await tebra.getPatientById(patientId);
      if (!patient) throw new Error(`Patient ${patientId} not found`);

      patients.push(
        toDashboardPatient(appt, patient, providerMap.get(appt.ProviderId)),
      );
    } catch (err) {
      logger.error('Failed to process appointment', { appt, err });
    }
  }

  await repo.save(today, patients, uid);
  logger.info(`Saved ${patients.length} patients for ${today}`);

  return patients.length;
}; 