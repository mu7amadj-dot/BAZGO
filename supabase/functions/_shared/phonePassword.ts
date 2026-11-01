// Edge Function only. No plaintext passwords are stored, hashed locally or logged.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { normalizeIraqiPhone } from './phoneOtp.ts';

export function validatePhonePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 6 || !value.trim() || new TextEncoder().encode(value).byteLength > 72) throw new Error('invalid_password');
  return value;
}
export async function authenticatePhonePassword(admin: SupabaseClient, sessionClient: SupabaseClient, phone: string, password: string) {
  const identity = await admin.from('bazgo_phone_identities').select('user_id').eq('phone', phone).maybeSingle();
  if (identity.error) throw new Error('password_identity_lookup_failed');
  let email = 'unavailable-password-login@phone.bazgo.invalid';
  let expectedUserId = '';
  if (identity.data?.user_id) {
    const existing = await admin.auth.admin.getUserById(identity.data.user_id);
    if (existing.error || !existing.data.user) throw new Error('password_identity_read_failed');
    const user = existing.data.user;
    let phoneMatches = false;
    try { phoneMatches = normalizeIraqiPhone(user.phone) === phone; } catch { /* Fail closed. */ }
    if (user.email && user.phone_confirmed_at && phoneMatches && user.app_metadata?.bazgo_password_enabled === true) {
      email = user.email;
      expectedUserId = user.id;
    }
  }
  // Unknown phones, legacy accounts and incorrect passwords share the same public failure.
  // Use the backend's normal password verifier even for unknown/legacy accounts.
  const result = await sessionClient.auth.signInWithPassword({ email, password });
  if (result.error || !expectedUserId || result.data.user?.id !== expectedUserId || !result.data.session) return null;
  return { access_token: result.data.session.access_token, refresh_token: result.data.session.refresh_token };
}
