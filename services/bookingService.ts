import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/template';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { readNativeBase64 } from './fileSystemService';
import type { FreightRequest } from './types';
import type { MarketAccount, MarketSnapshot, Negotiation, NegotiationAction } from './bookingTypes';

export async function marketRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabaseClient().rpc(name, args);
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}
let schedulerReady: Promise<void> | null = null;
export function ensureServerScheduler(): Promise<void> {
  if (!schedulerReady) schedulerReady = (async () => {
    const { data, error } = await getSupabaseClient().functions.invoke('bazgo-scheduler', { body: {} });
    if (error) {
      let message = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const details = await error.context.text();
          try { message = JSON.parse(details).error ?? details; } catch { message = details; }
        } catch { /* Preserve original error. */ }
      }
      throw new Error(`Server expiry scheduler: ${message}`);
    }
    if (!data?.ready) throw new Error('Server expiry scheduler is not ready');
  })().catch((error) => { schedulerReady = null; throw error; });
  return schedulerReady;
}
export function setupMarketAccount(role: string, name: string, profile: Record<string, string> = {}) {
  return marketRpc<MarketAccount>('bazgo_setup_account', { p_role: role, p_name: name, p_profile: profile });
}
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const raw = await marketRpc<any>('bazgo_snapshot');
  const loads: FreightRequest[] = raw.loads.map((load: any) => ({ ...load.payload, id: load.id,
    merchantId: load.user_id, merchantName: load.merchant_name, merchantRating: 0,
    priceIQD: Number(load.initial_price), status: load.status, activeNegotiationId: load.active_negotiation_id,
    createdAt: new Date(load.created_at).getTime(), serverBacked: true,
  }));
  return { ...raw, loads, negotiations: raw.negotiations.map((n: any) => ({ ...n,
    initial_price: Number(n.initial_price), proposed_price: n.proposed_price == null ? null : Number(n.proposed_price),
    agreed_price: n.agreed_price == null ? null : Number(n.agreed_price),
  })) };
}
export async function reserveServerLoad(id: string): Promise<Negotiation> {
  await ensureServerScheduler();
  return marketRpc<Negotiation>('bazgo_reserve_load', { p_load_id: id });
}
export function negotiationAction(id: string, action: NegotiationAction, value: Record<string, unknown> = {}) {
  return marketRpc<Negotiation>('bazgo_negotiation_action', { p_id: id, p_action: action, p_value: value });
}
export function cancelServerLoad(id: string) { return marketRpc<void>('bazgo_cancel_load', { p_id: id }); }
export function markServerNotifications() { return marketRpc<void>('bazgo_mark_notifications'); }

async function uploadMedia(bucket: string, path: string, uri: string, contentType: string, allowExisting = false) {
  let data: Blob | ArrayBuffer;
  if (Platform.OS === 'web' || /^https?:/.test(uri)) {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Unable to read attachment');
    data = await response.blob();
  } else {
    data = decode(await readNativeBase64(uri));
  }
  const size = data instanceof ArrayBuffer ? data.byteLength : data.size;
  if (size > 5 * 1024 * 1024) throw new Error('Attachment must be smaller than 5 MB');
  const { error } = await getSupabaseClient().storage.from(bucket).upload(path, data, { contentType, upsert: false });
  if (error && !(allowExisting && (error.message.toLowerCase().includes('already exists') || error.message.toLowerCase().includes('duplicate')))) throw new Error(error.message);
  return path;
}
export async function createServerLoad(request: FreightRequest, userId: string) {
  let image = request.cargoImage;
  if (image && !/^https?:/.test(image)) {
    const path = `${userId}/${Crypto.randomUUID()}.jpg`;
    await uploadMedia('bazgo-cargo', path, image, 'image/jpeg');
    image = getSupabaseClient().storage.from('bazgo-cargo').getPublicUrl(path).data.publicUrl;
  }
  return marketRpc<string>('bazgo_create_load', { p_payload: { ...request, cargoImage: image } });
}
export function sendServerText(id: string, text: string, clientId: string) {
  return negotiationAction(id, 'message', { kind: 'text', text, clientId });
}
export async function sendServerVoice(id: string, userId: string, uri: string, durationMs: number, mime: string, clientId: string) {
  const extension = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'm4a';
  const audioPath = `${id}/${userId}/${clientId}.${extension}`;
  await uploadMedia('bazgo-voice', audioPath, uri, mime, true);
  return negotiationAction(id, 'message', { kind: 'voice', audioPath, durationMs: Math.min(60000, Math.max(1, Math.round(durationMs))), clientId });
}
export async function getVoiceUrl(path: string) {
  const { data, error } = await getSupabaseClient().storage.from('bazgo-voice').createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
