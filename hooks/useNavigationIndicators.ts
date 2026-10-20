// Powered by OnSpace.AI
import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';

export function useNavigationIndicators() {
  const { role, notifications } = useApp();
  const hasUnreadNotifications = useMemo(
    () => notifications.some((notification) => notification.role === role && !notification.read),
    [notifications, role],
  );
  return { hasUnreadNotifications };
}
