// Powered by OnSpace.AI
// Preserve the local demo; authenticated data always comes from BookingProvider.
import React, { createContext, useCallback, useMemo, useState, ReactNode } from 'react';
import { Application, AppNotification, Conversation, Driver, DriverProfile, FreightRequest, MerchantProfile, Message, UserRole } from '@/services/types';
import { mockDrivers, mockRequests, mockNotifications, mockApplications } from '@/services/mockData';
import { useBooking } from '@/hooks/useBooking';
export interface AppContextType {
  role: UserRole; merchantName: string; driverName: string; merchantProfile: MerchantProfile; driverProfile: DriverProfile;
  drivers: Driver[]; requests: FreightRequest[]; applications: Application[]; notifications: AppNotification[]; conversations: Conversation[]; messages: Message[];
  setRole: (r: UserRole) => void; setNames: (merchant: string, driver: string) => void;
  setMerchantProfile: (p: MerchantProfile) => void; setDriverProfile: (p: DriverProfile) => void;
  addRequest: (r: FreightRequest) => Promise<void>;
  updateRequestStatus: (id: string, status: FreightRequest['status']) => void;
  applyToFreight: (freightId: string, driverId: string) => void;
  acceptDriver: (freightId: string, driverId: string) => void; rejectDriver: (freightId: string, driverId: string) => void;
  ensureConversation: (freightId: string, driverId: string) => string;
  sendMessage: (conversationId: string, text: string, senderRole: UserRole) => void;
  markNotificationsRead: (role: UserRole) => void;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);
let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}${idCounter++}`;
export function AppProvider({ children }: { children: ReactNode }) {
  const booking = useBooking();
  const [demoRole, setDemoRole] = useState<UserRole>('merchant');
  const role = booking.authenticated ? (booking.account?.role ?? 'merchant') : demoRole;
  const [merchantName, setMerchantName] = useState('التاجر');
  const [driverName, setDriverName] = useState('السائق');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>({ companyName: '', location: '', province: '', phone: '' });
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({ fatherName: '', grandfatherName: '', province: '', vehicleType: '', maxCapacity: '', driverPhoto: '', licensePhoto: '', vehiclePhoto: '', phone: '' });
  const [requests, setRequests] = useState<FreightRequest[]>(mockRequests);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const setRole = useCallback((r: UserRole) => { if (!booking.authenticated) setDemoRole(r); }, [booking.authenticated]);
  const setNames = useCallback((merchant: string, driver: string) => { if (merchant) setMerchantName(merchant); if (driver) setDriverName(driver); }, []);
  const requireDemo = useCallback(() => { if (booking.authenticated) throw new Error('Use the secure reservation and agreement workflow'); }, [booking.authenticated]);
  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [{ ...n, id: nextId('n'), createdAt: Date.now(), read: false }, ...prev]);
  }, []);
  const addRequest = useCallback(async (r: FreightRequest) => {
    if (booking.authenticated) { await booking.createLoad(r); return; }
    setRequests((prev) => [r, ...prev]);
    pushNotification({ role: 'driver', title: 'حمولة جديدة على BAZGO', body: `حمولة من ${r.pickupProvince} إلى ${r.deliveryProvince} قد تناسب مركبتك.` });
  }, [booking.authenticated, booking.createLoad, pushNotification]);
  const updateRequestStatus = useCallback((id: string, status: FreightRequest['status']) => {
    requireDemo(); setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }, [requireDemo]);
  const applyToFreight = useCallback((freightId: string, driverId: string) => {
    requireDemo();
    setApplications((prev) => prev.some((a) => a.freightId === freightId && a.driverId === driverId) ? prev : [...prev, { id: nextId('a'), freightId, driverId, status: 'pending', createdAt: Date.now() }]);
    setRequests((prev) => prev.map((r) => r.id === freightId && r.status === 'open' ? { ...r, status: 'applications' } : r));
    pushNotification({ role: 'merchant', title: 'طلب جديد من سائق', body: 'تقدم سائق للنقل على أحد طلباتك.' });
  }, [requireDemo, pushNotification]);
  const acceptDriver = useCallback((freightId: string, driverId: string) => {
    requireDemo();
    setApplications((prev) => prev.map((a) => a.freightId !== freightId ? a : { ...a, status: a.driverId === driverId ? 'accepted' : 'rejected' }));
    setRequests((prev) => prev.map((r) => r.id === freightId ? { ...r, status: 'confirmed', selectedDriverId: driverId } : r));
    pushNotification({ role: 'driver', title: 'تم قبول طلبك', body: 'تم اختيارك لتنفيذ عملية النقل. تواصل مع التاجر.' });
  }, [requireDemo, pushNotification]);
  const rejectDriver = useCallback((freightId: string, driverId: string) => {
    requireDemo(); setApplications((prev) => prev.map((a) => a.freightId === freightId && a.driverId === driverId ? { ...a, status: 'rejected' } : a));
  }, [requireDemo]);
  const ensureConversation = useCallback((freightId: string, driverId: string) => {
    requireDemo();
    const existing = conversations.find((c) => c.freightId === freightId && c.driverId === driverId);
    if (existing) return existing.id;
    const req = requests.find((r) => r.id === freightId);
    const drv = mockDrivers.find((d) => d.id === driverId);
    const id = nextId('c');
    setConversations((prev) => [{ id, freightId, driverId, freightTitle: req ? `${req.pickupProvince} ← ${req.deliveryProvince}` : 'محادثة', peerName: role === 'merchant' ? drv?.name ?? 'سائق' : req?.merchantName ?? 'تاجر' }, ...prev]);
    return id;
  }, [requireDemo, conversations, requests, role]);
  const sendMessage = useCallback((conversationId: string, text: string, senderRole: UserRole) => {
    requireDemo(); setMessages((prev) => [...prev, { id: nextId('m'), conversationId, text, senderRole, createdAt: Date.now() }]);
  }, [requireDemo]);
  const markNotificationsRead = useCallback((r: UserRole) => {
    if (booking.authenticated) { void booking.markRead().catch(() => undefined); return; }
    setNotifications((prev) => prev.map((n) => n.role === r ? { ...n, read: true } : n));
  }, [booking.authenticated, booking.markRead]);
  const value = useMemo<AppContextType>(() => ({
    role,
    merchantName: booking.account?.role === 'merchant' ? booking.account.name : merchantName,
    driverName: booking.account?.role === 'driver' ? booking.account.name : driverName,
    merchantProfile: booking.account?.role === 'merchant' ? { ...merchantProfile, ...booking.account.profile } : merchantProfile,
    driverProfile: booking.account?.role === 'driver' ? { ...driverProfile, ...booking.account.profile } : driverProfile,
    drivers: booking.authenticated ? [] : mockDrivers,
    requests: booking.authenticated ? booking.loads.filter((r) => role !== 'merchant' || r.merchantId === booking.userId) : requests,
    applications: booking.authenticated ? [] : applications,
    notifications: booking.authenticated ? booking.notifications.map((n) => ({ ...n, role, createdAt: new Date(n.created_at).getTime() })) : notifications,
    conversations: booking.authenticated ? booking.negotiations.map((n) => ({ id: n.id, freightId: n.load_id, driverId: n.driver_id,
      freightTitle: `${n.status === 'cancelled' || n.status === 'expired' ? 'تفاوض مغلق · ' : ''}${booking.loads.find((r) => r.id === n.load_id)?.cargoType ?? 'حمولة'}`,
      peerName: role === 'merchant' ? n.driver_name : n.merchant_name,
    })) : conversations,
    messages: booking.authenticated ? booking.messages.map((m) => ({ id: m.id, conversationId: m.negotiation_id,
      senderRole: m.user_id === booking.userId ? role : role === 'merchant' ? 'driver' : 'merchant',
      text: m.kind === 'voice' ? 'رسالة صوتية' : m.text, kind: m.kind, audioPath: m.audio_path ?? undefined, createdAt: new Date(m.created_at).getTime(),
    })) : messages,
    setRole, setNames, setMerchantProfile, setDriverProfile, addRequest, updateRequestStatus, applyToFreight, acceptDriver, rejectDriver, ensureConversation, sendMessage, markNotificationsRead,
  }), [role, booking, merchantName, driverName, merchantProfile, driverProfile, requests, applications, notifications, conversations, messages, setRole, setNames, addRequest, updateRequestStatus, applyToFreight, acceptDriver, rejectDriver, ensureConversation, sendMessage, markNotificationsRead]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
