// Powered by OnSpace.AI
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { PROVINCES, VEHICLES } from '@/constants/config';
import { useApp } from '@/hooks/useApp';
import { UserRole } from '@/services/types';
import { emptyRegistrationForm, normalizePhone, prepareDemoRegistration, RegistrationForm } from '@/services/registrationService';

export function useRegistration() {
  const router = useRouter();
  const { merchantName, driverName, merchantProfile, driverProfile, setMerchantProfile, setDriverProfile } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [form, setForm] = useState<RegistrationForm>({ ...emptyRegistrationForm });
  const setField = useCallback((field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);
  const toggleMode = useCallback(() => setMode((current) => current === 'register' ? 'login' : 'register'), []);
  const provinceItems = useMemo(() => PROVINCES.map((province) => ({ id: province, label: province, icon: 'map-marker-outline' })), []);
  const vehicleItems = useMemo(() => VEHICLES.map((vehicle) => ({ id: vehicle.id, label: vehicle.label, icon: vehicle.icon, meta: `حتى ${vehicle.capacity} طن` })), []);
  const proceed = useCallback(() => {
    if (!selectedRole) return;
    if (mode === 'login') {
      const profile = selectedRole === 'merchant' ? merchantProfile : driverProfile;
      const name = selectedRole === 'merchant' ? merchantName : driverName;
      router.push({ pathname: '/otp', params: { role: selectedRole, name, phone: normalizePhone(form.phone || profile.phone) } });
      return;
    }
    const result = prepareDemoRegistration(selectedRole, form);
    if (result.merchantProfile) setMerchantProfile(result.merchantProfile);
    if (result.driverProfile) setDriverProfile(result.driverProfile);
    router.push({ pathname: '/otp', params: { role: selectedRole, name: result.name, phone: result.phone } });
  }, [selectedRole, mode, form, merchantProfile, driverProfile, merchantName, driverName, router, setMerchantProfile, setDriverProfile]);
  const close = useCallback(() => router.replace('/(tabs)'), [router]);
  return { selectedRole, setSelectedRole, mode, toggleMode, form, setField, provinceItems, vehicleItems, proceed, close };
}
