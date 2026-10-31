import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/template';
import { normalizeDigits, normalizePhone } from './registrationService';

export class PhoneAuthError extends Error {
  constructor(message: string, public retryAfter = 0, public code = '') { super(message); }
}
export interface SmsCodeResult { sent: boolean; phone: string; codeLength: number; retryAfter: number; expiresIn: number; }
function validPhone(value: string): string {
  const phone = normalizePhone(value);
  if (!/^\+9647\d{9}$/.test(phone)) throw new PhoneAuthError('أدخل رقم هاتف عراقي صحيحاً، مثال: 07XXXXXXXXX.');
  return phone;
}
async function invokePhoneAuth<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('bazgo-phone-auth', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const text = await error.context.text();
        const details = JSON.parse(text);
        throw new PhoneAuthError(typeof details.error === 'string' ? details.error : `تعذر الاتصال بخدمة SMS (${error.context.status}).`, Number(details.retryAfter) || 0, details.code ?? '');
      } catch (issue) { if (issue instanceof PhoneAuthError) throw issue; }
    }
    throw new PhoneAuthError('تعذر الاتصال بخدمة التحقق. تحقق من اتصال الإنترنت وحاول مجدداً.');
  }
  if (!data || data.error) throw new PhoneAuthError(data?.error ?? 'استجابة خدمة التحقق غير صالحة.', Number(data?.retryAfter) || 0);
  return data as T;
}
export async function sendPhoneCode(phone: string): Promise<SmsCodeResult> {
  const normalized = validPhone(phone);
  const result = await invokePhoneAuth<SmsCodeResult>({ action: 'send', phone: normalized });
  if (result.sent !== true || result.phone !== normalized || result.codeLength !== 6
    || !Number.isFinite(result.retryAfter) || result.retryAfter < 0 || result.retryAfter > 3600
    || !Number.isFinite(result.expiresIn) || result.expiresIn <= 0 || result.expiresIn > 3600) {
    throw new PhoneAuthError('استجابة خدمة SMS غير صالحة. حاول مجدداً.');
  }
  return result;
}
export async function verifyPhoneCode(phone: string, code: string): Promise<void> {
  const token = normalizeDigits(code).replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) throw new PhoneAuthError('أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى رقمك.');
  const result = await invokePhoneAuth<{ session?: { access_token: string; refresh_token: string } }>({ action: 'verify', phone: validPhone(phone), code: token });
  if (typeof result.session?.access_token !== 'string' || !result.session.access_token || typeof result.session.refresh_token !== 'string' || !result.session.refresh_token) throw new PhoneAuthError('لم يتم إنشاء جلسة تسجيل الدخول.');
  // Reuse the existing client. AuthProvider is updated by its onAuthStateChange listener.
  const { data, error } = await getSupabaseClient().auth.setSession(result.session);
  if (error) throw new PhoneAuthError('تعذر حفظ جلسة تسجيل الدخول. حاول مجدداً.');
  if (!data.user || !data.session) throw new PhoneAuthError('لم يتم إنشاء جلسة تسجيل الدخول.');
}
export async function fetchVerifiedPhone(): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('bazgo_verified_phone');
  if (error) throw new PhoneAuthError('تعذر تحميل الرقم المتحقق منه. أعد المحاولة.');
  return typeof data === 'string' ? data : '';
}
