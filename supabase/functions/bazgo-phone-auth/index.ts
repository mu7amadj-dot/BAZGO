import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { normalizeIraqiPhone, sha256, validateOtp } from '../_shared/phoneOtp.ts';
import { loadPhoneAuthConfig, phoneAuthConfigMessage } from '../_shared/phoneAuthConfig.ts';

class PublicError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter = 0) { super(message); }
}
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Pragma': 'no-cache' },
});
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { code: 'method_not_allowed', error: 'استخدم طلب POST.' });
  const requestId = crypto.randomUUID();
  let release: (() => Promise<void>) | null = null;
  try {
    const raw = await req.text();
    if (raw.length > 2048) throw new PublicError(413, 'request_too_large', 'حجم الطلب غير صالح.');
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { throw new PublicError(400, 'invalid_request', 'الطلب غير صالح.'); }
    if (!body || typeof body !== 'object' || !['send', 'verify'].includes(String(body.action))) throw new PublicError(400, 'invalid_action', 'الطلب غير صالح.');
    let phone: string;
    try { phone = normalizeIraqiPhone(body.phone); } catch { throw new PublicError(400, 'invalid_phone', 'أدخل رقم هاتف عراقي صحيحاً، مثال: 07XXXXXXXXX.'); }
    let code = '';
    if (body.action === 'verify') {
      try { code = validateOtp(body.code); } catch { throw new PublicError(400, 'invalid_code', 'أدخل رمز التحقق كما ورد في الرسالة.'); }
    }
    // Secrets remain server-side. Trim copied whitespace without weakening SID validation.
    const configuration = loadPhoneAuthConfig((name) => Deno.env.get(name));
    if (!configuration.ok) {
      // Only variable names and validation reasons are logged; never values or configuration.
      console.error('bazgo-phone-auth configuration failure', { requestId, issues: configuration.issues });
      throw new PublicError(503, 'configuration_missing', phoneAuthConfigMessage(configuration.issues));
    }
    const { accountSid, authToken, serviceSid, backendUrl, serviceKey, anonKey } = configuration.config;
    const admin = createClient(backendUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const phoneHash = await sha256(phone);
    // Gateway must overwrite forwarded IP headers; unknown clients share a conservative bucket.
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = await sha256(ip);
    const send = body.action === 'send';
    for (const [bucket, windowSeconds, maxAttempts, interval] of [
      [`global:${body.action}`, 3600, send ? 500 : 2000, 0],
      [`ip:${body.action}:${ipHash}`, 3600, send ? 30 : 100, 0],
      [`phone:${body.action}:${phoneHash}`, send ? 3600 : 600, send ? 5 : 10, send ? 60 : 2],
    ] as [string, number, number, number][]) {
      const limit = await admin.rpc('bazgo_take_otp_limit', { p_bucket: bucket, p_window_seconds: windowSeconds, p_max_attempts: maxAttempts, p_min_interval: interval });
      if (limit.error) throw new Error('rate_limit_database_failed');
      if (Number(limit.data) > 0) throw new PublicError(429, 'rate_limited', 'طلبات كثيرة. انتظر قبل المحاولة مجدداً.', Number(limit.data));
    }
    const twilio = async (endpoint: string, values?: Record<string, string>) => {
      const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}${endpoint}`, {
        method: values ? 'POST' : 'GET',
        headers: { Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`, ...(values ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
        body: values ? Object.entries(values).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&') : undefined,
        signal: AbortSignal.timeout(15000),
      });
      const details = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Never return provider messages: they may include phone numbers, identifiers or credentials.
        console.error('bazgo-phone-auth provider failure', { requestId, status: response.status, code: details.code });
        if (response.status === 429 || details.code === 60203 || details.code === 60202) throw new PublicError(429, 'provider_rate_limit', 'تم تجاوز عدد المحاولات. أعد إرسال الرمز لاحقاً.', 60);
        if (!send && response.status === 404) throw new PublicError(400, 'code_expired', 'انتهت صلاحية الرمز أو استُخدم سابقاً. أرسل رمزاً جديداً.');
        if (response.status === 401 || response.status === 403 || details.code === 21408 || details.code === 21608) throw new PublicError(503, 'sms_unavailable', 'تعذر إرسال SMS. على الإدارة التحقق من إعداد Twilio والسماح بالإرسال إلى العراق.');
        throw new PublicError(502, 'provider_failed', send ? 'تعذر إرسال رمز SMS. حاول لاحقاً.' : 'تعذر التحقق من الرمز. حاول لاحقاً.');
      }
      return details;
    };
    if (send) {
      const service = await twilio('');
      const codeLength = Number(service.code_length);
      if (!Number.isInteger(codeLength) || codeLength < 4 || codeLength > 10) throw new Error('invalid_provider_code_length');
      const sent = await twilio('/Verifications', { To: phone, Channel: 'sms' });
      if (sent.status !== 'pending' || sent.to !== phone) throw new Error('sms_not_pending');
      return reply(200, { sent: true, phone, codeLength, retryAfter: 60, expiresIn: 600 });
    }
    const leaseId = crypto.randomUUID();
    const claim = await admin.rpc('bazgo_claim_phone_session', { p_phone_hash: phoneHash, p_lease: leaseId });
    if (claim.error || !claim.data?.email) {
      if (claim.data?.busy) throw new PublicError(409, 'verification_in_progress', 'التحقق جارٍ لهذا الرقم. انتظر ثم حاول مجدداً.', 3);
      throw new Error('phone_claim_failed');
    }
    release = async () => {
      const result = await admin.rpc('bazgo_release_phone_session', { p_phone_hash: phoneHash, p_lease: leaseId });
      if (result.error) console.error('bazgo-phone-auth lease release failed', { requestId });
    };
    // No user creation, linking or session issuance occurs before Twilio approves this code.
    const approved = await twilio('/VerificationCheck', { To: phone, Code: code });
    if (approved.status !== 'approved' || approved.to !== phone || approved.valid !== true) throw new PublicError(400, 'incorrect_code', 'رمز التحقق غير صحيح.');
    const identity = await admin.from('bazgo_phone_identities').select('user_id').eq('phone', phone).maybeSingle();
    if (identity.error) throw new Error('identity_lookup_failed');
    let userId = identity.data?.user_id as string | undefined;
    let internalEmail = claim.data.email as string;
    if (!userId) {
      // Random non-deliverable address bridges to the existing email-capable AuthProvider.
      // It is an internal identifier, not user email input or an email verification bypass.
      const provision = await admin.auth.admin.generateLink({ type: 'magiclink', email: internalEmail, options: { data: { username: 'BAZGO' } } });
      if (provision.error || !provision.data.user) throw new Error('auth_provision_failed');
      userId = provision.data.user.id;
      const updated = await admin.auth.admin.updateUserById(userId, { phone, phone_confirm: true, email_confirm: true,
        app_metadata: { ...provision.data.user.app_metadata, bazgo_phone_auth: true } });
      if (updated.error || !updated.data.user) throw new Error('verified_phone_registration_failed');
      const linked = await admin.from('bazgo_phone_identities').insert({ phone, user_id: userId });
      if (linked.error) throw new Error('phone_identity_registration_failed');
    } else {
      const existing = await admin.auth.admin.getUserById(userId);
      if (existing.error || !existing.data.user?.email || !existing.data.user.phone_confirmed_at || normalizeIraqiPhone(existing.data.user.phone) !== phone) throw new Error('identity_mismatch');
      internalEmail = existing.data.user.email;
    }
    // Admin tokens never leave the server. The client receives only its ordinary user session.
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: internalEmail });
    if (link.error || link.data.user?.id !== userId || !link.data.properties?.hashed_token) throw new Error('auth_session_link_failed');
    const sessionClient = createClient(backendUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const sessionResult = await sessionClient.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
    if (sessionResult.error || !sessionResult.data.session || sessionResult.data.user?.id !== userId) throw new Error('auth_session_exchange_failed');
    console.log('bazgo-phone-auth verification completed', { requestId });
    return reply(200, { session: { access_token: sessionResult.data.session.access_token, refresh_token: sessionResult.data.session.refresh_token } });
  } catch (issue) {
    if (issue instanceof PublicError) return reply(issue.status, { error: issue.message, code: issue.code, retryAfter: issue.retryAfter, requestId });
    console.error('bazgo-phone-auth failed', { requestId, stage: issue instanceof Error && /^[a-z_]+$/.test(issue.message) ? issue.message : 'unexpected_failure' });
    return reply(500, { error: 'تعذر إكمال التحقق. حاول إرسال رمز جديد أو تواصل مع إدارة التطبيق.', code: 'authentication_failed', requestId });
  } finally {
    if (release) { try { await release(); } catch { console.error('bazgo-phone-auth lease release failed', { requestId }); } }
  }
});
