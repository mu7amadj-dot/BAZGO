// Only run on an explicitly disposable test project, never the production database.
// TEST_DISPOSABLE_BACKEND=true TEST_BACKEND_URL=... TEST_SERVICE_ROLE_KEY=...
// deno test --allow-env --allow-net tests/otpChallenge.integration.test.ts
// No SMS, Auth users or marketplace records are created. Random operational fixtures are retained.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { assertEquals } from 'jsr:@std/assert@1';
import { sha256 } from '../supabase/functions/_shared/phoneOtp.ts';
import { hashOtp } from '../supabase/functions/_shared/otpChallenge.ts';
const url = Deno.env.get('TEST_BACKEND_URL') ?? '';
const key = Deno.env.get('TEST_SERVICE_ROLE_KEY') ?? '';
const enabled = Deno.env.get('TEST_DISPOSABLE_BACKEND') === 'true' && !!url && !!key;
function client() { return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
type TestClient = ReturnType<typeof client>;
interface Fixture { phoneHash: string; challengeId: string; digest: string; }
async function begin(db: TestClient, phoneHash?: string): Promise<Fixture> {
  const hash = phoneHash ?? await sha256(`disposable-fixture:${crypto.randomUUID()}`);
  const id = crypto.randomUUID();
  const digest = await hashOtp('synthetic-test-secret', hash, id, '123456');
  const result = await db.rpc('bazgo_begin_otp_challenge', { p_phone_hash: hash, p_challenge: id, p_code_hash: digest });
  assertEquals(result.error, null);
  return { phoneHash: hash, challengeId: id, digest };
}
async function finish(db: TestClient, fixture: Fixture, accepted: boolean) {
  const result = await db.rpc('bazgo_finish_otp_send', { p_phone_hash: fixture.phoneHash, p_challenge: fixture.challengeId, p_accepted: accepted });
  assertEquals(result.error, null);
  return result.data;
}
async function consume(db: TestClient, fixture: Fixture, digest = fixture.digest) {
  const result = await db.rpc('bazgo_consume_otp_challenge', { p_phone_hash: fixture.phoneHash, p_challenge: fixture.challengeId, p_code_hash: digest });
  assertEquals(result.error, null);
  return result.data;
}
Deno.test({ name: 'Pending and failed deliveries cannot authorize login', ignore: !enabled, fn: async () => {
  const db = client();
  const pending = await begin(db);
  assertEquals(await consume(db, pending), 'expired');
  assertEquals(await finish(db, pending, true), true);
  assertEquals(await consume(db, pending), 'approved');
  const failed = await begin(db);
  assertEquals(await finish(db, failed, false), true);
  assertEquals(await finish(db, failed, true), false);
  assertEquals(await consume(db, failed), 'expired');
} });
Deno.test({ name: 'Five incorrect attempts lock even the correct code', ignore: !enabled, fn: async () => {
  const db = client();
  const fixture = await begin(db);
  assertEquals(await finish(db, fixture, true), true);
  const wrong = await hashOtp('synthetic-test-secret', fixture.phoneHash, fixture.challengeId, '123457');
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assertEquals(await consume(db, fixture, wrong), attempt < 5 ? 'incorrect' : 'locked');
  }
  assertEquals(await consume(db, fixture), 'locked');
} });
Deno.test({ name: 'Simultaneous checks approve once and reject replay', ignore: !enabled, fn: async () => {
  const db = client();
  const fixture = await begin(db);
  assertEquals(await finish(db, fixture, true), true);
  const outcomes = await Promise.all([consume(db, fixture), consume(db, fixture)]);
  assertEquals(outcomes.filter((outcome) => outcome === 'approved').length, 1);
  assertEquals(outcomes.filter((outcome) => outcome === 'expired').length, 1);
  assertEquals(await consume(db, fixture), 'expired');
} });
Deno.test({ name: 'Resending invalidates the old code and ignores stale send completion', ignore: !enabled, fn: async () => {
  const db = client();
  const old = await begin(db);
  assertEquals(await finish(db, old, true), true);
  const replacement = await begin(db, old.phoneHash);
  assertEquals(await finish(db, old, true), false);
  assertEquals(await consume(db, old), 'expired');
  assertEquals(await finish(db, replacement, true), true);
  assertEquals(await consume(db, replacement), 'approved');
} });
Deno.test({ name: 'Server rejects expired OTP without a client timer or scheduler', ignore: !enabled || Deno.env.get('TEST_SLOW_OTP_EXPIRY') !== 'true', fn: async () => {
  const db = client();
  const fixture = await begin(db);
  assertEquals(await finish(db, fixture, true), true);
  await new Promise((resolve) => setTimeout(resolve, 301000));
  assertEquals(await consume(db, fixture), 'expired');
} });
