// deno test tests/otpiq.test.ts tests/otpChallenge.test.ts
// Fake provider responses only: no network or SMS and no real credentials.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { OtpiqError, sendOtpiqCode } from '../supabase/functions/_shared/otpiq.ts';

Deno.test('OTPIQ receives the exact SMS-only verification payload and server Bearer header', async () => {
  let calls = 0;
  const fake: typeof fetch = async (input, init) => {
    calls += 1;
    assertEquals(String(input), 'https://api.otpiq.com/api/sms');
    assertEquals(init?.method, 'POST');
    assertEquals(init?.redirect, 'error');
    assertEquals(new Headers(init?.headers).get('Authorization'), 'Bearer synthetic-key');
    assertEquals(JSON.parse(String(init?.body)), { phoneNumber: '9647701234567', smsType: 'verification', verificationCode: '000001', provider: 'sms' });
    return Response.json({ smsId: 'sms-synthetic-task-id', canCover: true, remainingCredit: 1000 });
  };
  assertEquals(await sendOtpiqCode('synthetic-key', '٠٧٧٠١٢٣٤٥٦٧', '000001', fake), undefined);
  assertEquals(calls, 1);
});
Deno.test('Provider errors are sanitized and never auto-retried or treated as sent', async () => {
  for (const [status, body, expected] of [
    [401, { error: 'raw-secret-phone-and-code' }, 'sms_unavailable'],
    [403, { error: 'raw-secret-phone-and-code' }, 'sms_unavailable'],
    [429, { error: 'raw-secret-phone-and-code' }, 'provider_rate_limit'],
    [400, { canCover: false, error: 'raw-secret-phone-and-code' }, 'insufficient_credit'],
    [500, { error: 'raw-secret-phone-and-code' }, 'provider_failed'],
    [200, { message: 'raw-secret-phone-and-code' }, 'provider_failed'],
    [200, { smsId: 'task', error: 'raw-secret-phone-and-code' }, 'provider_failed'],
  ] as const) {
    let calls = 0;
    const fake: typeof fetch = async () => { calls += 1; return Response.json(body, { status }); };
    const error = await assertRejects(() => sendOtpiqCode('synthetic-key', '07701234567', '123456', fake), OtpiqError);
    assertEquals(error.code, expected);
    assertEquals(error.message.includes('raw-secret-phone-and-code'), false);
    assertEquals(error.message.includes('synthetic-key'), false);
    assertEquals(calls, 1);
  }
});
Deno.test('Timeout/network errors fail closed without forwarding exceptions', async () => {
  const fake: typeof fetch = async () => { throw new Error('raw-secret-phone-and-code'); };
  const error = await assertRejects(() => sendOtpiqCode('synthetic-key', '07701234567', '123456', fake), OtpiqError);
  assertEquals(error.code, 'provider_unreachable');
  assertEquals(error.message.includes('raw-secret-phone-and-code'), false);
});
Deno.test('Malformed inputs never reach the provider adapter fetch', async () => {
  const fake: typeof fetch = async () => { throw new Error('should_not_fetch'); };
  const phone = await assertRejects(() => sendOtpiqCode('synthetic-key', 'invalid', '123456', fake));
  assertEquals(phone.message, 'invalid_phone');
  const code = await assertRejects(() => sendOtpiqCode('synthetic-key', '07701234567', '1234', fake));
  assertEquals(code.message, 'invalid_code');
});
