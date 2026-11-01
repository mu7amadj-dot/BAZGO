// Opt-in backend checks. They do not send SMS or create an account.
// deno test --allow-env --allow-net tests/phoneAuth.integration.test.ts
import { createClient, FunctionsHttpError } from 'npm:@supabase/supabase-js@2';
import { assert, assertEquals } from 'jsr:@std/assert@1';
const url = Deno.env.get('TEST_BACKEND_URL') ?? '';
const key = Deno.env.get('TEST_ANON_KEY') ?? '';
Deno.test({ name: 'Anonymous clients cannot read identities, mutate limits or acquire provisioning leases', ignore: !url || !key, fn: async () => {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const table of ['bazgo_phone_identities', 'bazgo_phone_bootstrap', 'bazgo_otp_limits', 'bazgo_otp_challenges']) {
    const result = await client.from(table).select('*');
    assert(result.error, `${table} must be inaccessible to anonymous clients`);
  }
  const limit = await client.rpc('bazgo_take_otp_limit', { p_bucket: 'integration', p_window_seconds: 60, p_max_attempts: 1, p_min_interval: 60 });
  assert(limit.error);
  const claim = await client.rpc('bazgo_claim_phone_session', { p_phone_hash: '0'.repeat(64), p_lease: crypto.randomUUID() });
  assert(claim.error);
  const consumed = await client.rpc('bazgo_consume_otp_challenge', { p_phone_hash: '0'.repeat(64), p_challenge: crypto.randomUUID(), p_code_hash: '1'.repeat(64) });
  assert(consumed.error);
  const begun = await client.rpc('bazgo_begin_otp_challenge', { p_phone_hash: '0'.repeat(64), p_challenge: crypto.randomUUID(), p_code_hash: '1'.repeat(64) });
  assert(begun.error);
  const finished = await client.rpc('bazgo_finish_otp_send', { p_phone_hash: '0'.repeat(64), p_challenge: crypto.randomUUID(), p_accepted: true });
  assert(finished.error);
  const phone = await client.rpc('bazgo_verified_phone');
  assert(phone.error);
} });
Deno.test({ name: 'Malformed public auth requests fail before provider access or user creation', ignore: !url || !key, fn: async () => {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const body of [{ action: 'send', phone: 'not-a-number' }, { action: 'verify', phone: '07701234567', code: 'xx' }, { action: 'verify', phone: '07701234567', code: '1234' }, { action: 'password_login', phone: '07701234567', password: 'short' }, { action: 'verify', phone: '07701234567', code: '123456', password: 'long-enough-password', intent: 'unsupported' }, { action: 'verify_driver_phone', phone: '07701234567', code: 'xx' }, { action: 'finish_driver_registration', phone: '07701234567', password: 'short' }, { action: 'unsupported' }]) {
    const result = await client.functions.invoke('bazgo-phone-auth', { body });
    assert(result.error instanceof FunctionsHttpError);
    assertEquals(result.error.context.status, 400);
    const details = await result.error.context.json();
    assert(typeof details.error === 'string');
    assert(!JSON.stringify(details).includes('OTPIQ_API_KEY'));
    assert(!JSON.stringify(details).includes('SUPABASE_SERVICE_ROLE_KEY'));
  }
} });
