import type { FreightRequest, UserRole } from './types';
export type NegotiationStatus = 'negotiating' | 'confirmed' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'expired';
export interface MarketAccount { user_id: string; role: UserRole; name: string; profile: Record<string, string>; }
export interface Negotiation {
  id: string; load_id: string; user_id: string; driver_id: string; merchant_name: string; driver_name: string;
  initial_price: number; proposed_price: number | null; agreed_price: number | null;
  status: NegotiationStatus; expires_at: string; created_at: string; cancellation_reason: string | null;
}
export interface BookingMessage {
  id: string; negotiation_id: string; user_id: string; kind: 'text' | 'voice'; text: string;
  audio_path: string | null; duration_ms: number | null; created_at: string;
}
export interface TripRating { id: string; negotiation_id: string; user_id: string; rated_user_id: string; stars: number; comment: string; }
export interface BookingNotification { id: string; user_id: string; negotiation_id: string | null; load_id: string | null; title: string; body: string; read: boolean; created_at: string; }
export interface MarketSnapshot {
  account: MarketAccount | null; serverNow: string; loads: FreightRequest[]; negotiations: Negotiation[];
  messages: BookingMessage[]; ratings: TripRating[]; notifications: BookingNotification[];
}
export type NegotiationAction = 'propose' | 'confirm' | 'cancel' | 'start' | 'deliver' | 'rate' | 'message';
