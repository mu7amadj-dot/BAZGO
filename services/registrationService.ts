import { PROVINCES, VEHICLES } from '@/constants/config';
import type { UserRole } from './types';

export interface RegistrationForm {
  name: string; phone: string; province: string; companyName: string; location: string;
  fatherName: string; grandfatherName: string; vehicleType: string; maxCapacity: string;
  driverPhoto: string; licensePhoto: string; vehiclePhoto: string;
}
export const emptyRegistrationForm: RegistrationForm = {
  name: '', phone: '', province: '', companyName: '', location: '', fatherName: '', grandfatherName: '',
  vehicleType: '', maxCapacity: '', driverPhoto: '', licensePhoto: '', vehiclePhoto: '',
};
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}
export function normalizePhone(value: string): string {
  const phone = normalizeDigits(value).trim().replace(/[\s()-]/g, '');
  if (/^07\d{9}$/.test(phone)) return `+964${phone.slice(1)}`;
  if (/^9647\d{9}$/.test(phone)) return `+${phone}`;
  return phone;
}
export function prepareRegistration(role: UserRole, form: RegistrationForm): { name: string; profile: Record<string, string> } {
  const name = form.name.trim();
  if (!name || name.length > 120) throw new Error('أدخل اسماً صحيحاً لا يتجاوز 120 حرفاً');
  const phone = normalizePhone(form.phone);
  if (!/^\+9647\d{9}$/.test(phone)) throw new Error('أدخل رقم هاتف عراقي صحيحاً، مثال: 07XXXXXXXXX');
  if (!PROVINCES.includes(form.province)) throw new Error('اختر المحافظة');
  const common = { phone, province: form.province };
  if (role === 'merchant') {
    if (!form.companyName.trim() || !form.location.trim()) throw new Error('أكمل اسم الشركة والموقع');
    return { name, profile: { ...common, companyName: form.companyName.trim(), location: form.location.trim() } };
  }
  if (!form.fatherName.trim() || !form.grandfatherName.trim()) throw new Error('أكمل اسم الأب والجد');
  if (!VEHICLES.some((vehicle) => vehicle.id === form.vehicleType)) throw new Error('اختر نوع المركبة');
  const capacity = Number(normalizeDigits(form.maxCapacity));
  if (!Number.isFinite(capacity) || capacity <= 0 || capacity > 1000) throw new Error('أدخل أقصى حمولة صحيحة بالطن');
  return { name, profile: { ...common, fatherName: form.fatherName.trim(), grandfatherName: form.grandfatherName.trim(),
    vehicleType: form.vehicleType, maxCapacity: String(capacity), driverPhoto: form.driverPhoto,
    licensePhoto: form.licensePhoto, vehiclePhoto: form.vehiclePhoto } };
}
