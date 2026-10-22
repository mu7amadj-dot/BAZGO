import type { UserRole } from './types';
import { prepareRegistration, type RegistrationForm } from './registrationService';
import { uploadJpegImage } from './imageStorageService';

export async function prepareServerProfile(role: UserRole, form: RegistrationForm, userId: string) {
  const account = prepareRegistration(role, form);
  if (role === 'driver') {
    for (const field of ['driverPhoto', 'licensePhoto', 'vehiclePhoto'] as const) {
      const uri = account.profile[field];
      if (uri) account.profile[field] = await uploadJpegImage('bazgo-profiles', uri, userId);
    }
  }
  return account;
}
