// Powered by OnSpace.AI
// BAZGO static configuration: provinces, vehicles, cargo types

export const PROVINCES: string[] = [
  'بغداد',
  'نينوى',
  'الأنبار',
  'صلاح الدين',
  'كركوك',
  'ديالى',
  'واسط',
  'بابل',
  'كربلاء',
  'النجف',
  'القادسية',
  'المثنى',
  'ذي قار',
  'ميسان',
  'البصرة',
  'أربيل',
  'السليمانية',
  'دهوك',
  'حلبجة',
];

export interface VehicleType {
  id: string;
  label: string;
  capacity: number; // max tons (indicative)
  icon: string; // MaterialCommunityIcons name
}

export const VEHICLES: VehicleType[] = [
  { id: 'pickup', label: 'بيك أب', capacity: 1, icon: 'car-pickup' },
  { id: 'kia', label: 'كيا حمل', capacity: 3, icon: 'truck' },
  { id: 'canter', label: 'كانتر', capacity: 7, icon: 'truck' },
  { id: 'dump', label: 'قلاب', capacity: 18, icon: 'dump-truck' },
  { id: 'dump_trailer', label: 'قلاب مع مقطورة', capacity: 30, icon: 'truck-trailer' },
  { id: 'truck25', label: 'شاحنة 25 طن', capacity: 25, icon: 'truck' },
  { id: 'flatbed', label: 'شاحنة مسطحة', capacity: 20, icon: 'truck-flatbed' },
  { id: 'truck45', label: 'شاحنة 45 طن', capacity: 45, icon: 'truck-trailer' },
];

export const CARGO_TYPES: string[] = [
  'مواد غذائية',
  'مواد بناء',
  'حديد وصلب',
  'أسمنت',
  'أثاث',
  'معدات ثقيلة',
  'منتجات زراعية',
  'بضائع عامة',
];

export function vehicleLabel(id: string): string {
  return VEHICLES.find((v) => v.id === id)?.label ?? id;
}

export function vehicleIcon(id: string): string {
  return VEHICLES.find((v) => v.id === id)?.icon ?? 'truck';
}
