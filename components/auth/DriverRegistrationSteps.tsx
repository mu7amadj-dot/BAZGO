import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Field } from '@/components/ui/Field';
import { SelectField, type SelectItem } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { PasswordFields } from './PasswordFields';
import { Button } from '@/components/ui/Button';
import { driverRegistrationSteps, type DriverRegistrationStep } from '@/services/driverRegistrationService';
import type { RegistrationForm } from '@/services/registrationService';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

interface DriverRegistrationStepsProps {
  step: DriverRegistrationStep;
  form: RegistrationForm;
  onFieldChange: (field: keyof RegistrationForm, value: string) => void;
  provinceItems: SelectItem[];
  vehicleItems: SelectItem[];
  verifiedPhone: string;
  codeSent: boolean;
  sentPhone: string;
  otp: string;
  onOtpChange: (value: string) => void;
  codeLength: number;
  expiresIn: number;
  resendIn: number;
  onResend: () => void;
  onChangePhone: () => void;
  password: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  disabled: boolean;
}
export const DriverRegistrationSteps = memo(function DriverRegistrationSteps({ step, form, onFieldChange, provinceItems, vehicleItems, verifiedPhone, codeSent, sentPhone, otp, onOtpChange, codeLength, expiresIn, resendIn, onResend, onChangePhone, password, confirmation, onPasswordChange, onConfirmationChange, disabled }: DriverRegistrationStepsProps) {
  const current = driverRegistrationSteps[step - 1];
  return <View style={styles.container}>
    <View style={styles.overview}>
      <View style={styles.topRow}><View style={styles.icon}><MaterialCommunityIcons name="truck-outline" size={26} color={colors.primary} /></View><View style={styles.copy}><Text style={styles.overline}>إنشاء حساب سائق</Text><Text style={styles.title}>{current.title}</Text></View><Text style={styles.counter}>{step} / 5</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel={`تقدم التسجيل: الخطوة ${step} من 5`} accessibilityValue={{ min: 1, max: 5, now: step }} style={styles.progress}><View style={[styles.progressFill, { width: `${step * 20}%` }]} /></View>
      <Text style={styles.caption}>{current.caption}</Text>
    </View>
    <View style={styles.panel} pointerEvents={disabled ? 'none' : 'auto'}>
      {step === 1 ? <>
        <Field compact icon="account-outline" label="اسم السائق" value={form.name} onChangeText={(value) => onFieldChange('name', value)} maxLength={120} editable={!disabled} />
        <Field compact icon="account-outline" label="اسم الأب" value={form.fatherName} onChangeText={(value) => onFieldChange('fatherName', value)} maxLength={120} editable={!disabled} />
        <Field compact icon="account-outline" label="اسم الجد" value={form.grandfatherName} onChangeText={(value) => onFieldChange('grandfatherName', value)} maxLength={120} editable={!disabled} />
      </> : step === 2 ? <>
        <Field compact icon="phone-outline" label={verifiedPhone ? 'رقم الهاتف المتحقق منه' : 'رقم الهاتف العراقي'} value={verifiedPhone || form.phone} onChangeText={(value) => onFieldChange('phone', value)} placeholder="07XXXXXXXXX" keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={24} editable={!disabled && !verifiedPhone && !codeSent} />
        {verifiedPhone ? <View style={styles.verified}><MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.success} /><Text style={styles.verifiedText}>تم التحقق من رقم الهاتف. يمكنك المتابعة دون إرسال رمز آخر.</Text></View> : codeSent ? <>
          <Text style={styles.body}>أدخل الرمز المرسل إلى رقمك:</Text><Text style={styles.phone}>{sentPhone}</Text>
          <Field compact icon="shield-key-outline" label={`رمز التحقق (${codeLength} أرقام)`} value={otp} onChangeText={onOtpChange} keyboardType="numeric" textContentType="oneTimeCode" maxLength={codeLength} editable={!disabled && expiresIn > 0} />
          <Text style={styles.caption} accessibilityLiveRegion="polite">{expiresIn > 0 ? `صلاحية الرمز: ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}` : 'انتهت صلاحية الرمز. أرسل رمزاً جديداً.'}</Text>
          <Button variant="ghost" title={resendIn > 0 ? `إعادة الإرسال خلال ${resendIn} ثانية` : 'إعادة إرسال الرمز'} onPress={onResend} disabled={disabled || resendIn > 0} />
          <Pressable onPress={onChangePhone} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>تعديل رقم الهاتف</Text></Pressable>
        </> : <Text style={styles.body}>اضغط التالي لإرسال OTP عبر SMS. يتم التحقق في هذه الخطوة قبل متابعة بيانات المركبة؛ لن يُطلب الرمز عند دخولك لاحقاً بالرقم السري.</Text>}
      </> : step === 3 ? <>
        <SelectField compact icon="truck-outline" label="نوع المركبة" title="اختر نوع المركبة" items={vehicleItems} selectedId={form.vehicleType} onSelect={(value) => onFieldChange('vehicleType', value)} />
        <Field compact icon="weight-kilogram" label="أقصى حمولة (طن)" value={form.maxCapacity} onChangeText={(value) => onFieldChange('maxCapacity', value)} keyboardType="decimal-pad" maxLength={12} editable={!disabled} />
        <SelectField compact icon="map-marker-outline" label="محافظة العمل" title="اختر المحافظة" items={provinceItems} selectedId={form.province} onSelect={(value) => onFieldChange('province', value)} />
      </> : step === 4 ? <>
        <View style={styles.required}><MaterialCommunityIcons name="camera-outline" size={22} color={colors.primary} /><Text style={styles.requiredText}>جميع الصور إلزامية</Text></View>
        <View style={styles.uploadRow}>
          <ImageUpload label="صورة السائق" value={form.driverPhoto} onChange={(value) => onFieldChange('driverPhoto', value)} icon="account-outline" disabled={disabled} />
          <ImageUpload label="إجازة السوق" value={form.licensePhoto} onChange={(value) => onFieldChange('licensePhoto', value)} icon="card-account-details-outline" disabled={disabled} />
          <ImageUpload label="صورة الشاحنة" value={form.vehiclePhoto} onChange={(value) => onFieldChange('vehiclePhoto', value)} icon="truck-outline" disabled={disabled} />
        </View>
        <Text style={styles.caption}>اختر صوراً واضحة من الكاميرا أو المعرض. تُرفع إلى تخزين خاص عند إكمال التسجيل؛ رفع الوثائق لا يعني اعتمادها تلقائياً.</Text>
      </> : <>
        <View style={styles.summary}><MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.success} /><Text style={styles.summaryText}>تم التحقق من رقمك واختيار صورك. بقيت حماية حسابك.</Text></View>
        <PasswordFields password={password} confirmation={confirmation} onPasswordChange={onPasswordChange} onConfirmationChange={onConfirmationChange} confirm disabled={disabled} />
        <Text style={styles.caption}>سيُحفظ حسابك الحقيقي بعد حفظ الرقم السري ورفع الصور الثلاث بنجاح. إذا سبق أن عيّنت رقماً سرياً أثناء استكمال التسجيل، استخدم الرقم السري نفسه.</Text>
      </>}
    </View>
  </View>;
});
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  overview: { backgroundColor: colors.surfaceTint, padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  topRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  icon: { width: layout.touchTarget, height: layout.touchTarget, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  overline: { ...typography.label, color: colors.primary, textAlign: 'right' },
  title: { ...typography.title, color: colors.text, textAlign: 'right' },
  counter: { ...typography.bodyStrong, color: colors.primary, writingDirection: 'ltr' },
  progress: { height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden', alignItems: 'flex-end' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  caption: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.sm },
  body: { ...typography.body, color: colors.textSubtle, textAlign: 'right' },
  phone: { ...typography.bodyStrong, color: colors.primary, writingDirection: 'ltr', textAlign: 'right', marginBottom: spacing.sm },
  verified: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successBg, padding: spacing.md, borderRadius: radius.md },
  verifiedText: { ...typography.body, color: colors.success, textAlign: 'right', flex: 1 },
  required: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  requiredText: { ...typography.bodyStrong, color: colors.primary, flex: 1, textAlign: 'right' },
  uploadRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  summary: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  summaryText: { ...typography.body, color: colors.success, flex: 1, textAlign: 'right' },
  link: { minHeight: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  linkText: { ...typography.bodyStrong, color: colors.primary },
  pressed: { opacity: 0.7 },
});
