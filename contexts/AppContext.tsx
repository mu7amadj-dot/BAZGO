import React, { createContext, useCallback, useMemo, type ReactNode } from 'react';
import type { AppNotification, Conversation, DriverProfile, FreightRequest, MerchantProfile, Message, UserRole } from '@/services/types';
import { projectMarketData } from '@/services/appDataService';
import { useBooking } from '@/hooks/useBooking';
import { useAlert } from '@/template';

export interface AppContextType {
  role: UserRole; merchantName: string; driverName: string; merchantProfile: MerchantProfile; driverProfile: DriverProfile;
  requests: FreightRequest[]; notifications: AppNotification[]; conversations: Conversation[]; messages: Message[];
  addRequest: (request: FreightRequest) => Promise<void>;
  markNotificationsRead: (role: UserRole) => void;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
  const booking = useBooking();
  const { showAlert } = useAlert();
  const addRequest = useCallback(async (request: FreightRequest) => {
    if (!booking.authenticated || booking.account?.role !== 'merchant') throw new Error('يلزم حساب تاجر مسجّل لنشر الحمولة');
    await booking.createLoad(request);
  }, [booking.authenticated, booking.account?.role, booking.createLoad]);
  const markNotificationsRead = useCallback((_role: UserRole) => {
    if (!booking.authenticated) return;
    void booking.markRead().catch((error) => showAlert('تعذر تحديث الإشعارات', error instanceof Error ? error.message : 'حاول مجدداً.'));
  }, [booking.authenticated, booking.markRead, showAlert]);
  const value = useMemo<AppContextType>(() => ({
    ...projectMarketData(booking, booking.userId), addRequest, markNotificationsRead,
  }), [booking, addRequest, markNotificationsRead]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
