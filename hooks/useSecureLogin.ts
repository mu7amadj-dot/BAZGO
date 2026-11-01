import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/template';
import { useBooking } from './useBooking';
import { useVerifiedPhone } from './useVerifiedPhone';
import { PROVINCES, VEHICLES } from '@/constants/config';
import type { UserRole } from '@/services/types';
import { emptyRegistrationForm, normalizeDigits, prepareRegistration, type RegistrationForm } from '@/services/registrationService';
import { prepareServerProfile } from '@/services/accountProfileService';
import { PhoneAuthError, fetchPendingDriverRegistration, finishDriverPassword, sendPhoneCode, signInPhonePassword, verifyDriverPhoneCode, verifyPhoneCode } from '@/services/phoneAuthService';
import { validateDriverNames, validateDriverPhotos, validateDriverVehicle, type DriverRegistrationStep } from '@/services/driverRegistrationService';
import { validatePassword, validatePasswordConfirmation } from '@/services/passwordValidation';

export function useSecureLogin() {
  const auth = useAuth();
  const booking = useBooking();
  const identity = useVerifiedPhone();
  const [mode, setModeValue] = useState<'register' | 'login' | 'recovery'>('register');
  const [password, setPasswordValue] = useState('');
  const [confirmation, setConfirmationValue] = useState('');
  const [passwordRetryAt, setPasswordRetryAt] = useState(0);
  const [passwordRetryIn, setPasswordRetryIn] = useState(0);
  const [sentPhone, setSentPhone] = useState('');
  const [otp, setOtpValue] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [codeSent, setCodeSent] = useState(false);
  const [role, setRoleValue] = useState<UserRole | null>(null);
  const [driverStep, setDriverStep] = useState<DriverRegistrationStep>(1);
  const preparedDriver = useRef<{ key: string; account: Awaited<ReturnType<typeof prepareServerProfile>> } | null>(null);
  const [form, setForm] = useState<RegistrationForm>({ ...emptyRegistrationForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const pending = useRef(false);
  const previousUserId = useRef<string | null>(auth.user?.id ?? null);
  const operationLoading = auth.operationLoading || busy;
  const driverWizard = role === 'driver' && !booking.account && (mode === 'register' || !!auth.user);
  const provinceItems = useMemo(() => PROVINCES.map((name) => ({ id: name, label: name, icon: 'map-marker-outline' })), []);
  const vehicleItems = useMemo(() => VEHICLES.map((vehicle) => ({ id: vehicle.id, label: vehicle.label, icon: vehicle.icon, meta: `حتى ${vehicle.capacity} طن` })), []);
  const setField = useCallback((field: keyof RegistrationForm, value: string) => {
    if (pending.current || operationLoading || codeSent || (field === 'phone' && identity.phone)) return;
    setForm((current) => ({ ...current, [field]: value }));
  }, [operationLoading, codeSent, identity.phone]);
  const setPhone = useCallback((value: string) => setField('phone', value), [setField]);
  const setRole = useCallback((value: UserRole) => {
    if (pending.current || operationLoading || codeSent) return;
    setRoleValue(value); setDriverStep(1); setError(''); setNotice('');
  }, [operationLoading, codeSent]);
  const setMode = useCallback((value: 'register' | 'login' | 'recovery') => {
    if (pending.current || operationLoading || codeSent || auth.user) return;
    setModeValue(value); setPasswordValue(''); setConfirmationValue(''); setError(''); setNotice('');
  }, [operationLoading, codeSent, auth.user]);
  const setPassword = useCallback((value: string) => {
    if (pending.current || operationLoading || codeSent || (auth.user && !driverWizard)) return;
    setPasswordValue(value);
  }, [operationLoading, codeSent, auth.user, driverWizard]);
  const setConfirmation = useCallback((value: string) => {
    if (pending.current || operationLoading || codeSent || (auth.user && !driverWizard)) return;
    setConfirmationValue(value);
  }, [operationLoading, codeSent, auth.user, driverWizard]);
  const setOtp = useCallback((value: string) => setOtpValue(normalizeDigits(value).replace(/\D/g, '').slice(0, codeLength)), [codeLength]);

  useEffect(() => {
    const nextUserId = auth.user?.id ?? null;
    // Keep the anonymous registration draft through OTP sign-in. Clear it only
    // when a signed-in user logs out or is replaced, never on null -> verified user.
    if (previousUserId.current && previousUserId.current !== nextUserId) {
      setRoleValue(null); setDriverStep(1); preparedDriver.current = null; setForm({ ...emptyRegistrationForm }); setModeValue('register');
      setError(''); setNotice('');
    }
    if (nextUserId || previousUserId.current) {
      setPasswordValue(''); setConfirmationValue(''); setPasswordRetryAt(0);
      setCodeSent(false); setOtpValue(''); setSentPhone(''); setExpiresAt(0);
    }
    previousUserId.current = nextUserId;
  }, [auth.user?.id]);
  useEffect(() => {
    if (identity.phone) setForm((current) => ({ ...current, phone: identity.phone }));
  }, [identity.phone]);
  useEffect(() => {
    if (!auth.user?.id) return;
    let cancelled = false;
    // Restore only the onboarding role after reopening. Names/images remain transient
    // and must be re-entered; a verified session does not create a driver account.
    void fetchPendingDriverRegistration().then((isDriver) => {
      if (!cancelled && isDriver) setRoleValue((current) => current ?? 'driver');
    }).catch((issue) => { if (!cancelled) setError(issue instanceof Error ? issue.message : 'تعذر تحميل حالة التسجيل.'); });
    return () => { cancelled = true; };
  }, [auth.user?.id]);
  useEffect(() => {
    const update = () => {
      setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
      setExpiresIn(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      setPasswordRetryIn(Math.max(0, Math.ceil((passwordRetryAt - Date.now()) / 1000)));
    };
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [resendAt, expiresAt, passwordRetryAt]);
  const handleError = useCallback((issue: unknown) => {
    setError(issue instanceof Error ? issue.message : 'تعذر إكمال العملية.');
    if (issue instanceof PhoneAuthError && issue.retryAfter > 0) {
      const retryAt = Date.now() + issue.retryAfter * 1000;
      if (mode === 'login') setPasswordRetryAt((current) => Math.max(current, retryAt));
      else setResendAt((current) => Math.max(current, retryAt));
    }
    if (issue instanceof PhoneAuthError && issue.code === 'account_exists') {
      setModeValue('login'); setCodeSent(false); setOtpValue(''); setSentPhone(''); setExpiresAt(0);
      setPasswordValue(''); setConfirmationValue('');
    }
    if (issue instanceof PhoneAuthError && ['code_expired', 'code_locked'].includes(issue.code)) {
      setExpiresAt(0); setOtpValue('');
    }
  }, [mode]);
  const sendCode = useCallback(async () => {
    const result = await sendPhoneCode(form.phone);
    if (!result.sent || result.codeLength !== 6) throw new Error('استجابة خدمة SMS غير صالحة.');
    setForm((current) => ({ ...current, phone: result.phone }));
    setSentPhone(result.phone); setCodeLength(result.codeLength); setCodeSent(true); setOtpValue('');
    setResendAt(Date.now() + Math.max(60, result.retryAfter) * 1000);
    setExpiresAt(Date.now() + result.expiresIn * 1000);
    setNotice('تم طلب إرسال رمز التحقق عبر SMS. قد يستغرق وصوله لحظات.');
  }, [form.phone]);
  const previousDriverStep = useCallback(() => {
    if (pending.current || operationLoading) return;
    if (codeSent) { setCodeSent(false); setSentPhone(''); setOtpValue(''); setExpiresAt(0); }
    setDriverStep((current) => Math.max(1, current - 1) as DriverRegistrationStep);
    setError(''); setNotice('');
  }, [operationLoading, codeSent]);
  const submit = useCallback(async () => {
    if (pending.current || operationLoading || auth.loading || booking.loading || identity.loading) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (driverWizard) {
        if (driverStep === 1) {
          validateDriverNames(form); setDriverStep(2);
        } else if (driverStep === 2) {
          if (auth.user) {
            if (!identity.phone || identity.error || booking.syncError) throw new Error('أعد تحميل الحساب للتأكد من رقم الهاتف المتحقق منه.');
            setDriverStep(3); setNotice('');
          } else if (!codeSent) {
            validateDriverNames(form);
            if (Date.now() < resendAt) throw new PhoneAuthError('انتظر قبل طلب رمز آخر.', Math.ceil((resendAt - Date.now()) / 1000));
            await sendCode();
          } else {
            if (Date.now() >= expiresAt) throw new PhoneAuthError('انتهت صلاحية الرمز. أرسل رمزاً جديداً.', 0, 'code_expired');
            if (otp.length !== codeLength) throw new PhoneAuthError(`أدخل رمز التحقق المكوّن من ${codeLength} أرقام.`);
            await verifyDriverPhoneCode(sentPhone, otp);
            setCodeSent(false); setOtpValue(''); setDriverStep(3); setNotice('تم التحقق من رقمك. أكمل بيانات المركبة.');
          }
        } else if (driverStep === 3) {
          validateDriverVehicle(form, VEHICLES.map((vehicle) => vehicle.id), PROVINCES); setDriverStep(4);
        } else if (driverStep === 4) {
          validateDriverPhotos(form); setDriverStep(5);
        } else {
          if (!auth.user || !identity.phone || identity.error || booking.syncError) throw new Error('يجب إكمال التحقق من الهاتف وإعادة المزامنة قبل حفظ الحساب.');
          validateDriverNames(form);
          validateDriverVehicle(form, VEHICLES.map((vehicle) => vehicle.id), PROVINCES);
          validateDriverPhotos(form);
          validatePasswordConfirmation(password, confirmation);
          const verifiedForm = { ...form, phone: identity.phone };
          const key = JSON.stringify([auth.user.id, verifiedForm]);
          if (preparedDriver.current?.key !== key) {
            preparedDriver.current = { key, account: await prepareServerProfile('driver', verifiedForm, auth.user.id) };
          }
          // Uploaded files are cached for retry in this session. Account insertion is
          // server-guarded until both password and all three private images exist.
          await finishDriverPassword(identity.phone, password);
          const account = preparedDriver.current.account;
          await booking.setupAccount('driver', account.name, account.profile);
          setPasswordValue(''); setConfirmationValue('');
        }
      } else if (auth.user) {
        if (booking.syncError || identity.error) throw new Error('أعد تحميل الحساب قبل المتابعة.');
        if (booking.account) return; // Existing roles are restored from the server, not overwritten by the form.
        if (!identity.phone) throw new Error('يجب التحقق من رقم الهاتف عبر SMS قبل إنشاء الحساب. سجّل الخروج ثم تحقق من رقمك.');
        if (!role) throw new Error('اختر نوع الحساب أولاً.');
        const account = await prepareServerProfile(role, { ...form, phone: identity.phone }, auth.user.id);
        await booking.setupAccount(role, account.name, account.profile);
      } else if (!codeSent && mode === 'login') {
        // Existing accounts use the normal server password verifier; no OTP request.
        validatePassword(password);
        if (Date.now() < passwordRetryAt) throw new PhoneAuthError('انتظر قبل محاولة الدخول مجدداً.', Math.ceil((passwordRetryAt - Date.now()) / 1000));
        await signInPhonePassword(form.phone, password);
        setPasswordValue(''); setConfirmationValue('');
      } else if (!codeSent) {
        validatePasswordConfirmation(password, confirmation);
        if (mode === 'register') {
          if (!role) throw new Error('اختر التسجيل كتاجر أو كسائق أولاً.');
          // Validate every role-specific field before sending a paid SMS. No images
          // are uploaded and no marketplace account is saved before verification.
          prepareRegistration(role, form);
        }
        if (Date.now() < resendAt) throw new PhoneAuthError('انتظر قبل طلب رمز آخر.', Math.ceil((resendAt - Date.now()) / 1000));
        await sendCode();
      } else {
        if (Date.now() >= expiresAt) throw new PhoneAuthError('انتهت صلاحية الرمز. أرسل رمزاً جديداً.');
        if (otp.length !== codeLength) throw new PhoneAuthError(`أدخل رمز التحقق المكوّن من ${codeLength} أرقام.`);
        validatePasswordConfirmation(password, confirmation);
        await verifyPhoneCode(sentPhone, otp, password, mode === 'recovery' ? 'reset_password' : 'register');
        setPasswordValue(''); setConfirmationValue('');
        setOtpValue(''); setCodeSent(false);
      }
    } catch (issue) { handleError(issue); }
    finally { pending.current = false; setBusy(false); }
  }, [operationLoading, auth, booking.loading, booking.syncError, booking.account, booking.setupAccount, identity, mode, role, driverWizard, driverStep, form, password, confirmation, passwordRetryAt, codeSent, resendAt, expiresAt, codeLength, otp, sentPhone, sendCode, handleError]);
  const resend = useCallback(async () => {
    if (!codeSent || auth.user || Date.now() < resendAt || pending.current || operationLoading) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try { await sendCode(); } catch (issue) { handleError(issue); }
    finally { pending.current = false; setBusy(false); }
  }, [codeSent, auth.user, resendAt, operationLoading, sendCode, handleError]);
  const changePhone = useCallback(() => {
    if (operationLoading || pending.current) return;
    // Return to the same draft so correcting details does not discard attachments.
    setCodeSent(false); setSentPhone(''); setOtpValue(''); setExpiresAt(0); setError(''); setNotice('');
  }, [operationLoading]);
  const reload = useCallback(async () => { identity.retry(); await booking.reload(); }, [identity.retry, booking.reload]);
  const logout = useCallback(async () => {
    if (operationLoading || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await auth.logout();
      if (result.error) setError(result.error);
      else {
        setForm({ ...emptyRegistrationForm }); setRoleValue(null); setDriverStep(1); preparedDriver.current = null; setModeValue('register');
        setPasswordValue(''); setConfirmationValue(''); setPasswordRetryAt(0);
        setCodeSent(false); setOtpValue(''); setSentPhone(''); setExpiresAt(0); setNotice('');
      }
    } catch (issue) { handleError(issue); }
    finally { pending.current = false; setBusy(false); }
  }, [auth.logout, operationLoading, handleError]);
  return { ...booking, reload, syncError: booking.syncError || identity.error, user: auth.user,
    loading: auth.loading || booking.loading || identity.loading, operationLoading, mode, setMode, phone: form.phone, setPhone,
    password, setPassword, confirmation, setConfirmation, passwordRetryIn,
    verifiedPhone: identity.phone, sentPhone, otp, setOtp, codeLength, codeSent, expiresIn,
    role, setRole, driverWizard, driverStep, previousDriverStep, form, setField, provinceItems, vehicleItems, error, notice, seconds, submit, resend, changePhone, logout };
}
