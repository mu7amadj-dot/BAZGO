import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { useBooking } from './useBooking';
import { useApp } from './useApp';
export function useLoadBooking(loadId: string) {
  const booking = useBooking();
  const app = useApp();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [busy, setBusy] = useState(false);
  const load = app.requests.find((r) => r.id === loadId);
  const negotiation = booking.negotiations.find((n) => n.load_id === loadId && !['cancelled','expired'].includes(n.status));
  const isDriver = booking.account?.role === 'driver';
  const available = load?.serverBacked && load.status === 'available';
  const accept = useCallback(async () => {
    if (busy) return;
    if (!booking.authenticated) { router.push('/login'); return; }
    setBusy(true);
    try {
      const id = await booking.reserve(loadId);
      router.push(`/chat/${id}`);
    } catch (error) {
      await booking.reload(); showAlert('تعذر حجز الحمولة', error instanceof Error ? error.message : 'قد تكون الحمولة محجوزة لسائق آخر.');
    } finally { setBusy(false); }
  }, [busy, booking.reserve, booking.authenticated, booking.reload, loadId, router, showAlert]);
  const openChat = useCallback(() => { if (negotiation) router.push(`/chat/${negotiation.id}`); }, [negotiation, router]);
  const cancelLoad = useCallback(() => {
    showAlert('إلغاء الحمولة؟','ستصبح الحمولة ملغاة وغير قابلة للحجز.',[
      { text:'رجوع',style:'cancel' }, { text:'إلغاء الحمولة',style:'destructive',onPress:async () => {
        setBusy(true); try { await booking.cancelLoad(loadId); } catch(error) { showAlert('تعذر الإلغاء',error instanceof Error ? error.message : 'حاول مجدداً.'); } finally { setBusy(false); }
      } },
    ]);
  }, [booking.cancelLoad, loadId, showAlert]);
  return { ...booking, load, negotiation, isDriver, available, busy, accept, openChat, cancelLoad };
}
