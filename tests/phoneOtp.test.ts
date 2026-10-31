// deno test tests/phoneOtp.test.ts
// Pure validation tests; no SMS sent and no credentials required.
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { normalizeIraqiPhone, validateOtp, sha256 } from '../supabase/functions/_shared/phoneOtp.ts';
Deno.test('Iraqi phone input normalizes local, international and Arabic digits', () => {
  for (const phone of ['07701234567', '+9647701234567', '9647701234567', '009647701234567', '٠٧٧٠١٢٣٤٥٦٧', '۰۷۷۰۱۲۳۴۵۶۷', '0770 123 4567']) {
    assertEquals(normalizeIraqiPhone(phone), '+9647701234567');
  }
});
Deno.test('Invalid, non-Iraqi and oversized phone input is rejected', () => {
  for (const phone of ['', '+15551234567', '0770123', 'abc07701234567', null, '0'.repeat(100)]) assertThrows(() => normalizeIraqiPhone(phone));
});
Deno.test('OTP validation permits exactly six digits including leading zeros', () => {
  assertEquals(validateOtp('123456'), '123456');
  assertEquals(validateOtp('000001'), '000001');
  for (const code of ['', '123', '1234', '1234567', '12345678901', '12x456', 123456, null]) assertThrows(() => validateOtp(code));
});
Deno.test('Rate-limit and provisioning keys are fixed hashes', async () => {
  const hash = await sha256('+9647701234567');
  assertEquals(hash.length, 64);
  assertEquals(hash, await sha256('+9647701234567'));
});
