import { useCallback, useState } from 'react';
import { useBooking } from './useBooking';
import { marketRpc } from '@/services/bookingService';
export function useProfileSave() {
  const booking = useBooking();
  const [busy, setBusy] = useState(false);
  const saveProfile = useCallback(async (name: string, profile: Record<string,string>) => {
    setBusy(true);
    try { await marketRpc<void>('bazgo_update_account',{ p_name:name,p_profile:profile }); await booking.reload(); }
    finally {setBusy(false);}
  }, [booking.reload]);
  return { authenticated:booking.authenticated,busy,saveProfile };
}
