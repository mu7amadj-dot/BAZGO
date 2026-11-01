// deno test tests/phoneAuthConfig.test.ts
// Synthetic values only. No credentials, network requests or SMS are required.
import { assertEquals } from 'jsr:@std/assert@1';
import { loadPhoneAuthConfig, phoneAuthConfigMessage } from '../supabase/functions/_shared/phoneAuthConfig.ts';
import type { PhoneAuthVariable } from '../supabase/functions/_shared/phoneAuthConfig.ts';

function makeEnv(): Record<PhoneAuthVariable, string> {
  return {
    OTPIQ_API_KEY: 'synthetic-server-only-otpiq-key',
    SUPABASE_URL: 'https://example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-only-service-key',
    SUPABASE_ANON_KEY: 'synthetic-anon-key',
  };
}
Deno.test('Only OTPIQ and built-in backend settings are read', () => {
  const env = makeEnv();
  const names: PhoneAuthVariable[] = [];
  const result = loadPhoneAuthConfig((name) => { names.push(name); return env[name]; });
  assertEquals(result.ok, true);
  assertEquals(names, Object.keys(env));
});
Deno.test('Copied surrounding whitespace is normalized before configuration checks', () => {
  const env = makeEnv();
  const result = loadPhoneAuthConfig((name) => ` \n${env[name]}\t `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.config.otpiqApiKey, env.OTPIQ_API_KEY);
    assertEquals(result.config.backendUrl, env.SUPABASE_URL);
    assertEquals(result.config.serviceKey, env.SUPABASE_SERVICE_ROLE_KEY);
    assertEquals(result.config.anonKey, env.SUPABASE_ANON_KEY);
  }
});
Deno.test('Every absent or blank setting is identified without returning secret values', () => {
  const env = makeEnv();
  for (const missing of Object.keys(env) as PhoneAuthVariable[]) {
    for (const empty of [undefined, '', ' \n\t ']) {
      const result = loadPhoneAuthConfig((name) => name === missing ? empty : env[name]);
      assertEquals(result.ok, false);
      if (!result.ok) assertEquals(result.issues, [{ variable: missing, reason: 'missing' }]);
      assertEquals('config' in result, false);
      assertEquals(JSON.stringify(result).includes(env.OTPIQ_API_KEY), false);
      assertEquals(JSON.stringify(result).includes(env.SUPABASE_SERVICE_ROLE_KEY), false);
    }
  }
});
Deno.test('Quoted keys and accidentally copied Bearer headers are rejected without disclosure', () => {
  const env = makeEnv();
  for (const invalid of [`"${env.OTPIQ_API_KEY}"`, `Bearer ${env.OTPIQ_API_KEY}`, "'synthetic-key'", 'synthetic\nkey']) {
    const result = loadPhoneAuthConfig((name) => name === 'OTPIQ_API_KEY' ? invalid : env[name]);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.issues, [{ variable: 'OTPIQ_API_KEY', reason: 'invalid_format' }]);
      const message = phoneAuthConfigMessage(result.issues);
      assertEquals(message.includes('OTPIQ_API_KEY'), true);
      assertEquals(message.includes(invalid), false);
      assertEquals(message.includes(env.OTPIQ_API_KEY), false);
    }
  }
});
Deno.test('Password login does not read or require SMS provider credentials', () => {
  const env = makeEnv();
  const names: PhoneAuthVariable[] = [];
  const result = loadPhoneAuthConfig((name) => { names.push(name); return name === 'OTPIQ_API_KEY' ? undefined : env[name]; }, { requireProvider: false });
  assertEquals(result.ok, true);
  assertEquals(names.includes('OTPIQ_API_KEY'), false);
  const missingBackend = loadPhoneAuthConfig(() => undefined, { requireProvider: false });
  assertEquals(missingBackend.ok, false);
});
Deno.test('Provider configuration errors stay separate from backend configuration errors', () => {
  const missing = phoneAuthConfigMessage([{ variable: 'OTPIQ_API_KEY', reason: 'missing' }]);
  assertEquals(missing.includes('OTPIQ_API_KEY'), true);
  const backend = phoneAuthConfigMessage([{ variable: 'SUPABASE_SERVICE_ROLE_KEY', reason: 'missing' }]);
  assertEquals(backend.includes('OTPIQ_API_KEY'), false);
  assertEquals(backend.includes('إعدادات المصادقة'), true);
});
