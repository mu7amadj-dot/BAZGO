// Powered by OnSpace.AI
// BAZGO global state — Provider only

import React, { createContext, useCallback, useMemo, useState, ReactNode } from 'react';
import {
  Application,
  AppNotification,
  Conversation,
  Driver,
  DriverProfile,
  FreightRequest,
  MerchantProfile,
  Message,
  UserRole,
} from '@/services/types';
import {
  mockDrivers,
  mockRequests,
  mockNotifications,
  mockApplications,
} from '@/services/mockData';

export interface AppContextType {
  role: UserRole;
  merchantName: string;
  driverName: string;
  merchantProfile: MerchantProfile;
  driverProfile: DriverProfile;
  drivers: Driver[];
  requests: FreightRequest[];
  applications: Application[];
  notifications: AppNotification[];
  conversations: Conversation[];
  messages: Message[];

  setRole: (r: UserRole) => void;
  setNames: (merchant: string, driver: string) => void;
  setMerchantProfile: (p: MerchantProfile) => void;
  setDriverProfile: (p: DriverProfile) => void;

  addRequest: (r: FreightRequest) => void;
  updateRequestStatus: (id: string, status: FreightRequest['status']) => void;
  applyToFreight: (freightId: string, driverId: string) => void;
  acceptDriver: (freightId: string, driverId: string) => void;
  rejectDriver: (freightId: string, driverId: string) => void;

  ensureConversation: (freightId: string, driverId: string) => string;
  sendMessage: (conversationId: string, text: string, senderRole: UserRole) => void;

  markNotificationsRead: (role: UserRole) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}${idCounter++}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('merchant');
  const [merchantName, setMerchantName] = useState('التاجر');
  const [driverName, setDriverName] = useState('السائق');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>({ companyName: '', location: '', province: '', phone: '' });
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({
    fatherName: '', grandfatherName: '', province: '', vehicleType: '', maxCapacity: '',
    driverPhoto: '', licensePhoto: '', vehiclePhoto: '', phone: '',
  });
  const [drivers] = useState<Driver[]>(mockDrivers);
  const [requests, setRequests] = useState<FreightRequest[]>(mockRequests);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const setNames = useCallback((merchant: string, driver: string) => {
    if (merchant) setMerchantName(merchant);
    if (driver) setDriverName(driver);
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: nextId('n'), createdAt: Date.now(), read: false },
      ...prev,
    ]);
  }, []);

  const addRequest = useCallback((r: FreightRequest) => {
    setRequests((prev) => [r, ...prev]);
    pushNotification({
      role: 'driver',
      title: 'حمولة جديدة على BAZGO',
      body: `حمولة من ${r.pickupProvince} إلى ${r.deliveryProvince} قد تناسب مركبتك.`,
    });
  }, [pushNotification]);

  const updateRequestStatus = useCallback((id: string, status: FreightRequest['status']) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const applyToFreight = useCallback((freightId: string, driverId: string) => {
    setApplications((prev) => {
      if (prev.some((a) => a.freightId === freightId && a.driverId === driverId)) return prev;
      return [
        ...prev,
        { id: nextId('a'), freightId, driverId, status: 'pending', createdAt: Date.now() },
      ];
    });
    setRequests((prev) =>
      prev.map((r) => (r.id === freightId && r.status === 'open' ? { ...r, status: 'applications' } : r))
    );
    pushNotification({
      role: 'merchant',
      title: 'طلب جديد من سائق',
      body: 'تقدم سائق للنقل على أحد طلباتك.',
    });
  }, [pushNotification]);

  const acceptDriver = useCallback((freightId: string, driverId: string) => {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.freightId !== freightId) return a;
        return { ...a, status: a.driverId === driverId ? 'accepted' : 'rejected' };
      })
    );
    setRequests((prev) =>
      prev.map((r) => (r.id === freightId ? { ...r, status: 'confirmed', selectedDriverId: driverId } : r))
    );
    pushNotification({
      role: 'driver',
      title: 'تم قبول طلبك',
      body: 'تم اختيارك لتنفيذ عملية النقل. تواصل مع التاجر.',
    });
  }, [pushNotification]);

  const rejectDriver = useCallback((freightId: string, driverId: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.freightId === freightId && a.driverId === driverId ? { ...a, status: 'rejected' } : a
      )
    );
  }, []);

  const ensureConversation = useCallback((freightId: string, driverId: string): string => {
    const existing = conversations.find((c) => c.freightId === freightId && c.driverId === driverId);
    if (existing) return existing.id;
    const req = requests.find((r) => r.id === freightId);
    const drv = drivers.find((d) => d.id === driverId);
    const id = nextId('c');
    const convo: Conversation = {
      id,
      freightId,
      driverId,
      freightTitle: req ? `${req.pickupProvince} ← ${req.deliveryProvince}` : 'محادثة',
      peerName: role === 'merchant' ? (drv?.name ?? 'سائق') : (req?.merchantName ?? 'تاجر'),
    };
    setConversations((prev) => [convo, ...prev]);
    return id;
  }, [conversations, requests, drivers, role]);

  const sendMessage = useCallback((conversationId: string, text: string, senderRole: UserRole) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId('m'), conversationId, text, senderRole, createdAt: Date.now() },
    ]);
  }, []);

  const markNotificationsRead = useCallback((r: UserRole) => {
    setNotifications((prev) => prev.map((n) => (n.role === r ? { ...n, read: true } : n)));
  }, []);

  const value = useMemo<AppContextType>(() => ({
    role, merchantName, driverName, merchantProfile, driverProfile, drivers, requests, applications,
    notifications, conversations, messages,
    setRole, setNames, setMerchantProfile, setDriverProfile, addRequest, updateRequestStatus,
    applyToFreight, acceptDriver, rejectDriver,
    ensureConversation, sendMessage, markNotificationsRead,
  }), [role, merchantName, driverName, merchantProfile, driverProfile, drivers, requests, applications,
    notifications, conversations, messages, setNames, addRequest, updateRequestStatus,
    applyToFreight, acceptDriver, rejectDriver, ensureConversation, sendMessage, markNotificationsRead]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
