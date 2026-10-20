import { useCallback, useEffect, useState } from 'react';
import { useAuth, useAlert } from '@/template';
import { useBooking } from './useBooking';
import type { UserRole } from '@/services/types';
import { ensureServerScheduler } from '@/services/bookingService';
export function useSecureLogin() {
  const auth = useAuth();
  const booking = useBooking();
  const { showAlert } = useAlert();
  useEffect(() => {
    if (booking.account) void ensureServerScheduler().catch(() => undefined);
  }, [booking.account?.user_id]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [role, setRole] = useState<UserRole>('merchant');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [resendAt]);
  const sendCode = useCallback(async () => {
    const result = await auth.sendOTP(email.trim().toLowerCase());
    if (result.error) throw new Error(result.error);
    setCodeSent(true); setResendAt(Date.now() + 60000);
  }, [auth.sendOTP, email]);
  const submit = useCallback(async () => {
    setBusy(true); setError('');
    try {
      if (auth.user) { await booking.setupAccount(role, name.trim()); return; }
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
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذر إكمال العملية'); }
    finally { setBusy(false); }
  }, [auth, booking.setupAccount, role, name, email, password, confirmation, mode, codeSent, otp, sendCode]);
  const resend = useCallback(async () => {
    if (seconds > 0) return;
    setBusy(true); setError('');
    try { await sendCode(); showAlert('رمز جديد', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.'); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذر إرسال الرمز'); }
    finally { setBusy(false); }
  }, [seconds, sendCode, showAlert]);
  const toggle = useCallback(() => { setMode((m) => m === 'login' ? 'register' : 'login'); setCodeSent(false); setOtp(''); setError(''); }, []);
  return { ...booking, user: auth.user, operationLoading: auth.operationLoading || busy, mode, email, setEmail, password, setPassword,
    confirmation, setConfirmation, otp, setOtp, codeSent, role, setRole, name, setName, error, seconds, submit, resend, toggle };
}
