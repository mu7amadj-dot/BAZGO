import { useCallback, useState } from 'react';
import { useBooking } from './useBooking';
import { useVerifiedPhone } from './useVerifiedPhone';
import { fetchVerifiedPhone } from '@/services/phoneAuthService';
import { marketRpc } from '@/services/bookingService';
import { normalizePhone } from '@/services/registrationService';
import { PROVINCES } from '@/constants/config';
export function useProfileSave() {
  const booking = useBooking();
  const identity = useVerifiedPhone();
  const [busy, setBusy] = useState(false);
  const saveProfile = useCallback(async (name: string, profile: Record<string,string>) => {
    setBusy(true);
    try {
      if (!booking.authenticated) throw new Error('يلزم تسجيل الدخول');
      if (identity.loading || identity.error) throw new Error('أعد تحميل الرقم المتحقق منه قبل حفظ البيانات.');
      const verifiedPhone = await fetchVerifiedPhone();
      const phone = normalizePhone(profile.phone ?? '');
      if (verifiedPhone && phone !== verifiedPhone) throw new Error('لا يمكن تغيير الرقم المتحقق منه دون تحقق SMS جديد.');
      if (!name.trim() || name.trim().length > 120) throw new Error('أدخل اسماً صحيحاً');
      if (!PROVINCES.includes(profile.province) || !/^\+9647\d{9}$/.test(phone)) throw new Error('اختر المحافظة وأدخل رقم هاتف عراقي صحيحاً');
      await marketRpc<void>('bazgo_update_account', { p_name: name.trim(), p_profile: { ...profile, phone } });
      await booking.reload();
    }
    finally {setBusy(false);}
  }, [booking.authenticated, booking.reload, identity.loading, identity.error]);
  return { authenticated:booking.authenticated,busy,saveProfile, verifiedPhone:identity.phone, phoneLoading:identity.loading, phoneError:identity.error, retryPhone:identity.retry };
}
