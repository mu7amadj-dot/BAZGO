// OTPIQ delivery adapter. Credentials and verification codes never leave the server except to OTPIQ.
import { normalizeIraqiPhone, validateOtp } from './phoneOtp.ts';

export class OtpiqError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter = 0, public providerStatus = 0) { super(message); }
}

export async function sendOtpiqCode(apiKey: string, phone: string, code: string, fetcher: typeof fetch = fetch): Promise<void> {
  const normalized = normalizeIraqiPhone(phone);
  const token = validateOtp(code);
  let response: Response;
  try {
    response = await fetcher('https://api.otpiq.com/api/sms', {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: normalized.slice(1), smsType: 'verification', verificationCode: token, provider: 'sms' }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Delivery is uncertain on a timeout; never treat it as successful or retry automatically.
    throw new OtpiqError(502, 'provider_unreachable', 'OTPIQ: تعذر الاتصال بخدمة SMS. أعد طلب الرمز لاحقاً.');
  }
  const parsed: unknown = await response.json().catch(() => null);
  const details = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  // Provider messages/bodies may contain secrets or PII and must never be forwarded or logged.
  if (response.status === 429) throw new OtpiqError(429, 'provider_rate_limit', 'OTPIQ: تم تجاوز حد إرسال الرسائل. حاول لاحقاً.', 60, response.status);
  if (response.status === 401 || response.status === 403) throw new OtpiqError(503, 'sms_unavailable', 'OTPIQ: على الإدارة مراجعة صلاحية مفتاح API وأذونات إرسال SMS.', 0, response.status);
  if (details.canCover === false || response.status === 402) throw new OtpiqError(503, 'insufficient_credit', 'OTPIQ: رصيد إرسال SMS غير كافٍ. تواصل مع إدارة التطبيق.', 0, response.status);
  if (!response.ok || typeof details.smsId !== 'string' || !details.smsId || details.smsId.length > 128 || details.error) {
    throw new OtpiqError(502, 'provider_failed', 'OTPIQ: لم يُقبل طلب إرسال رمز SMS. حاول لاحقاً أو تواصل مع الإدارة.', 0, response.status);
  }
  // A task ID means queued/accepted, not handset delivery. Nothing from the provider is returned to the client.
}
