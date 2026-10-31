// deno test tests/otpChallenge.test.ts
// Pure cryptography/generation tests. Synthetic keys only; never sends SMS.
import { assertEquals, assertNotEquals, assertRejects } from 'jsr:@std/assert@1';
import { generateOtp, hashOtp, otpCodeLength, otpExpiresIn, otpResendAfter } from '../supabase/functions/_shared/otpChallenge.ts';

Deno.test('OTP generation retains leading zeros and rejects biased random values', () => {
  assertEquals(generateOtp((values) => { values[0] = 0; return values; }), '000000');
  let calls = 0;
  const code = generateOtp((values) => { values[0] = calls++ === 0 ? 0xffffffff : 7; return values; });
  assertEquals(code, '000007');
  assertEquals(calls, 2);
  assertEquals(otpCodeLength, 6);
  assertEquals(otpExpiresIn, 300);
  assertEquals(otpResendAfter, 60);
});
Deno.test('OTP digest is secret-keyed and bound to both phone and unique challenge', async () => {
  const phoneHash = '1'.repeat(64);
  const id = '00000000-0000-4000-8000-000000000001';
  const digest = await hashOtp('synthetic-key', phoneHash, id, '123456');
  assertEquals(digest.length, 64);
  assertEquals(digest, await hashOtp('synthetic-key', phoneHash, id, '123456'));
  assertNotEquals(digest, await hashOtp('different-synthetic-key', phoneHash, id, '123456'));
  assertNotEquals(digest, await hashOtp('synthetic-key', '2'.repeat(64), id, '123456'));
  assertNotEquals(digest, await hashOtp('synthetic-key', phoneHash, '00000000-0000-4000-8000-000000000002', '123456'));
  assertNotEquals(digest, await hashOtp('synthetic-key', phoneHash, id, '123457'));
});
Deno.test('Digest generation rejects empty secrets and invalid challenge inputs', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  await assertRejects(() => hashOtp('', '1'.repeat(64), id, '123456'));
  await assertRejects(() => hashOtp('synthetic-key', 'invalid', id, '123456'));
  await assertRejects(() => hashOtp('synthetic-key', '1'.repeat(64), 'invalid', '123456'));
  await assertRejects(() => hashOtp('synthetic-key', '1'.repeat(64), id, '1234'));
});
