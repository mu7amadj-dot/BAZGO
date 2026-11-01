// deno test tests/phonePassword.test.ts
// Pure validation and mock Auth tests. No SMS, credentials or real users.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { authenticatePhonePassword, validatePhonePassword } from '../supabase/functions/_shared/phonePassword.ts';
import { passwordByteLength, validatePassword, validatePasswordConfirmation } from '../services/passwordValidation.ts';

Deno.test('Password rules preserve the exact secret and agree across client and server', () => {
  for (const password of ['001234', '  valid password  ', 'كلمةسرآمنة', 'a'.repeat(72), 'ع'.repeat(36)]) {
    assertEquals(validatePassword(password), password);
    assertEquals(validatePhonePassword(password), password);
    validatePasswordConfirmation(password, password);
  }
  for (const password of ['', '12345', '      ', 'a'.repeat(73), 'ع'.repeat(37)]) {
    assertThrows(() => validatePassword(password));
    assertThrows(() => validatePhonePassword(password));
  }
  assertEquals(passwordByteLength('ع'.repeat(36)), 72);
  assertThrows(() => validatePasswordConfirmation('123456', '654321'));
  assertThrows(() => validatePhonePassword(null));
});

function clients(options: { identity?: boolean; enabled?: boolean; phone?: string; confirmed?: boolean; returnedUser?: string; rejected?: boolean } = {}) {
  const calls: { email: string; password: string }[] = [];
  const admin = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ error: null, data: options.identity === false ? null : { user_id: 'existing-user' } }) }) }) }),
    auth: { admin: { getUserById: async () => ({ error: null, data: { user: { id: 'existing-user', email: 'internal@phone.bazgo.invalid', phone: options.phone ?? '+9647701234567', phone_confirmed_at: options.confirmed === false ? null : 'verified', app_metadata: { bazgo_password_enabled: options.enabled !== false } } } }) } },
  } as unknown as SupabaseClient;
  const sessionClient = {
    auth: { signInWithPassword: async (credentials: { email: string; password: string }) => {
      calls.push(credentials);
      return { error: options.rejected ? new Error('invalid credentials') : null, data: { user: { id: options.returnedUser ?? 'existing-user' }, session: { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' } } };
    } },
  } as unknown as SupabaseClient;
  return { admin, sessionClient, calls };
}
Deno.test('Existing verified account uses normal password Auth, returning only its ordinary session', async () => {
  const fixture = clients();
  const result = await authenticatePhonePassword(fixture.admin, fixture.sessionClient, '+9647701234567', '001234');
  assertEquals(fixture.calls, [{ email: 'internal@phone.bazgo.invalid', password: '001234' }]);
  assertEquals(result, { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' });
});
Deno.test('Unknown, legacy, unverified and mismatched phone accounts fail closed without provisioning', async () => {
  for (const options of [{ identity: false }, { enabled: false }, { confirmed: false }, { phone: '+9647711234567' }]) {
    const fixture = clients(options);
    assertEquals(await authenticatePhonePassword(fixture.admin, fixture.sessionClient, '+9647701234567', '001234'), null);
    assertEquals(fixture.calls.length, 1);
    assertEquals(fixture.calls[0].email, 'unavailable-password-login@phone.bazgo.invalid');
  }
});
Deno.test('Wrong credentials and a session for a different user are never accepted', async () => {
  for (const options of [{ rejected: true }, { returnedUser: 'different-user' }]) {
    const fixture = clients(options);
    assertEquals(await authenticatePhonePassword(fixture.admin, fixture.sessionClient, '+9647701234567', '001234'), null);
  }
});
