import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecureLogin } from '@/hooks/useSecureLogin';
import { BrandMark } from '@/components/feature/BrandMark';
import { AccountTypePicker } from '@/components/feature/AccountTypePicker';
import { SessionLoading } from '@/components/auth/AccountGate';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function LoginScreen() {
  const login = useSecureLogin();
  const isMerchant = login.role === 'merchant';
  if (login.loading) return <SessionLoading />;
  if (login.user && login.account) return <Redirect href="/" />;
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandMark />
        <View style={styles.intro}><MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} /><Text style={styles.introText}>حسابات حقيقية · بيانات محفوظة على الخادم</Text></View>
        {login.user ? login.syncError ? <Text style={styles.subtitle}>تعذر تحميل حسابك. أعد المزامنة قبل المتابعة.</Text> : <View pointerEvents={login.operationLoading ? 'none' : 'auto'}>
          <Text style={styles.title}>أكمل بيانات حسابك</Text>
          <Text style={styles.subtitle}>اختر نوع الحساب أولاً، ثم أدخل بياناتك. لا يمكن تغيير نوع الحساب بعد الحفظ.</Text>
          <AccountTypePicker selectedRole={login.role} onSelect={login.setRole} />
          {login.role ? <>
            <Field compact icon="account-outline" label={isMerchant ? 'الاسم الكامل' : 'اسم السائق'} value={login.form.name} onChangeText={(value) => login.setField('name', value)} editable={!login.operationLoading} />
            {isMerchant ? <>
              <Field compact icon="office-building-outline" label="اسم الشركة / المعمل" value={login.form.companyName} onChangeText={(value) => login.setField('companyName', value)} editable={!login.operationLoading} />
              <Field compact icon="map-marker-outline" label="الموقع · المدينة / المنطقة" value={login.form.location} onChangeText={(value) => login.setField('location', value)} editable={!login.operationLoading} />
            </> : <>
              <Field compact icon="account-outline" label="اسم الأب" value={login.form.fatherName} onChangeText={(value) => login.setField('fatherName', value)} editable={!login.operationLoading} />
              <Field compact icon="account-outline" label="اسم الجد" value={login.form.grandfatherName} onChangeText={(value) => login.setField('grandfatherName', value)} editable={!login.operationLoading} />
            </>}
            <Field compact icon="phone-outline" label="رقم الهاتف للتواصل" value={login.form.phone} onChangeText={(value) => login.setField('phone', value)} placeholder="07XXXXXXXXX" keyboardType="phone-pad" editable={!login.operationLoading} />
            <SelectField compact icon="map-marker-outline" label="المحافظة" title="اختر المحافظة" items={login.provinceItems} selectedId={login.form.province} onSelect={(value) => login.setField('province', value)} />
            {!isMerchant ? <>
              <SelectField compact icon="truck-outline" label="نوع المركبة" title="اختر نوع المركبة" items={login.vehicleItems} selectedId={login.form.vehicleType} onSelect={(value) => login.setField('vehicleType', value)} />
              <Field compact icon="weight-kilogram" label="أقصى حمولة (طن)" value={login.form.maxCapacity} onChangeText={(value) => login.setField('maxCapacity', value)} keyboardType="numeric" editable={!login.operationLoading} />
              <Text style={styles.label}>صور السائق والمركبة (اختياري)</Text>
              <View style={styles.uploadRow}>
                <ImageUpload label="صورة السائق" value={login.form.driverPhoto} onChange={(value) => login.setField('driverPhoto', value)} icon="account-outline" disabled={login.operationLoading} />
                <ImageUpload label="إجازة السوق" value={login.form.licensePhoto} onChange={(value) => login.setField('licensePhoto', value)} icon="card-account-details-outline" disabled={login.operationLoading} />
                <ImageUpload label="صورة الشاحنة" value={login.form.vehiclePhoto} onChange={(value) => login.setField('vehiclePhoto', value)} icon="truck-outline" disabled={login.operationLoading} />
              </View>
              <Text style={styles.caption}>الصور تُرفع إلى تخزين خاص بحسابك؛ رفع الوثائق لا يعني اعتمادها أو توثيقها تلقائياً.</Text>
            </> : null}
          </> : <Text style={styles.subtitle}>اختر تاجر أو سائق لعرض الحقول.</Text>}
        </View> : <View>
          <Text style={styles.title}>{login.mode === 'register' ? 'إنشاء حساب' : 'تسجيل الدخول'}</Text>
          <Text style={styles.subtitle}>التحقق عبر البريد الإلكتروني. رقم الهاتف يُضاف للتواصل بعد التحقق، ولا تُرسل رموز SMS.</Text>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput style={styles.input} accessibilityLabel="البريد الإلكتروني" value={login.email} onChangeText={login.setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" editable={!login.operationLoading && !login.codeSent} />
          <Text style={styles.label}>كلمة المرور · 6 أحرف على الأقل</Text>
          <TextInput style={styles.input} accessibilityLabel="كلمة المرور" value={login.password} onChangeText={login.setPassword} secureTextEntry textContentType={login.mode === 'register' ? 'newPassword' : 'password'} editable={!login.operationLoading && !login.codeSent} />
          {login.mode === 'register' ? <>
            <Text style={styles.label}>تأكيد كلمة المرور</Text>
            <TextInput style={styles.input} accessibilityLabel="تأكيد كلمة المرور" value={login.confirmation} onChangeText={login.setConfirmation} secureTextEntry editable={!login.operationLoading && !login.codeSent} />
            {login.codeSent ? <>
              <Text style={styles.subtitle}>أدخل الرمز المرسل إلى {login.email}. تحقق من مجلد الرسائل غير المرغوب فيها أيضاً.</Text>
              <Field label="رمز البريد الإلكتروني (4 أرقام)" value={login.otp} onChangeText={login.setOtp} keyboardType="numeric" editable={!login.operationLoading} />
              <Button variant="ghost" title={login.seconds ? `إعادة الإرسال خلال ${login.seconds} ثانية` : 'إعادة إرسال الرمز'} onPress={login.resend} disabled={login.seconds > 0 || login.operationLoading} />
            </> : null}
          </> : null}
        </View>}
        {login.error || login.syncError ? <View style={styles.error}><MaterialCommunityIcons name="alert-circle-outline" color={colors.danger} size={20} /><Text style={styles.errorText}>{login.error || login.syncError}</Text></View> : null}
        {login.notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{login.notice}</Text> : null}
        {login.syncError && login.user ? <Button title="إعادة تحميل الحساب" onPress={login.reload} /> : <Button
          title={login.user ? 'حفظ الحساب والمتابعة' : login.mode === 'login' ? 'تسجيل الدخول' : login.codeSent ? 'تحقق وأنشئ الحساب' : 'إرسال رمز التحقق'}
          onPress={login.submit} loading={login.operationLoading} disabled={!!login.user && !login.role} />}
        {!login.user ? <Pressable onPress={login.toggle} disabled={login.operationLoading} accessibilityRole="button" style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>{login.mode === 'login' ? 'إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}</Text></Pressable> : <Button title="تسجيل الخروج" variant="ghost" onPress={login.logout} loading={login.operationLoading} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center', padding: spacing.md, gap: spacing.md },
  intro: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.surfaceTint, borderRadius: radius.md, padding: spacing.md },
  introText: { ...typography.label, color: colors.primary, flexShrink: 1, textAlign: 'right' },
  title: { ...typography.title, color: colors.text, textAlign: 'right', marginVertical: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.xs },
  caption: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.sm },
  uploadRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  input: { ...typography.body, backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, minHeight: layout.touchTarget, padding: spacing.md, marginBottom: spacing.md },
  link: { minHeight: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  linkText: { ...typography.bodyStrong, color: colors.primary }, pressed: { opacity: 0.7 },
  error: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.danger, flex: 1, textAlign: 'right' },
  notice: { ...typography.body, color: colors.success, textAlign: 'right' },
});
