import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { useBooking } from './useBooking';
import type { AppNotification } from '@/services/types';
export function useNotificationNavigation() {
  const router = useRouter();
  const booking = useBooking();
  const { showAlert } = useAlert();
  return useCallback((notification: AppNotification) => {
    const notice = booking.notifications.find((n) => n.id === notification.id);
    if (notice?.negotiation_id) router.push(`/chat/${notice.negotiation_id}`);
    else if (notice?.load_id) router.push(booking.account?.role === 'merchant' ? `/applicants/${notice.load_id}` : `/freight/${notice.load_id}`);
    else showAlert(notification.title, notification.body);
  }, [booking.notifications, booking.account?.role, router, showAlert]);
}
