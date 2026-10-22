import { useCallback, useState } from 'react';
import { useBooking } from './useBooking';
import { marketRpc } from '@/services/bookingService';
import { normalizePhone } from '@/services/registrationService';
import { PROVINCES } from '@/constants/config';
export function useProfileSave() {
  const booking = useBooking();
  const [busy, setBusy] = useState(false);
  const saveProfile = useCallback(async (name: string, profile: Record<string,string>) => {
    setBusy(true);
    try {
      if (!booking.authenticated) throw new Error('يلزم تسجيل الدخول');
      const phone = normalizePhone(profile.phone ?? '');
      if (!name.trim() || name.trim().length > 120) throw new Error('أدخل اسماً صحيحاً');
      if (!PROVINCES.includes(profile.province) || !/^\+9647\d{9}$/.test(phone)) throw new Error('اختر المحافظة وأدخل رقم هاتف عراقي صحيحاً');
      await marketRpc<void>('bazgo_update_account', { p_name: name.trim(), p_profile: { ...profile, phone } });
      await booking.reload();
    }
    finally {setBusy(false);}
  }, [booking.authenticated, booking.reload]);
  return { authenticated:booking.authenticated,busy,saveProfile };
}
