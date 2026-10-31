// Edge Functions only. Diagnostics contain variable names and reasons, never secret values.
export type PhoneAuthVariable = 'OTPIQ_API_KEY' | 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY';
export interface PhoneAuthConfig {
  otpiqApiKey: string;
  backendUrl: string;
  serviceKey: string;
  anonKey: string;
}
export interface PhoneAuthConfigIssue { variable: PhoneAuthVariable; reason: 'missing' | 'invalid_format'; }
export type PhoneAuthConfigResult = { ok: true; config: PhoneAuthConfig } | { ok: false; issues: PhoneAuthConfigIssue[] };

export function loadPhoneAuthConfig(readEnv: (name: PhoneAuthVariable) => string | undefined): PhoneAuthConfigResult {
  const fields: { variable: PhoneAuthVariable; field: keyof PhoneAuthConfig; pattern?: RegExp }[] = [
    { variable: 'OTPIQ_API_KEY', field: 'otpiqApiKey', pattern: /^[^\s"']+$/ },
    { variable: 'SUPABASE_URL', field: 'backendUrl' },
    { variable: 'SUPABASE_SERVICE_ROLE_KEY', field: 'serviceKey' },
    { variable: 'SUPABASE_ANON_KEY', field: 'anonKey' },
  ];
  const config: PhoneAuthConfig = { otpiqApiKey: '', backendUrl: '', serviceKey: '', anonKey: '' };
  const issues: PhoneAuthConfigIssue[] = [];
  for (const { variable, field, pattern } of fields) {
    const value = (readEnv(variable) ?? '').trim();
    config[field] = value;
    if (!value) issues.push({ variable, reason: 'missing' });
    else if (pattern && !pattern.test(value)) issues.push({ variable, reason: 'invalid_format' });
  }
  return issues.length ? { ok: false, issues } : { ok: true, config };
}

export function phoneAuthConfigMessage(issues: PhoneAuthConfigIssue[]): string {
  const provider = issues.find((issue) => issue.variable === 'OTPIQ_API_KEY');
  if (provider?.reason === 'missing') return 'إعدادات SMS ناقصة: OTPIQ_API_KEY. أضف مفتاح OTPIQ بأمان في Cloud ← Secrets ثم أعد المحاولة.';
  if (provider) return 'صيغة OTPIQ_API_KEY غير صحيحة. أدخل المفتاح من لوحة OTPIQ دون علامات اقتباس أو كلمة Bearer في Cloud ← Secrets.';
  return 'إعدادات المصادقة على الخادم غير مكتملة. على إدارة التطبيق مراجعة سجل bazgo-phone-auth وإعدادات Edge Functions.';
}
