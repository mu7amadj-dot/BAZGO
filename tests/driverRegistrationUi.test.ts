// deno test --allow-read tests/driverRegistrationUi.test.ts
// Static contracts, not rendered/device tests. No credentials, OTP or backend writes.
import { assert } from 'jsr:@std/assert@1';
const source = (path: string) => Deno.readTextFile(new URL(`../${path}`, import.meta.url));

Deno.test('Driver UI displays separate names, phone, vehicle, required images and password steps', async () => {
  const ui = await source('components/auth/DriverRegistrationSteps.tsx');
  const names = ui.slice(ui.indexOf('{step === 1 ? <>'), ui.indexOf('</> : step === 2 ? <>'));
  for (const field of ['form.name', 'form.fatherName', 'form.grandfatherName']) assert(names.includes(field));
  for (const field of ['form.phone', 'form.vehicleType', 'form.maxCapacity', '<PasswordFields', '<ImageUpload']) assert(!names.includes(field));
  assert(ui.includes('step === 2 ? <>'));
  assert(ui.includes('textContentType="oneTimeCode"'));
  assert(ui.includes('step === 3 ? <>'));
  assert(ui.includes('form.vehicleType') && ui.includes('form.maxCapacity') && ui.includes('form.province'));
  assert(ui.includes('step === 4 ? <>'));
  for (const field of ['form.driverPhoto', 'form.licensePhoto', 'form.vehiclePhoto']) assert(ui.includes(field));
  assert(ui.includes('جميع الصور إلزامية'));
  assert(ui.includes('<PasswordFields'));
  const screen = await source('app/login.tsx');
  assert(screen.includes('<DriverRegistrationSteps'));
  assert(screen.includes('login.driverStep === 5'));
  assert(screen.includes('title="السابق"'));
  assert(screen.includes('login.previousDriverStep'));
  assert(screen.includes('login.mode, login.driverStep'));
});
Deno.test('Phone is verified before advancing; final step checks all fields, photos and password', async () => {
  const hook = await source('hooks/useSecureLogin.ts');
  const verification = hook.indexOf('await verifyDriverPhoneCode(sentPhone, otp)');
  assert(verification >= 0);
  assert(hook.indexOf('setDriverStep(3)', verification) > verification);
  const photos = hook.indexOf('driverStep === 4');
  const final = hook.indexOf('const verifiedForm =', photos);
  assert(photos >= 0 && final > photos);
  assert(hook.slice(photos, final).includes('validateDriverPhotos(form)'));
  assert(hook.slice(photos, final).includes('validatePasswordConfirmation(password, confirmation)'));
  const password = hook.indexOf('await finishDriverPassword(identity.phone, password)', final);
  const save = hook.indexOf("await booking.setupAccount('driver'", password);
  assert(password > final && save > password);
  assert(hook.includes('preparedDriver.current?.key !== key'));
  assert(hook.includes('fetchPendingDriverRegistration()'));
  assert(hook.includes('if (previousUserId.current && previousUserId.current !== nextUserId)'));
});
Deno.test('Driver final password request is JWT-protected and cannot reset an existing account', async () => {
  const edge = await source('supabase/functions/bazgo-phone-auth/index.ts');
  const start = edge.indexOf('    if (driverPasswordFinish) {');
  const end = edge.indexOf('    if (send) {', start);
  const branch = edge.slice(start, end);
  assert(start >= 0 && end > start);
  assert(branch.includes('admin.auth.getUser(token)'));
  assert(branch.includes('callerIdentity.data?.user_id !== caller.id'));
  assert(branch.includes('!caller.phone_confirmed_at'));
  assert(branch.includes("if (account.data) throw new PublicError(409, 'account_exists'"));
  assert(branch.includes('caller.app_metadata?.bazgo_password_enabled === true'));
  assert(branch.includes('await authenticatePhonePassword(admin, passwordClient, phone, password)'));
  assert(!branch.includes('sendOtpiqCode('));
  assert(!branch.includes('bazgo_consume_otp_challenge'));
  assert(edge.includes('!passwordLogin && !driverPasswordFinish'));
  assert(edge.includes("(body.intent === 'register' || driverPhoneVerification)"));
  const service = await source('services/phoneAuthService.ts');
  const verifyStart = service.indexOf('export async function verifyDriverPhoneCode');
  const verifyEnd = service.indexOf('export async function finishDriverPassword', verifyStart);
  assert(!service.slice(verifyStart, verifyEnd).includes('validatePassword('));
});
Deno.test('Database guard requires three owned stored images, verified phone and password for new drivers only', async () => {
  const migration = await source('supabase/migrations/20261101120000_bazgo_driver_registration.sql');
  assert(migration.includes('before insert on public.bazgo_accounts'));
  assert(!migration.includes('before update'));
  assert(migration.includes("new.role='driver'"));
  assert(migration.includes("array['driverPhoto','licensePhoto','vehiclePhoto']"));
  assert(migration.includes("o.bucket_id='bazgo-profiles'"));
  assert(migration.includes('new.user_id::text'));
  assert(migration.includes('public.bazgo_phone_identities'));
  assert(migration.includes("bazgo_password_enabled'='true'"));
});
