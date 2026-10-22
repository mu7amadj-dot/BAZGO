import type { MarketSnapshot } from './bookingTypes';
import type { DriverProfile, MerchantProfile } from './types';

const emptyMerchant: MerchantProfile = { companyName: '', location: '', province: '', phone: '' };
const emptyDriver: DriverProfile = { fatherName: '', grandfatherName: '', province: '', vehicleType: '', maxCapacity: '', driverPhoto: '', licensePhoto: '', vehiclePhoto: '', phone: '' };
export function projectMarketData(snapshot: MarketSnapshot, userId: string | null) {
  const role = snapshot.account?.role ?? 'merchant';
  const requests = snapshot.loads.filter((load) => role !== 'merchant' || load.merchantId === userId);
  return {
    role, merchantName: role === 'merchant' ? snapshot.account?.name ?? '' : '', driverName: role === 'driver' ? snapshot.account?.name ?? '' : '',
    merchantProfile: role === 'merchant' ? { ...emptyMerchant, ...snapshot.account?.profile } : { ...emptyMerchant },
    driverProfile: role === 'driver' ? { ...emptyDriver, ...snapshot.account?.profile } : { ...emptyDriver },
    requests,
    conversations: snapshot.negotiations.map((n) => ({ id: n.id, freightId: n.load_id, driverId: n.driver_id,
      freightTitle: `${n.status === 'cancelled' || n.status === 'expired' ? 'تفاوض مغلق · ' : ''}${snapshot.loads.find((load) => load.id === n.load_id)?.cargoType ?? 'حمولة'}`,
      peerName: role === 'merchant' ? n.driver_name : n.merchant_name,
    })),
    messages: snapshot.messages.map((m) => ({ id: m.id, conversationId: m.negotiation_id,
      senderRole: m.user_id === userId ? role : role === 'merchant' ? 'driver' as const : 'merchant' as const,
      text: m.kind === 'voice' ? 'رسالة صوتية' : m.text, kind: m.kind, audioPath: m.audio_path ?? undefined, createdAt: new Date(m.created_at).getTime(),
    })),
    notifications: snapshot.notifications.map((n) => ({ ...n, role, createdAt: new Date(n.created_at).getTime() })),
  };
}
