import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/template';
import { useBooking } from './useBooking';
import { PROVINCES, VEHICLES } from '@/constants/config';
import type { UserRole } from '@/services/types';
import { emptyRegistrationForm, normalizeDigits, type RegistrationForm } from '@/services/registrationService';
import { prepareServerProfile } from '@/services/accountProfileService';

export function useSecureLogin() {
  const auth = useAuth();
  const booking = useBooking();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtpValue] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [form, setForm] = useState<RegistrationForm>({ ...emptyRegistrationForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const operationLoading = auth.operationLoading || busy;
  const provinceItems = useMemo(() => PROVINCES.map((name) => ({ id: name, label: name, icon: 'map-marker-outline' })), []);
  const vehicleItems = useMemo(() => VEHICLES.map((vehicle) => ({ id: vehicle.id, label: vehicle.label, icon: vehicle.icon, meta: `حتى ${vehicle.capacity} طن` })), []);
  const setField = useCallback((field: keyof RegistrationForm, value: string) => setForm((current) => ({ ...current, [field]: value })), []);
  const setOtp = useCallback((value: string) => setOtpValue(normalizeDigits(value).replace(/\D/g, '').slice(0, 4)), []);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [resendAt]);
  const sendCode = useCallback(async () => {
    const result = await auth.sendOTP(email.trim().toLowerCase());
    if (result.error) throw new Error(result.error);
    setCodeSent(true); setResendAt(Date.now() + 60000); setNotice('تم إرسال رمز التحقق إلى بريدك الإلكتروني.');
  }, [auth.sendOTP, email]);
  const submit = useCallback(async () => {
    if (operationLoading || auth.loading || booking.loading) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (auth.user) {
        if (booking.syncError) throw new Error('أعد المزامنة قبل إعداد الحساب');
        if (!role) throw new Error('اختر نوع الحساب أولاً');
        const account = await prepareServerProfile(role, form, auth.user.id);
        await booking.setupAccount(role, account.name, account.profile);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('أدخل بريداً إلكترونياً صحيحاً');
      if (password.length < 6) throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف');
      if (mode === 'register') {
        if (password !== confirmation) throw new Error('كلمتا المرور غير متطابقتين');
        if (!codeSent) { await sendCode(); return; }
        if (!/^\d{4}$/.test(otp)) throw new Error('أدخل رمز البريد المكوّن من 4 أرقام');
        const result = await auth.verifyOTPAndLogin(email.trim().toLowerCase(), otp, { password });
        if (result.error) throw new Error(result.error);
        if (!result.user) throw new Error('لم يتم إنشاء جلسة تسجيل الدخول');
      } else {
        const result = await auth.signInWithPassword(email.trim().toLowerCase(), password);
        if (result.error) throw new Error(result.error);
        if (!result.user) throw new Error('لم يتم إنشاء جلسة تسجيل الدخول');
      }
      setPassword(''); setConfirmation(''); setOtpValue('');
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذر إكمال العملية'); }
    finally { setBusy(false); }
  }, [operationLoading, auth, booking.loading, booking.syncError, booking.setupAccount, role, form, email, password, confirmation, mode, codeSent, otp, sendCode]);
  const resend = useCallback(async () => {
    if (Date.now() < resendAt || operationLoading) return;
    setBusy(true); setError(''); setNotice('');
    try { await sendCode(); setOtpValue(''); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذر إرسال الرمز'); }
    finally { setBusy(false); }
  }, [resendAt, operationLoading, sendCode]);
  const toggle = useCallback(() => {
    if (operationLoading) return;
    setMode((current) => current === 'login' ? 'register' : 'login');
    setCodeSent(false); setOtpValue(''); setPassword(''); setConfirmation(''); setError(''); setNotice('');
  }, [operationLoading]);
  const logout = useCallback(async () => {
    if (operationLoading) return;
    const result = await auth.logout();
    if (result.error) setError(result.error);
    else { setForm({ ...emptyRegistrationForm }); setRole(null); setCodeSent(false); setError(''); }
  }, [auth.logout, operationLoading]);
  return { ...booking, user: auth.user, loading: auth.loading || booking.loading, operationLoading, mode, email, setEmail,
    password, setPassword, confirmation, setConfirmation, otp, setOtp, codeSent, role, setRole, form, setField,
    provinceItems, vehicleItems, error, notice, seconds, submit, resend, toggle, logout };
}
