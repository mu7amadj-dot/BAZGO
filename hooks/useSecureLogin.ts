import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/template';
import { useBooking } from './useBooking';
import { useVerifiedPhone } from './useVerifiedPhone';
import { PROVINCES, VEHICLES } from '@/constants/config';
import type { UserRole } from '@/services/types';
import { emptyRegistrationForm, normalizeDigits, type RegistrationForm } from '@/services/registrationService';
import { prepareServerProfile } from '@/services/accountProfileService';
import { PhoneAuthError, sendPhoneCode, verifyPhoneCode } from '@/services/phoneAuthService';

export function useSecureLogin() {
  const auth = useAuth();
  const booking = useBooking();
  const identity = useVerifiedPhone();
  const [phone, setPhone] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [otp, setOtpValue] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [codeSent, setCodeSent] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [form, setForm] = useState<RegistrationForm>({ ...emptyRegistrationForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const pending = useRef(false);
  const operationLoading = auth.operationLoading || busy;
  const provinceItems = useMemo(() => PROVINCES.map((name) => ({ id: name, label: name, icon: 'map-marker-outline' })), []);
  const vehicleItems = useMemo(() => VEHICLES.map((vehicle) => ({ id: vehicle.id, label: vehicle.label, icon: vehicle.icon, meta: `حتى ${vehicle.capacity} طن` })), []);
  const setField = useCallback((field: keyof RegistrationForm, value: string) => setForm((current) => ({ ...current, [field]: value })), []);
  const setOtp = useCallback((value: string) => setOtpValue(normalizeDigits(value).replace(/\D/g, '').slice(0, codeLength)), [codeLength]);
  useEffect(() => {
    setRole(null); setForm({ ...emptyRegistrationForm }); setError(''); setNotice('');
  }, [auth.user?.id]);
  useEffect(() => {
    if (identity.phone) setForm((current) => ({ ...current, phone: identity.phone }));
  }, [identity.phone]);
  useEffect(() => {
    const update = () => {
      setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
      setExpiresIn(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [resendAt, expiresAt]);
  const handleError = useCallback((issue: unknown) => {
    setError(issue instanceof Error ? issue.message : 'تعذر إكمال العملية.');
    if (issue instanceof PhoneAuthError && issue.retryAfter > 0) setResendAt((current) => Math.max(current, Date.now() + issue.retryAfter * 1000));
  }, []);
  const sendCode = useCallback(async () => {
    const result = await sendPhoneCode(phone);
    if (!result.sent || !Number.isInteger(result.codeLength) || result.codeLength < 4 || result.codeLength > 10) throw new Error('استجابة خدمة SMS غير صالحة.');
    setSentPhone(result.phone); setCodeLength(result.codeLength); setCodeSent(true); setOtpValue('');
    setResendAt(Date.now() + Math.max(60, result.retryAfter) * 1000);
    setExpiresAt(Date.now() + result.expiresIn * 1000);
    setNotice('تم إرسال رمز التحقق عبر SMS إلى رقم هاتفك.');
  }, [phone]);
  const submit = useCallback(async () => {
    if (pending.current || operationLoading || auth.loading || booking.loading || identity.loading) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (auth.user) {
        if (booking.syncError || identity.error) throw new Error('أعد تحميل الحساب قبل المتابعة.');
        if (!role) throw new Error('اختر نوع الحساب أولاً.');
        const account = await prepareServerProfile(role, { ...form, phone: identity.phone || form.phone }, auth.user.id);
        await booking.setupAccount(role, account.name, account.profile);
      } else if (!codeSent) {
        if (Date.now() < resendAt) throw new PhoneAuthError('انتظر قبل طلب رمز آخر.', Math.ceil((resendAt - Date.now()) / 1000));
        await sendCode();
      } else {
        if (Date.now() >= expiresAt) throw new PhoneAuthError('انتهت صلاحية الرمز. أرسل رمزاً جديداً.');
        if (otp.length !== codeLength) throw new PhoneAuthError(`أدخل رمز التحقق المكوّن من ${codeLength} أرقام.`);
        await verifyPhoneCode(sentPhone, otp);
        setOtpValue(''); setCodeSent(false);
      }
    } catch (issue) { handleError(issue); }
    finally { pending.current = false; setBusy(false); }
  }, [operationLoading, auth, booking.loading, booking.syncError, booking.setupAccount, identity, role, form, codeSent, resendAt, expiresAt, codeLength, otp, sentPhone, sendCode, handleError]);
  const resend = useCallback(async () => {
    if (Date.now() < resendAt || pending.current || operationLoading) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try { await sendCode(); } catch (issue) { handleError(issue); }
    finally { pending.current = false; setBusy(false); }
  }, [resendAt, operationLoading, sendCode, handleError]);
  const changePhone = useCallback(() => {
    if (operationLoading || pending.current) return;
    setCodeSent(false); setSentPhone(''); setOtpValue(''); setExpiresAt(0); setError(''); setNotice('');
  }, [operationLoading]);
  const reload = useCallback(async () => { identity.retry(); await booking.reload(); }, [identity.retry, booking.reload]);
  const logout = useCallback(async () => {
    if (operationLoading || pending.current) return;
    setBusy(true);
    try {
      const result = await auth.logout();
      if (result.error) setError(result.error);
      else { setPhone(''); setForm({ ...emptyRegistrationForm }); setRole(null); setCodeSent(false); setOtpValue(''); setError(''); }
    } finally { setBusy(false); }
  }, [auth.logout, operationLoading]);
  return { ...booking, reload, syncError: booking.syncError || identity.error, user: auth.user,
    loading: auth.loading || booking.loading || identity.loading, operationLoading, phone, setPhone,
    verifiedPhone: identity.phone, sentPhone, otp, setOtp, codeLength, codeSent, expiresIn,
    role, setRole, form, setField, provinceItems, vehicleItems, error, notice, seconds, submit, resend, changePhone, logout };
}
