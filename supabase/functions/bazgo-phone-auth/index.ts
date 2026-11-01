import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { normalizeIraqiPhone, sha256, validateOtp } from '../_shared/phoneOtp.ts';
import { loadPhoneAuthConfig, phoneAuthConfigMessage } from '../_shared/phoneAuthConfig.ts';
import { generateOtp, hashOtp, otpCodeLength, otpExpiresIn, otpResendAfter } from '../_shared/otpChallenge.ts';
import { OtpiqError, sendOtpiqCode } from '../_shared/otpiq.ts';
import { authenticatePhonePassword, validatePhonePassword } from '../_shared/phonePassword.ts';

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
    if (!body || typeof body !== 'object' || !['send', 'verify', 'password_login'].includes(String(body.action))) throw new PublicError(400, 'invalid_action', 'الطلب غير صالح.');
    let phone: string;
    try { phone = normalizeIraqiPhone(body.phone); } catch { throw new PublicError(400, 'invalid_phone', 'أدخل رقم هاتف عراقي صحيحاً، مثال: 07XXXXXXXXX.'); }
    let code = '';
    let password = '';
    const passwordLogin = body.action === 'password_login';
    if (body.action === 'verify') {
      try { code = validateOtp(body.code); } catch { throw new PublicError(400, 'invalid_code', 'أدخل رمز التحقق كما ورد في الرسالة.'); }
      if (!['register', 'reset_password'].includes(String(body.intent))) throw new PublicError(400, 'invalid_intent', 'حدّث التطبيق ثم أعد المحاولة.');
    }
    if (passwordLogin || body.action === 'verify') {
      try { password = validatePhonePassword(body.password); } catch { throw new PublicError(400, 'invalid_password', 'الرقم السري يجب أن يحتوي على 6 أحرف أو أرقام على الأقل وألا يتجاوز 72 بايت.'); }
    }
    // Provider and admin credentials are read only inside this Edge Function.
    const configuration = loadPhoneAuthConfig((name) => Deno.env.get(name), { requireProvider: !passwordLogin });
    if (!configuration.ok) {
      // Only variable names and validation reasons are logged; never values or configuration.
      console.error('bazgo-phone-auth configuration failure', { requestId, issues: configuration.issues });
      throw new PublicError(503, 'configuration_missing', phoneAuthConfigMessage(configuration.issues));
    }
    const { otpiqApiKey, backendUrl, serviceKey, anonKey } = configuration.config;
    const admin = createClient(backendUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const phoneHash = await sha256(phone);
    // Gateway must overwrite forwarded IP headers; unknown clients share a conservative bucket.
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = await sha256(ip);
    const send = body.action === 'send';
    for (const [bucket, windowSeconds, maxAttempts, interval] of [
      [`global:${body.action}`, 3600, send || passwordLogin ? 500 : 2000, 0],
      [`ip:${body.action}:${ipHash}`, 3600, send || passwordLogin ? 30 : 100, 0],
      [`phone:${body.action}:${phoneHash}`, send ? 3600 : 600, send || passwordLogin ? 5 : 10, send ? 60 : 2],
    ] as [string, number, number, number][]) {
      const limit = await admin.rpc('bazgo_take_otp_limit', { p_bucket: bucket, p_window_seconds: windowSeconds, p_max_attempts: maxAttempts, p_min_interval: interval });
      if (limit.error) throw new Error('rate_limit_database_failed');
      if (Number(limit.data) > 0) throw new PublicError(429, 'rate_limited', 'طلبات كثيرة. انتظر قبل المحاولة مجدداً.', Number(limit.data));
    }
    if (passwordLogin) {
      // Password authentication never sends SMS, consumes OTP or creates/links users.
      const passwordClient = createClient(backendUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      const session = await authenticatePhonePassword(admin, passwordClient, phone, password);
      if (!session) throw new PublicError(401, 'invalid_credentials', 'رقم الهاتف أو الرقم السري غير صحيح. إذا لم تعيّن رقماً سرياً من قبل، استخدم تعيين أو استعادة الرقم السري.');
      console.log('bazgo-phone-auth password login completed', { requestId });
      return reply(200, { session });
    }
    // Serialize sends and verification/provisioning for a phone across server instances.
    const leaseId = crypto.randomUUID();
    const claim = await admin.rpc('bazgo_claim_phone_session', { p_phone_hash: phoneHash, p_lease: leaseId });
    if (claim.error || !claim.data?.email) {
      if (claim.data?.busy) throw new PublicError(409, 'verification_in_progress', 'يوجد طلب جارٍ لهذا الرقم. انتظر ثم حاول مجدداً.', 3);
      throw new Error('phone_claim_failed');
    }
    release = async () => {
      const result = await admin.rpc('bazgo_release_phone_session', { p_phone_hash: phoneHash, p_lease: leaseId });
      if (result.error) console.error('bazgo-phone-auth lease release failed', { requestId });
    };
    if (send) {
      const challengeId = crypto.randomUUID();
      const otp = generateOtp();
      const digest = await hashOtp(serviceKey, phoneHash, challengeId, otp);
      // Replace the previous challenge before delivery. Pending codes cannot be used to log in.
      const started = await admin.rpc('bazgo_begin_otp_challenge', { p_phone_hash: phoneHash, p_challenge: challengeId, p_code_hash: digest });
      if (started.error) throw new Error('otp_challenge_create_failed');
      let activated = false;
      try {
        await sendOtpiqCode(otpiqApiKey, phone, otp);
        const finished = await admin.rpc('bazgo_finish_otp_send', { p_phone_hash: phoneHash, p_challenge: challengeId, p_accepted: true });
        if (finished.error || finished.data !== true) throw new Error('otp_challenge_activate_failed');
        activated = true;
        return reply(200, { sent: true, phone, codeLength: otpCodeLength, retryAfter: otpResendAfter, expiresIn: otpExpiresIn });
      } finally {
        if (!activated) {
          // An error/timeout must not activate a code, even if delivery eventually happens.
          const failed = await admin.rpc('bazgo_finish_otp_send', { p_phone_hash: phoneHash, p_challenge: challengeId, p_accepted: false });
          if (failed.error) console.error('bazgo-phone-auth send finalization failed', { requestId });
        }
      }
    }
    const challenge = await admin.from('bazgo_otp_challenges').select('challenge_id').eq('phone_hash', phoneHash).maybeSingle();
    if (challenge.error) throw new Error('otp_challenge_lookup_failed');
    if (!challenge.data) throw new PublicError(400, 'code_expired', 'لا يوجد رمز صالح لهذا الرقم. أرسل رمزاً جديداً.');
    const digest = await hashOtp(serviceKey, phoneHash, challenge.data.challenge_id, code);
    // Row locking atomically checks expiry/attempts and consumes the code before any Auth operation.
    const approved = await admin.rpc('bazgo_consume_otp_challenge', { p_phone_hash: phoneHash, p_challenge: challenge.data.challenge_id, p_code_hash: digest });
    if (approved.error) throw new Error('otp_challenge_check_failed');
    if (approved.data === 'locked') throw new PublicError(429, 'code_locked', 'تم تجاوز محاولات هذا الرمز. انتظر ثم أرسل رمزاً جديداً.', 60);
    if (approved.data === 'expired') throw new PublicError(400, 'code_expired', 'انتهت صلاحية الرمز أو استُخدم أو استُبدل. أرسل رمزاً جديداً.');
    if (approved.data === 'incorrect') throw new PublicError(400, 'incorrect_code', 'رمز التحقق غير صحيح.');
    if (approved.data !== 'approved') throw new Error('invalid_otp_check_result');
    const identity = await admin.from('bazgo_phone_identities').select('user_id').eq('phone', phone).maybeSingle();
    if (identity.error) throw new Error('identity_lookup_failed');
    let userId = identity.data?.user_id as string | undefined;
    let internalEmail = claim.data.email as string;
    if (!userId) {
      if (body.intent === 'reset_password') throw new PublicError(400, 'account_not_found', 'لا يوجد حساب متحقق منه لهذا الرقم. استخدم إنشاء حساب جديد.');
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
    // Only a consumed, valid phone OTP can set the first password or explicitly reset it.
    // The existing verified identity must match again before changing Auth credentials.
    const passwordUser = await admin.auth.admin.getUserById(userId);
    if (passwordUser.error || !passwordUser.data.user?.phone_confirmed_at || normalizeIraqiPhone(passwordUser.data.user.phone) !== phone) throw new Error('password_verified_identity_failed');
    if (body.intent === 'register' && passwordUser.data.user.app_metadata?.bazgo_password_enabled === true) {
      throw new PublicError(409, 'account_exists', 'لديك حساب برقم سري مسبقاً. اختر لديّ حساب للدخول دون OTP، أو استعادة الرقم السري.');
    }
    const passwordUpdate = await admin.auth.admin.updateUserById(userId, {
      password,
      app_metadata: { ...passwordUser.data.user.app_metadata, bazgo_password_enabled: true },
    });
    if (passwordUpdate.error || passwordUpdate.data.user?.id !== userId) throw new Error('password_update_failed');
    // Admin tokens never leave the server. The client receives only its ordinary user session.
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: internalEmail });
    if (link.error || link.data.user?.id !== userId || !link.data.properties?.hashed_token) throw new Error('auth_session_link_failed');
    const sessionClient = createClient(backendUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const sessionResult = await sessionClient.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
    if (sessionResult.error || !sessionResult.data.session || sessionResult.data.user?.id !== userId) throw new Error('auth_session_exchange_failed');
    console.log('bazgo-phone-auth verification completed', { requestId });
    return reply(200, { session: { access_token: sessionResult.data.session.access_token, refresh_token: sessionResult.data.session.refresh_token } });
  } catch (issue) {
    if (issue instanceof OtpiqError) {
      console.error('bazgo-phone-auth OTPIQ failure', { requestId, status: issue.providerStatus, code: issue.code });
      return reply(issue.status, { error: issue.message, code: issue.code, retryAfter: issue.retryAfter, requestId });
    }
    if (issue instanceof PublicError) return reply(issue.status, { error: issue.message, code: issue.code, retryAfter: issue.retryAfter, requestId });
    console.error('bazgo-phone-auth failed', { requestId, stage: issue instanceof Error && /^[a-z_]+$/.test(issue.message) ? issue.message : 'unexpected_failure' });
    return reply(500, { error: 'تعذر إكمال التحقق. حاول إرسال رمز جديد أو تواصل مع إدارة التطبيق.', code: 'authentication_failed', requestId });
  } finally {
    if (release) { try { await release(); } catch { console.error('bazgo-phone-auth lease release failed', { requestId }); } }
  }
});
