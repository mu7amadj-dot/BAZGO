// deno test tests/phoneAuthConfig.test.ts
// Synthetic values only. No credentials, network requests or SMS are required.
import { assertEquals } from 'jsr:@std/assert@1';
import { loadPhoneAuthConfig, phoneAuthConfigMessage } from '../supabase/functions/_shared/phoneAuthConfig.ts';
import type { PhoneAuthVariable } from '../supabase/functions/_shared/phoneAuthConfig.ts';

function makeEnv(): Record<PhoneAuthVariable, string> {
  return {
    TWILIO_ACCOUNT_SID: `AC${'1'.repeat(32)}`,
    TWILIO_AUTH_TOKEN: 'synthetic-server-only-token',
    TWILIO_VERIFY_SERVICE_SID: `VA${'2'.repeat(32)}`,
    SUPABASE_URL: 'https://example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-only-service-key',
    SUPABASE_ANON_KEY: 'synthetic-anon-key',
  };
}

Deno.test('Copied surrounding whitespace is normalized before configuration checks', () => {
  const env = makeEnv();
  const result = loadPhoneAuthConfig((name) => ` \n${env[name]}\t `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.config.accountSid, env.TWILIO_ACCOUNT_SID);
    assertEquals(result.config.authToken, env.TWILIO_AUTH_TOKEN);
    assertEquals(result.config.serviceSid, env.TWILIO_VERIFY_SERVICE_SID);
    assertEquals(result.config.backendUrl, env.SUPABASE_URL);
    assertEquals(result.config.serviceKey, env.SUPABASE_SERVICE_ROLE_KEY);
    assertEquals(result.config.anonKey, env.SUPABASE_ANON_KEY);
  }
});

Deno.test('Every absent or blank variable is identified without returning secret values', () => {
  const env = makeEnv();
  for (const missing of Object.keys(env) as PhoneAuthVariable[]) {
    for (const empty of [undefined, '', ' \n\t ']) {
      const result = loadPhoneAuthConfig((name) => name === missing ? empty : env[name]);
      assertEquals(result.ok, false);
      if (!result.ok) assertEquals(result.issues, [{ variable: missing, reason: 'missing' }]);
      assertEquals('config' in result, false);
      assertEquals(JSON.stringify(result).includes(env.TWILIO_AUTH_TOKEN), false);
      assertEquals(JSON.stringify(result).includes(env.SUPABASE_SERVICE_ROLE_KEY), false);
    }
  }
});

Deno.test('Wrong SID prefixes, lengths and quoted SID values remain rejected', () => {
  for (const variable of ['TWILIO_ACCOUNT_SID', 'TWILIO_VERIFY_SERVICE_SID'] as const) {
    const env = makeEnv();
    for (const invalid of ['VS' + '1'.repeat(32), 'AC123', `"${env[variable]}"`]) {
      const result = loadPhoneAuthConfig((name) => name === variable ? invalid : env[name]);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.issues, [{ variable, reason: 'invalid_format' }]);
        const message = phoneAuthConfigMessage(result.issues);
        assertEquals(message.includes(variable), true);
        assertEquals(message.includes(invalid), false);
        assertEquals(message.includes(env.TWILIO_AUTH_TOKEN), false);
      }
    }
  }
});

Deno.test('Missing Twilio settings name all affected variables; backend failures stay separate', () => {
  const message = phoneAuthConfigMessage([
    { variable: 'TWILIO_ACCOUNT_SID', reason: 'missing' },
    { variable: 'TWILIO_VERIFY_SERVICE_SID', reason: 'missing' },
  ]);
  assertEquals(message.includes('TWILIO_ACCOUNT_SID'), true);
  assertEquals(message.includes('TWILIO_VERIFY_SERVICE_SID'), true);
  const backend = phoneAuthConfigMessage([{ variable: 'SUPABASE_SERVICE_ROLE_KEY', reason: 'missing' }]);
  assertEquals(backend.includes('TWILIO_'), false);
  assertEquals(backend.includes('إعدادات المصادقة'), true);
});
