// Pure validation shared by the wizard and unit tests; no React or backend access.
export interface DriverRegistrationData {
  name: string; fatherName: string; grandfatherName: string;
  vehicleType: string; maxCapacity: string; province: string;
  driverPhoto: string; licensePhoto: string; vehiclePhoto: string;
}

export type DriverRegistrationStep = 1 | 2 | 3 | 4 | 5;
export const driverRegistrationSteps = [
  { number: 1, title: 'أسماء السائق', caption: 'أدخل اسمك واسم الأب واسم الجد.' },
  { number: 2, title: 'رقم الهاتف والتحقق', caption: 'تحقق من ملكية رقمك عبر رسالة OTP حقيقية.' },
  { number: 3, title: 'بيانات المركبة', caption: 'حدد المركبة والحمولة القصوى ومحافظة العمل.' },
  { number: 4, title: 'الصور والوثائق', caption: 'الصور الثلاث مطلوبة لإكمال إنشاء حساب السائق.' },
  { number: 5, title: 'حماية الحساب', caption: 'اختر الرقم السري؛ الدخول القادم سيكون دون OTP.' },
] as const;

export function validateDriverNames(form: DriverRegistrationData): void {
  for (const [value, label] of [[form.name, 'اسم السائق'], [form.fatherName, 'اسم الأب'], [form.grandfatherName, 'اسم الجد']]) {
    if (!value.trim() || value.trim().length > 120) throw new Error(`أدخل ${label} بشكل صحيح، بحد أقصى 120 حرفاً.`);
  }
}
export function validateDriverVehicle(form: DriverRegistrationData, vehicleIds: readonly string[], provinces: readonly string[]): void {
  if (!vehicleIds.includes(form.vehicleType)) throw new Error('اختر نوع المركبة.');
  const capacity = Number(form.maxCapacity.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) >= 0x06f0 ? digit.charCodeAt(0) - 0x06f0 : digit.charCodeAt(0) - 0x0660)));
  if (!Number.isFinite(capacity) || capacity <= 0 || capacity > 1000) throw new Error('أدخل أقصى حمولة صحيحة بالطن.');
  if (!provinces.includes(form.province)) throw new Error('اختر محافظة العمل.');
}
export function validateDriverPhotos(form: DriverRegistrationData): void {
  if (!form.driverPhoto.trim()) throw new Error('صورة السائق إلزامية.');
  if (!form.licensePhoto.trim()) throw new Error('صورة إجازة السوق إلزامية.');
  if (!form.vehiclePhoto.trim()) throw new Error('صورة الشاحنة إلزامية.');
}
