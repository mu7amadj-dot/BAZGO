import { CARGO_TYPES, PROVINCES, VEHICLES } from '@/constants/config';
import { randomUUID } from 'expo-crypto';
import { normalizeDigits } from './registrationService';
import type { FreightRequest } from './types';

export interface LoadForm {
  pickupProvince: string; deliveryProvince: string; pickupAddress: string; deliveryAddress: string;
  weight: string; cargoType: string; description: string; cargoImage: string; vehicle: string;
  price: string; notes: string; pickupDate: string; distance: string;
}
export const emptyLoadForm: LoadForm = { pickupProvince: '', deliveryProvince: '', pickupAddress: '', deliveryAddress: '',
  weight: '', cargoType: '', description: '', cargoImage: '', vehicle: '', price: '', notes: '', pickupDate: '', distance: '' };
export function buildLoadRequest(form: LoadForm, merchantName: string): FreightRequest {
  if (!PROVINCES.includes(form.pickupProvince) || !PROVINCES.includes(form.deliveryProvince)) throw new Error('اختر محافظتي التحميل والتفريغ');
  if (!CARGO_TYPES.includes(form.cargoType) || !VEHICLES.some((vehicle) => vehicle.id === form.vehicle)) throw new Error('اختر نوع الحمولة والمركبة');
  const weight = Number(normalizeDigits(form.weight));
  const price = Number(normalizeDigits(form.price));
  const distance = form.distance.trim() ? Number(normalizeDigits(form.distance)) : 0;
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('أدخل وزناً أكبر من صفر');
  if (!Number.isSafeInteger(price) || price <= 0 || price > 99999999999999) throw new Error('أدخل سعراً صحيحاً أكبر من صفر بالدينار العراقي');
  if (!Number.isFinite(distance) || distance < 0) throw new Error('أدخل مسافة صحيحة أو اتركها فارغة');
  const dateText = normalizeDigits(form.pickupDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error('أدخل تاريخ التحميل بصيغة YYYY-MM-DD');
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('تاريخ التحميل غير صالح');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime()) throw new Error('اختر تاريخ تحميل اليوم أو بعده');
  return { id: randomUUID(), merchantName, merchantRating: 0, pickupProvince: form.pickupProvince, pickupArea: '',
    pickupAddress: form.pickupAddress.trim(), deliveryProvince: form.deliveryProvince, deliveryArea: '', deliveryAddress: form.deliveryAddress.trim(),
    weightTons: weight, cargoType: form.cargoType, cargoDescription: form.description.trim(), cargoImage: form.cargoImage,
    vehicleType: form.vehicle, priceIQD: price, pickupDate: date.toISOString(), notes: form.notes.trim(),
    status: 'available', distanceKm: distance, createdAt: Date.now() };
}
