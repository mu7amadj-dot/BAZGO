// deno test --allow-read tests/registrationUi.test.ts
// Static source-contract checks only; these do not simulate React, send SMS or create accounts.
import { assert } from 'jsr:@std/assert@1';

const readSource = (path: string) => Deno.readTextFile(new URL(`../${path}`, import.meta.url));

Deno.test('Default registration exposes role selection and the shared details component before OTP', async () => {
  const screen = await readSource('app/login.tsx');
  const hook = await readSource('hooks/useSecureLogin.ts');
  assert(hook.includes("useState<'register' | 'login' | 'recovery'>('register')"));
  assert(screen.includes('<AccountTypePicker'));
  assert(screen.includes('login.role ? <>'));
  assert(screen.includes('<RegistrationDetails'));
  assert(screen.includes("login.setMode('login')"));
  assert(screen.includes('login.user && login.account'));
  assert(screen.includes('حفظ الحساب الحقيقي والمتابعة'));
});

Deno.test('Role details preserve every merchant/driver field and all three image attachments', async () => {
  const details = await readSource('components/auth/RegistrationDetails.tsx');
  for (const field of ['name', 'phone', 'province', 'companyName', 'location', 'fatherName', 'grandfatherName', 'vehicleType', 'maxCapacity', 'driverPhoto', 'licensePhoto', 'vehiclePhoto']) {
    assert(details.includes(`form.${field}`), `Missing registration field: ${field}`);
  }
  assert(details.includes('items={provinceItems}'));
  assert(details.includes('items={vehicleItems}'));
  assert(details.includes('!disabled && !verifiedPhone'));
});

Deno.test('Registration validates before sending and requires a verified identity before profile uploads', async () => {
  const hook = await readSource('hooks/useSecureLogin.ts');
  const validation = hook.indexOf('prepareRegistration(role, form);');
  const sending = hook.indexOf('await sendCode();', validation);
  const guard = hook.indexOf('if (!identity.phone) throw');
  const upload = hook.indexOf('await prepareServerProfile', guard);
  assert(validation >= 0 && sending > validation);
  assert(guard >= 0 && upload > guard);
  assert(hook.includes('phone: identity.phone }'));
  assert(hook.includes('await booking.setupAccount(role, account.name, account.profile)'));
  assert(hook.includes('if (booking.account) return;'));
});

Deno.test('The draft reset is guarded against clearing the anonymous-to-authenticated transition', async () => {
  const hook = await readSource('hooks/useSecureLogin.ts');
  assert(hook.includes('if (previousUserId.current && previousUserId.current !== nextUserId)'));
  assert(hook.includes('previousUserId.current = nextUserId;'));
  assert(hook.includes("await verifyPhoneCode(sentPhone, otp, password, mode === 'recovery' ? 'reset_password' : 'register')"));
  assert(!hook.includes('identity.phone || form.phone'));
  assert(!hook.includes('prepareDemoRegistration'));
});
