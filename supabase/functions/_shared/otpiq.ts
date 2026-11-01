// OTPIQ delivery adapter. Credentials and verification codes never leave the server except to OTPIQ.
import { normalizeIraqiPhone, validateOtp } from './phoneOtp.ts';
import { classifyOtpiqFailure } from './otpiqFailure.ts';

export class OtpiqError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter = 0, public providerStatus = 0, public reason = 'unknown') { super(message); }
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
    throw new OtpiqError(502, 'provider_unreachable', 'OTPIQ: تعذر الاتصال بخدمة SMS. انتظر دقيقة ثم أعد طلب الرمز؛ لن نكرر الإرسال تلقائياً.', 60, 0, 'provider_transport_failure');
  }
  const parsed: unknown = await response.json().catch(() => null);
  const details = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  // Interpret known OTPIQ 400 failures instead of hiding trial/credit/spending restrictions
  // behind a generic 502. Logs and responses contain fixed reasons, never provider text.
  const failure = classifyOtpiqFailure(response.status, details);
  if (failure) throw new OtpiqError(failure.status, failure.code, failure.message, failure.retryAfter, response.status, failure.reason);
  if (!response.ok || typeof details.smsId !== 'string' || !details.smsId || details.smsId.length > 128) {
    throw new OtpiqError(502, 'provider_failed', 'OTPIQ: استجابة إرسال SMS غير صالحة. أعد المحاولة لاحقاً.', 60, response.status, 'invalid_success_response');
  }
  // A task ID means queued/accepted, not handset delivery. Nothing from the provider is returned to the client.
}
