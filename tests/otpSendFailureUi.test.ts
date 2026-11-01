// deno test --allow-read tests/otpSendFailureUi.test.ts
// Static contracts only, not a rendered/device test or SMS delivery verification.
import { assert } from 'jsr:@std/assert@1';
const source = (path: string) => Deno.readTextFile(new URL(`../${path}`, import.meta.url));
Deno.test('Failed SMS requests clear the unusable challenge UI and display the server cooldown', async () => {
  const hook = await source('hooks/useSecureLogin.ts');
  const start = hook.indexOf('  const handleError =');
  const end = hook.indexOf('  const sendCode =', start);
  const handler = hook.slice(start, end);
  assert(handler.includes("issue.code.startsWith('provider_')"));
  assert(handler.includes("setCodeSent(false); setOtpValue(''); setSentPhone(''); setExpiresAt(0)"));
  assert(handler.includes('issue.retryAfter * 1000'));
  assert(handler.includes('setResendAt'));
  const steps = await source('components/auth/DriverRegistrationSteps.tsx');
  assert(steps.includes('يمكن طلب رمز جديد بعد'));
  const screen = await source('app/login.tsx');
  assert(screen.includes('إرسال الرمز بعد ${login.seconds} ثانية'));
  assert(screen.includes('مرجع الخطأ: ${login.errorReference}'));
  assert(screen.includes('login.seconds > 0 || (registration && !login.role)'));
});
Deno.test('Provider rejection keeps OTP fail-closed and diagnostics do not include response bodies', async () => {
  const edge = await source('supabase/functions/bazgo-phone-auth/index.ts');
  assert(edge.includes("if (!activated)"));
  assert(edge.includes('p_accepted: false'));
  assert(edge.includes('reason: issue.reason'));
  assert(!edge.includes('console.error(issue)'));
  const adapter = await source('supabase/functions/_shared/otpiq.ts');
  assert(adapter.includes("provider: 'sms'"));
  assert(adapter.includes('classifyOtpiqFailure(response.status, details)'));
  assert(!adapter.includes("provider: 'whatsapp-sms'"));
});
