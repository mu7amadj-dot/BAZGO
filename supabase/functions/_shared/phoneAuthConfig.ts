// Server-only configuration validation. Diagnostics contain names and reasons, never values.
export type PhoneAuthVariable = 'TWILIO_ACCOUNT_SID' | 'TWILIO_AUTH_TOKEN' | 'TWILIO_VERIFY_SERVICE_SID' | 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY';
export interface PhoneAuthConfig {
  accountSid: string;
  authToken: string;
  serviceSid: string;
  backendUrl: string;
  serviceKey: string;
  anonKey: string;
}
export interface PhoneAuthConfigIssue { variable: PhoneAuthVariable; reason: 'missing' | 'invalid_format'; }
export type PhoneAuthConfigResult = { ok: true; config: PhoneAuthConfig } | { ok: false; issues: PhoneAuthConfigIssue[] };

export function loadPhoneAuthConfig(readEnv: (name: PhoneAuthVariable) => string | undefined): PhoneAuthConfigResult {
  const fields: { variable: PhoneAuthVariable; field: keyof PhoneAuthConfig; pattern?: RegExp }[] = [
    { variable: 'TWILIO_ACCOUNT_SID', field: 'accountSid', pattern: /^AC[0-9a-f]{32}$/i },
    { variable: 'TWILIO_AUTH_TOKEN', field: 'authToken' },
    { variable: 'TWILIO_VERIFY_SERVICE_SID', field: 'serviceSid', pattern: /^VA[0-9a-f]{32}$/i },
    { variable: 'SUPABASE_URL', field: 'backendUrl' },
    { variable: 'SUPABASE_SERVICE_ROLE_KEY', field: 'serviceKey' },
    { variable: 'SUPABASE_ANON_KEY', field: 'anonKey' },
  ];
  const config: PhoneAuthConfig = { accountSid: '', authToken: '', serviceSid: '', backendUrl: '', serviceKey: '', anonKey: '' };
  const issues: PhoneAuthConfigIssue[] = [];
  for (const { variable, field, pattern } of fields) {
    const value = (readEnv(variable) ?? '').trim();
    config[field] = value;
    if (!value) issues.push({ variable, reason: 'missing' });
    else if (pattern && !pattern.test(value)) issues.push({ variable, reason: 'invalid_format' });
  }
  // Invalid results deliberately omit configuration so they are safe to use as diagnostics.
  return issues.length ? { ok: false, issues } : { ok: true, config };
}

export function phoneAuthConfigMessage(issues: PhoneAuthConfigIssue[]): string {
  const missing = issues.filter((issue) => issue.variable.startsWith('TWILIO_') && issue.reason === 'missing');
  if (missing.length) return `إعدادات SMS ناقصة: ${missing.map((issue) => issue.variable).join('، ')}. أضفها بأمان في Cloud ← Secrets ثم أعد المحاولة.`;
  const invalid = issues.find((issue) => issue.variable.startsWith('TWILIO_') && issue.reason === 'invalid_format');
  if (invalid?.variable === 'TWILIO_VERIFY_SERVICE_SID') return 'TWILIO_VERIFY_SERVICE_SID غير صحيح. انسخ Service SID الذي يبدأ بـ VA من Twilio ← Verify ← Services، دون علامات اقتباس.';
  if (invalid?.variable === 'TWILIO_ACCOUNT_SID') return 'TWILIO_ACCOUNT_SID غير صحيح. انسخ Account SID الذي يبدأ بـ AC من لوحة Twilio، دون علامات اقتباس.';
  return 'إعدادات المصادقة على الخادم غير مكتملة. على إدارة التطبيق مراجعة سجل bazgo-phone-auth وإعدادات Edge Functions.';
}
