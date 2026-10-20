// Powered by OnSpace.AI
import { VEHICLES } from '@/constants/config';
import { DriverProfile, MerchantProfile, UserRole } from '@/services/types';

export interface RegistrationForm {
  name: string;
  phone: string;
  province: string;
  companyName: string;
  location: string;
  fatherName: string;
  grandfatherName: string;
  vehicleType: string;
  maxCapacity: string;
  driverPhoto: string;
  licensePhoto: string;
  vehiclePhoto: string;
}
export const emptyRegistrationForm: RegistrationForm = {
  name: '', phone: '', province: '', companyName: '', location: '',
  fatherName: '', grandfatherName: '', vehicleType: '', maxCapacity: '',
  driverPhoto: '', licensePhoto: '', vehiclePhoto: '',
};

export function normalizePhone(value: string): string {
  return value.trim().replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  }).replace(/[\s()-]/g, '') || '07701234567';
}

// The existing local demonstration remains local; no SMS or account API is used.
export function prepareDemoRegistration(role: UserRole, form: RegistrationForm): {
  name: string; phone: string; merchantProfile?: MerchantProfile; driverProfile?: DriverProfile;
} {
  const phone = normalizePhone(form.phone);
  if (role === 'merchant') {
    return {
      name: form.name.trim() || 'أبو محمد', phone,
      merchantProfile: {
        companyName: form.companyName.trim() || 'شركة أبو محمد التجارية',
        location: form.location.trim() || 'بغداد - المنصور', province: form.province || 'بغداد', phone,
      },
    };
  }
  const vehicleType = form.vehicleType || 'canter';
  const capacity = VEHICLES.find((vehicle) => vehicle.id === vehicleType)?.capacity ?? 7;
  return {
    name: [form.name.trim() || 'علي', form.fatherName.trim(), form.grandfatherName.trim()].filter(Boolean).join(' '),
    phone,
    driverProfile: {
      fatherName: form.fatherName.trim(), grandfatherName: form.grandfatherName.trim(),
      province: form.province || 'بغداد', vehicleType, maxCapacity: form.maxCapacity.trim() || String(capacity),
      driverPhoto: form.driverPhoto, licensePhoto: form.licensePhoto, vehiclePhoto: form.vehiclePhoto, phone,
    },
  };
}
