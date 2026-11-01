// Interpret provider failures into fixed, safe diagnostics. Never return the raw body/message.
export interface OtpiqFailure {
  status: number;
  code: string;
  message: string;
  retryAfter: number;
  reason: string;
}
export function classifyOtpiqFailure(status: number, details: Record<string, unknown>): OtpiqFailure | null {
  if (status >= 200 && status < 300 && !details.error && details.canCover !== false) return null;
  const nested = details.error && typeof details.error === 'object' ? details.error as Record<string, unknown> : {};
  const text = [details.error, nested.message, details.message].filter((value): value is string => typeof value === 'string').join(' ').slice(0, 4096).toLowerCase();
  const failure = (code: string, reason: string, message: string, publicStatus = 503, retryAfter = 60): OtpiqFailure => ({ status: publicStatus, code, reason, message, retryAfter });
  if (status === 429) {
    const waitMinutes = typeof details.waitMinutes === 'number' ? details.waitMinutes : 0;
    const retryAfter = Math.min(3600, Math.max(60, Number.isFinite(waitMinutes) ? Math.ceil(waitMinutes * 60) : 60));
    return failure('provider_rate_limit', 'provider_rate_limit', 'OTPIQ: تم تجاوز حد إرسال الرسائل. انتظر المدة المحددة ثم أعد المحاولة.', 429, retryAfter);
  }
  if (status === 402 || details.canCover === false || /\binsufficient (?:credit|balance|funds)\b/.test(text)) return failure('insufficient_credit', 'insufficient_credit', 'OTPIQ: رصيد إرسال SMS غير كافٍ. يجب شحن رصيد مشروع OTPIQ قبل إرسال رموز التسجيل.');
  if (/\btrial (?:mode|account)\b|\baccount\b.*\bin trial\b/.test(text)) return failure('provider_trial_mode', 'trial_account', 'OTPIQ: الحساب في الوضع التجريبي ولا يسمح بالإرسال لأرقام المستخدمين. يجب شحن الرصيد وتفعيل الإرسال الحقيقي في لوحة OTPIQ.');
  if (/\bspending threshold\b|\bspending limit\b/.test(text)) return failure('provider_spending_limit', 'spending_threshold', 'OTPIQ: تم بلوغ حد الإنفاق للمشروع. يجب مراجعة حد الإنفاق في لوحة OTPIQ قبل إعادة الإرسال.');
  if (status === 401 || status === 403) return failure('sms_unavailable', 'provider_authorization', 'OTPIQ: على الإدارة مراجعة صلاحية مفتاح API وأذونات إرسال SMS.');
  if (status === 400 || status === 422) {
    if (/\bsender\s*id\b|\bsenderid\b/.test(text)) return failure('provider_sender_rejected', 'sender_id_rejected', 'OTPIQ: رفض إعداد اسم مرسل SMS. راجع اسم المرسل المعتمد في لوحة OTPIQ؛ لا نغيّر قناة الإرسال تلقائياً.');
    if (/\bphone\b|\bphone(number|_number)\b/.test(text)) return failure('provider_phone_rejected', 'phone_rejected', 'OTPIQ: رفض رقم الهاتف أو الإرسال إليه. راجع الرقم وصلاحية إرسال SMS للعراق في لوحة OTPIQ.', 400);
    if (/\bprovider\b|\bsms route\b/.test(text)) return failure('provider_route_rejected', 'sms_route_rejected', 'OTPIQ: رفض مسار SMS. يجب تفعيل إرسال SMS للمشروع في لوحة OTPIQ؛ لن نرسل عبر واتساب بدلاً منه دون اختيارك.');
    if (/\bverification code\b|\bsms type\b|\bsmstype\b/.test(text)) return failure('provider_payload_rejected', 'verification_payload_rejected', 'OTPIQ: رفض صيغة طلب رمز التحقق. استخدم رقم مرجع الخطأ لمراجعة سجل الخادم.');
    return failure('provider_request_rejected', 'provider_validation_rejected', 'OTPIQ: رفض طلب إرسال SMS. راجع حالة المشروع والرصيد وحد الإنفاق في لوحة OTPIQ، وأرسل مرجع الخطأ للمراجعة.');
  }
  return failure('provider_failed', 'provider_http_failure', 'OTPIQ: لم يُقبل طلب إرسال رمز SMS. أعد المحاولة لاحقاً.', 502);
}
