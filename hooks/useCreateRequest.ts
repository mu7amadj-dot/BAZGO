import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { useApp } from './useApp';
import { PROVINCES, VEHICLES, CARGO_TYPES } from '@/constants/config';
import { buildLoadRequest, emptyLoadForm, type LoadForm } from '@/services/loadFormService';
import { normalizeDigits } from '@/services/registrationService';

export function useCreateRequest() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { merchantName, addRequest, role } = useApp();
  const [form, setForm] = useState<LoadForm>({ ...emptyLoadForm });
  const [submitting, setSubmitting] = useState(false);
  const setField = useCallback((field: keyof LoadForm, value: string) => setForm((current) => ({ ...current, [field]: value })), []);
  const provinceItems = useMemo(() => PROVINCES.map((province) => ({ id: province, label: province, icon: 'map-marker-outline' })), []);
  const vehicleItems = useMemo(() => VEHICLES.map((vehicle) => ({ id: vehicle.id, label: vehicle.label, icon: vehicle.icon, meta: `حتى ${vehicle.capacity} طن` })), []);
  const cargoItems = useMemo(() => CARGO_TYPES.map((cargo) => ({ id: cargo, label: cargo, icon: 'package-variant' })), []);
  const priceNum = Number(normalizeDigits(form.price));
  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (role !== 'merchant') throw new Error('نشر الحمولات متاح لحساب التاجر فقط');
      const request = buildLoadRequest(form, merchantName);
      await addRequest(request);
      router.replace('/(tabs)');
    } catch (error) { showAlert('تعذر نشر الحمولة', error instanceof Error ? error.message : 'حاول مجدداً.'); }
    finally { setSubmitting(false); }
  }, [submitting, role, form, merchantName, addRequest, router, showAlert]);
  return { form, setField, submitting, submit, priceNum, provinceItems, vehicleItems, cargoItems };
}
