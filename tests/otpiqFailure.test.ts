// deno test tests/otpiqFailure.test.ts tests/otpiq.test.ts
// Mocked responses only; no SMS, real credentials, network or user changes.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { classifyOtpiqFailure } from '../supabase/functions/_shared/otpiqFailure.ts';
import { OtpiqError, sendOtpiqCode } from '../supabase/functions/_shared/otpiq.ts';

Deno.test('OTPIQ 400 restrictions are distinguished without assuming an app payload defect', () => {
  for (const [body, code] of [
    [{ error: 'Insufficient credit, please add more credit' }, 'insufficient_credit'],
    [{ error: 'Account is in trial mode, you can only send sms to your own phone number' }, 'provider_trial_mode'],
    [{ error: 'Project spending threshold would be exceeded' }, 'provider_spending_limit'],
    [{ error: { message: 'Invalid provider.' } }, 'provider_route_rejected'],
    [{ error: 'Phone must be a valid number without any spaces or special characters.' }, 'provider_phone_rejected'],
    [{ error: 'Invalid Sender ID.' }, 'provider_sender_rejected'],
    [{ error: 'Invalid sms type.' }, 'provider_payload_rejected'],
    [{ error: 'Unrecognized provider rejection' }, 'provider_request_rejected'],
  ] as const) {
    const result = classifyOtpiqFailure(400, body);
    assertEquals(result?.code, code);
    assertEquals(result?.retryAfter, 60);
  }
});
Deno.test('Provider rate limit duration is bounded and credit failures can lack a canCover field', () => {
  assertEquals(classifyOtpiqFailure(429, { waitMinutes: 3 })?.retryAfter, 180);
  assertEquals(classifyOtpiqFailure(429, { waitMinutes: Number.NaN })?.retryAfter, 60);
  assertEquals(classifyOtpiqFailure(429, { waitMinutes: 5000 })?.retryAfter, 3600);
  assertEquals(classifyOtpiqFailure(200, { canCover: false })?.code, 'insufficient_credit');
  assertEquals(classifyOtpiqFailure(200, { smsId: 'task', canCover: true }), null);
});
Deno.test('Only fixed reasons/messages survive a rejection; phone, OTP and secret remain private', async () => {
  const privateMarker = 'synthetic-sensitive-key-07701234567-123456';
  let calls = 0;
  const fake: typeof fetch = async () => {
    calls += 1;
    return Response.json({ error: `Account is in trial mode ${privateMarker}` }, { status: 400 });
  };
  const error = await assertRejects(() => sendOtpiqCode('synthetic-key', '07701234567', '123456', fake), OtpiqError);
  assertEquals(error.code, 'provider_trial_mode');
  assertEquals(error.reason, 'trial_account');
  assertEquals(error.providerStatus, 400);
  assertEquals(error.retryAfter, 60);
  assertEquals(error.message.includes(privateMarker), false);
  assertEquals(JSON.stringify(error).includes(privateMarker), false);
  assertEquals(calls, 1);
});
