import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecureLogin } from '@/hooks/useSecureLogin';
import { BrandMark } from '@/components/feature/BrandMark';
import { AccountTypePicker } from '@/components/feature/AccountTypePicker';
import { RegistrationDetails } from '@/components/auth/RegistrationDetails';
import { PasswordFields } from '@/components/auth/PasswordFields';
import { DriverRegistrationSteps } from '@/components/auth/DriverRegistrationSteps';
import { SessionLoading } from '@/components/auth/AccountGate';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function LoginScreen() {
  const login = useSecureLogin();
  const scrollRef = useRef<ScrollView | null>(null);
  const signedIn = !!login.user;
  const registration = signedIn || login.mode === 'register';
  const recovery = !signedIn && login.mode === 'recovery';
  const isMerchant = login.role === 'merchant';
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [login.codeSent, signedIn, login.mode, login.driverStep]);
  if (login.loading) return <SessionLoading />;
  if (login.user && login.account) return <Redirect href="/" />;
  const submitDisabled = login.driverWizard
    ? login.driverStep === 2 && (signedIn ? !login.verifiedPhone : login.codeSent ? login.otp.length !== login.codeLength || login.expiresIn <= 0 : login.seconds > 0)
    : signedIn ? !login.role || !login.verifiedPhone : login.codeSent ? login.otp.length !== login.codeLength || login.expiresIn <= 0 : login.mode === 'login' ? login.passwordRetryIn > 0 : login.seconds > 0 || (registration && !login.role);
  const driverSubmitTitle = login.driverStep === 5 ? 'إنشاء حساب السائق'
    : login.driverStep === 2 && !signedIn ? login.codeSent ? 'تحقق وانتقل للخطوة التالية' : login.seconds > 0 ? `إرسال الرمز بعد ${login.seconds} ثانية` : 'التالي · إرسال رمز التحقق' : 'التالي';
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandMark />
        <View style={styles.intro}>
          <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
          <View style={styles.introCopy}><Text style={styles.introText}>{login.driverWizard ? 'حساب السائق · خطوة بخطوة' : 'حسابك برقم الهاتف والرقم السري'}</Text><Text style={styles.introCaption}>{login.driverWizard ? '5 خطوات · تحقق حقيقي · صور إلزامية' : 'دخول مباشر للحسابات المسجلة · دون OTP'}</Text></View>
        </View>
        {!signedIn && !login.codeSent && (!login.driverWizard || login.driverStep === 1) ? <View style={styles.modeBar} accessibilityRole="tablist">
          <Pressable onPress={() => login.setMode('register')} disabled={login.operationLoading} accessibilityRole="tab" accessibilityLabel="إنشاء حساب جديد" accessibilityState={{ selected: login.mode === 'register', disabled: login.operationLoading }} style={({ pressed }) => [styles.modeButton, login.mode === 'register' ? styles.modeSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.modeText, login.mode === 'register' ? styles.modeTextSelected : null]}>إنشاء حساب</Text></Pressable>
          <Pressable onPress={() => login.setMode('login')} disabled={login.operationLoading} accessibilityRole="tab" accessibilityLabel="الدخول برقم الهاتف والرقم السري" accessibilityState={{ selected: login.mode === 'login', disabled: login.operationLoading }} style={({ pressed }) => [styles.modeButton, login.mode === 'login' ? styles.modeSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.modeText, login.mode === 'login' ? styles.modeTextSelected : null]}>لديّ حساب</Text></Pressable>
        </View> : null}
        {login.syncError && signedIn ? <View style={styles.panel}>
          <Text style={styles.title}>تعذر تحميل حسابك</Text><Text style={styles.subtitle}>أعد المزامنة قبل المتابعة. بياناتك المدخلة محفوظة في هذه الشاشة.</Text>
        </View> : login.driverWizard ? <>
          {login.driverStep === 1 && !signedIn ? <AccountTypePicker selectedRole={login.role} onSelect={login.setRole} disabled={login.operationLoading} /> : null}
          <DriverRegistrationSteps step={login.driverStep} form={login.form} onFieldChange={login.setField} provinceItems={login.provinceItems} vehicleItems={login.vehicleItems} verifiedPhone={login.verifiedPhone} codeSent={login.codeSent} sentPhone={login.sentPhone} otp={login.otp} onOtpChange={login.setOtp} codeLength={login.codeLength} expiresIn={login.expiresIn} resendIn={login.seconds} onResend={login.resend} onChangePhone={login.changePhone} password={login.password} confirmation={login.confirmation} onPasswordChange={login.setPassword} onConfirmationChange={login.setConfirmation} disabled={login.operationLoading} />
        </> : login.codeSent && !signedIn ? <View style={styles.panel}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="shield-key-outline" size={24} color={colors.primary} /><Text style={styles.title}>{recovery ? 'تحقق لتعيين الرقم السري' : 'تحقق من رقم هاتفك'}</Text></View>
          {registration && login.role ? <View style={styles.roleSummary}><MaterialCommunityIcons name={isMerchant ? 'store-outline' : 'truck-outline'} size={22} color={colors.primary} /><Text style={styles.summaryText}>{isMerchant ? 'حساب تاجر' : 'حساب سائق'} · {login.form.name}</Text></View> : null}
          <Text style={styles.subtitle}>تم طلب إرسال الرمز إلى رقمك:</Text><Text style={styles.phone}>{login.sentPhone}</Text>
          <Text style={styles.subtitle}>{recovery ? 'هذا التحقق لتعيين أو استعادة الرقم السري فقط. بعد الحفظ، تدخل برقم الهاتف والرقم السري دون طلب OTP.' : 'نتحقق من ملكية الرقم عند التسجيل فقط. دخولك القادم سيكون بالرقم السري الذي اخترته دون OTP.'}</Text>
          <Field compact icon="shield-key-outline" label={`رمز التحقق (${login.codeLength} أرقام)`} value={login.otp} onChangeText={login.setOtp} keyboardType="numeric" textContentType="oneTimeCode" maxLength={login.codeLength} editable={!login.operationLoading} />
          <Text accessibilityLiveRegion="polite" style={styles.caption}>{login.expiresIn > 0 ? `صلاحية الرمز: ${Math.floor(login.expiresIn / 60)}:${String(login.expiresIn % 60).padStart(2, '0')}` : 'انتهت صلاحية الرمز. أرسل رمزاً جديداً.'}</Text>
          <Button variant="ghost" title={login.seconds ? `إعادة الإرسال خلال ${login.seconds} ثانية` : 'إعادة إرسال الرمز'} onPress={login.resend} disabled={login.seconds > 0 || login.operationLoading} />
        </View> : registration ? <>
          <View>
            <Text style={styles.title}>{signedIn ? 'راجع بيانات حسابك وأكمل التسجيل' : 'انضم إلى BAZGO كتاجر أو سائق'}</Text>
            <Text style={styles.subtitle}>{signedIn ? 'رقمك متحقق منه. راجع التفاصيل ثم احفظ حسابك الحقيقي؛ نوع الحساب لا يمكن تغييره بعد الحفظ.' : 'اختر نوع الحساب أولاً، ثم أكمل التفاصيل واختر رقماً سرياً. التحقق من الهاتف مرة واحدة عند التسجيل.'}</Text>
            <AccountTypePicker selectedRole={login.role} onSelect={login.setRole} disabled={login.operationLoading} />
          </View>
          {login.role ? <>
            <RegistrationDetails role={login.role} form={login.form} onFieldChange={login.setField} provinceItems={login.provinceItems} vehicleItems={login.vehicleItems} verifiedPhone={login.verifiedPhone} disabled={login.operationLoading} />
            {!signedIn ? <View style={styles.panel}><Text style={styles.sectionTitle}>حماية حسابك</Text><PasswordFields password={login.password} confirmation={login.confirmation} onPasswordChange={login.setPassword} onConfirmationChange={login.setConfirmation} confirm disabled={login.operationLoading} /></View> : null}
          </> : <View style={styles.selectionHint}><MaterialCommunityIcons name="gesture-tap" size={22} color={colors.primary} /><Text style={styles.hintText}>اختر تاجر أو سائق أعلاه لعرض بيانات التسجيل الخاصة بك.</Text></View>}
          {signedIn && !login.verifiedPhone ? <Text style={styles.warning}>لم يتم التحقق من رقم الهاتف لهذا الحساب. سجّل الخروج ثم تحقق من رقمك لإنشاء حساب حقيقي.</Text> : null}
        </> : recovery ? <View style={styles.panel}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="lock-reset" size={24} color={colors.primary} /><Text style={styles.title}>تعيين أو استعادة الرقم السري</Text></View>
          <Text style={styles.subtitle}>إذا كان حسابك قديماً ولم تعيّن رقماً سرياً، أو نسيته، تحقق من هاتفك مرة واحدة لتعيين رقم سري جديد. تبقى بيانات التاجر أو السائق وطلباتك كما هي.</Text>
          <Field compact icon="phone-outline" label="رقم الهاتف المسجّل" value={login.phone} onChangeText={login.setPhone} placeholder="07XXXXXXXXX" keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={24} editable={!login.operationLoading} />
          <PasswordFields password={login.password} confirmation={login.confirmation} onPasswordChange={login.setPassword} onConfirmationChange={login.setConfirmation} confirm disabled={login.operationLoading} />
        </View> : <View style={styles.panel}>
          <Text style={styles.title}>الدخول لحسابك</Text>
          <Text style={styles.subtitle}>أدخل رقم هاتفك والرقم السري للدخول مباشرةً إلى حساب التاجر أو السائق المسجّل، دون رسالة تحقق.</Text>
          <Field compact icon="phone-outline" label="رقم الهاتف العراقي" value={login.phone} onChangeText={login.setPhone} placeholder="07XXXXXXXXX" keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={24} editable={!login.operationLoading} />
          <PasswordFields password={login.password} confirmation={login.confirmation} onPasswordChange={login.setPassword} onConfirmationChange={login.setConfirmation} confirm={false} disabled={login.operationLoading} />
          <Pressable onPress={() => login.setMode('recovery')} disabled={login.operationLoading} accessibilityRole="button" accessibilityLabel="تعيين أو استعادة الرقم السري" style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>تعيين أو استعادة الرقم السري</Text></Pressable>
          {login.passwordRetryIn > 0 ? <Text accessibilityLiveRegion="polite" style={styles.caption}>{`يمكنك إعادة محاولة الدخول بعد ${login.passwordRetryIn} ثانية.`}</Text> : null}
        </View>}
        {login.error || login.syncError ? <View style={styles.error} accessibilityLiveRegion="polite"><MaterialCommunityIcons name="alert-circle-outline" color={colors.danger} size={20} /><View style={styles.errorCopy}><Text style={styles.errorText}>{login.error || login.syncError}</Text>{login.errorReference ? <Text selectable style={styles.errorReference}>{`مرجع الخطأ: ${login.errorReference}`}</Text> : null}</View></View> : null}
        {login.notice && !signedIn ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{login.notice}</Text> : null}
        {!login.driverWizard && !signedIn && !login.codeSent && login.mode !== 'login' ? <Text style={styles.caption}>{login.seconds > 0 ? `يمكن طلب رمز جديد بعد ${login.seconds} ثانية.` : 'رمز SMS مطلوب فقط للتسجيل الجديد أو تعيين واستعادة الرقم السري. لا نطلبه عند الدخول المعتاد.'}</Text> : null}
        {login.syncError && signedIn ? <Button title="إعادة تحميل الحساب" onPress={login.reload} disabled={login.operationLoading} /> : <Button title={login.driverWizard ? driverSubmitTitle : signedIn ? 'حفظ الحساب الحقيقي والمتابعة' : login.codeSent ? recovery ? 'تحقق واحفظ الرقم السري' : 'تحقق وتابع' : registration ? 'متابعة وإرسال رمز التحقق' : recovery ? 'إرسال رمز لتعيين الرقم السري' : 'تسجيل الدخول'} onPress={login.submit} loading={login.operationLoading} disabled={submitDisabled} />}
        {login.driverWizard && login.driverStep > 1 ? <Button title="السابق" variant="ghost" onPress={login.previousDriverStep} disabled={login.operationLoading} /> : null}
        {signedIn ? <Button title="تسجيل الخروج" variant="ghost" onPress={login.logout} loading={login.operationLoading} /> : login.codeSent && !login.driverWizard ? <Pressable onPress={login.changePhone} disabled={login.operationLoading} accessibilityRole="button" accessibilityLabel={registration ? 'تعديل بيانات التسجيل أو رقم الهاتف' : 'تعديل رقم الهاتف أو الرقم السري'} style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>{registration ? 'تعديل البيانات أو رقم الهاتف' : 'تعديل الهاتف أو الرقم السري'}</Text></Pressable> : recovery ? <Pressable onPress={() => login.setMode('login')} disabled={login.operationLoading} accessibilityRole="button" accessibilityLabel="العودة لتسجيل الدخول" style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>العودة لتسجيل الدخول</Text></Pressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center', padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  intro: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceTint, borderRadius: radius.md, padding: spacing.md },
  introCopy: { flex: 1 },
  introText: { ...typography.bodyStrong, color: colors.primary, textAlign: 'right' },
  introCaption: { ...typography.caption, color: colors.textSubtle, textAlign: 'right' },
  title: { ...typography.title, color: colors.text, textAlign: 'right', flexShrink: 1, marginBottom: spacing.sm },
  sectionTitle: { ...typography.section, color: colors.text, textAlign: 'right', marginBottom: spacing.md },
  subtitle: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.md },
  modeBar: { flexDirection: 'row-reverse', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.xs, gap: spacing.xs },
  modeButton: { flex: 1, minHeight: layout.touchTarget, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  modeSelected: { backgroundColor: colors.primary },
  modeText: { ...typography.bodyStrong, color: colors.textSubtle },
  modeTextSelected: { color: colors.onPrimary },
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  roleSummary: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceTint, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  summaryText: { ...typography.bodyStrong, color: colors.primary, textAlign: 'right', flex: 1 },
  phone: { ...typography.section, color: colors.primary, writingDirection: 'ltr', textAlign: 'right', marginBottom: spacing.md },
  selectionHint: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceTint, borderRadius: radius.md },
  hintText: { ...typography.body, color: colors.textSubtle, flex: 1, textAlign: 'right' },
  caption: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.sm },
  warning: { ...typography.body, color: colors.warning, textAlign: 'right', backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.md },
  link: { minHeight: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  linkText: { ...typography.bodyStrong, color: colors.primary, textAlign: 'center' },
  pressed: { opacity: 0.7 },
  error: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' },
  errorCopy: { flex: 1, gap: spacing.sm },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'right' },
  errorReference: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', writingDirection: 'ltr' },
  notice: { ...typography.body, color: colors.success, textAlign: 'right' },
});
