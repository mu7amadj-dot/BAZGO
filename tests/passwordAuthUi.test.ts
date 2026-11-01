// deno test --allow-read tests/passwordAuthUi.test.ts
// Static source contracts only; no React rendering, credentials, SMS or live users.
import { assert } from 'jsr:@std/assert@1';
const source = (path: string) => Deno.readTextFile(new URL(`../${path}`, import.meta.url));

Deno.test('Existing-account submit calls password login, not SMS or OTP verification', async () => {
  const hook = await source('hooks/useSecureLogin.ts');
  const start = hook.indexOf("} else if (!codeSent && mode === 'login') {");
  const end = hook.indexOf('} else if (!codeSent) {', start);
  assert(start >= 0 && end > start);
  const loginBranch = hook.slice(start, end);
  assert(loginBranch.includes('await signInPhonePassword(form.phone, password)'));
  assert(!loginBranch.includes('sendCode('));
  assert(!loginBranch.includes('verifyPhoneCode('));
  assert(hook.includes('validatePasswordConfirmation(password, confirmation)'));
  assert(hook.includes("mode === 'recovery' ? 'reset_password' : 'register'"));
});

Deno.test('Password login is server-verified and independent of provider configuration or OTP provisioning', async () => {
  const edge = await source('supabase/functions/bazgo-phone-auth/index.ts');
  assert(edge.includes('{ requireProvider: !passwordLogin && !driverPasswordFinish }'));
  const start = edge.indexOf('    if (passwordLogin) {');
  const end = edge.indexOf('    // Serialize sends', start);
  assert(start >= 0 && end > start);
  const branch = edge.slice(start, end);
  assert(branch.includes('await authenticatePhonePassword(admin, passwordClient, phone, password)'));
  for (const forbidden of ['sendOtpiqCode(', 'bazgo_begin_otp_challenge', 'generateLink(', 'updateUserById(', 'bazgo_claim_phone_session']) assert(!branch.includes(forbidden));
  const verifier = await source('supabase/functions/_shared/phonePassword.ts');
  assert(verifier.includes('sessionClient.auth.signInWithPassword({ email, password })'));
  assert(verifier.includes('result.data.user?.id !== expectedUserId'));
  assert(verifier.includes('user.app_metadata?.bazgo_password_enabled === true'));
});

Deno.test('Setting a password requires consumed OTP, exact verified identity and explicit recovery for overwrite', async () => {
  const edge = await source('supabase/functions/bazgo-phone-auth/index.ts');
  const consumed = edge.indexOf("admin.rpc('bazgo_consume_otp_challenge'");
  const approved = edge.indexOf("approved.data !== 'approved'", consumed);
  const update = edge.indexOf('const passwordUpdate =');
  assert(consumed >= 0 && approved > consumed && update > approved);
  assert(edge.includes("(body.intent === 'register' || driverPhoneVerification) && passwordUser.data.user.app_metadata?.bazgo_password_enabled === true"));
  assert(edge.includes("body.intent === 'reset_password') throw new PublicError(400, 'account_not_found'"));
  assert(edge.includes('normalizeIraqiPhone(passwordUser.data.user.phone) !== phone'));
  assert(edge.includes('bazgo_password_enabled: true'));
});

Deno.test('Password inputs are masked, confirm new passwords and expose an explicit recovery action', async () => {
  const screen = await source('app/login.tsx');
  const fields = await source('components/auth/PasswordFields.tsx');
  const field = await source('components/ui/Field.tsx');
  assert(screen.includes("login.setMode('recovery')"));
  assert(screen.includes('تعيين أو استعادة الرقم السري'));
  assert(screen.includes('password={login.password}'));
  assert(fields.includes('secureTextEntry'));
  assert(fields.includes('تأكيد الرقم السري'));
  assert(fields.includes("confirm ? 'newPassword' : 'password'"));
  assert(field.includes('secureTextEntry={secureTextEntry && !passwordVisible}'));
  assert(field.includes("'إخفاء الرقم السري' : 'إظهار الرقم السري'"));
  const form = await source('services/registrationService.ts');
  assert(!/password|confirmation/.test(form));
  const hook = await source('hooks/useSecureLogin.ts');
  assert(hook.includes("setPasswordValue(''); setConfirmationValue('')"));
  assert(!/AsyncStorage|SecureStore|console\.(log|error)/.test(hook));
});
