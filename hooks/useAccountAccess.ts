import { useCallback } from 'react';
import { useAuth, useAlert } from '@/template';
import { useBooking } from './useBooking';

export function useAccountAccess() {
  const auth = useAuth();
  const booking = useBooking();
  const { showAlert } = useAlert();
  const logout = useCallback(async () => {
    const result = await auth.logout();
    if (result.error) showAlert('تعذر تسجيل الخروج', result.error);
  }, [auth.logout, showAlert]);
  return { user: auth.user, account: booking.account, loading: auth.loading || booking.loading,
    error: booking.syncError, operationLoading: auth.operationLoading, retry: booking.reload, logout };
}
