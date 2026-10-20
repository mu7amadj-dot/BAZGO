import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecureLogin } from '@/hooks/useSecureLogin';
import { BrandMark } from '@/components/feature/BrandMark';
import { AccountTypePicker } from '@/components/feature/AccountTypePicker';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
export default function LoginScreen() {
  const login = useSecureLogin();
  if (login.user && login.account) return <Redirect href="/" />;
  return <SafeAreaView style={styles.screen} edges={['top','bottom']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandMark />
        <Text style={styles.title}>حساب BAZGO الآمن</Text>
        <Text style={styles.subtitle}>الحجوزات والمحادثات محفوظة على الخادم. الدخول التجريبي لا يتيح حجز حمولات حقيقية.</Text>
        {login.user ? login.loading ? <ActivityIndicator color={colors.primary} /> : <View>
          <Text style={styles.title}>أكمل إعداد حسابك</Text>
          <Text style={styles.subtitle}>نوع الحساب ثابت بعد الحفظ.</Text>
          <AccountTypePicker selectedRole={login.role} onSelect={login.setRole} />
          <Field label="الاسم المعروض" value={login.name} onChangeText={login.setName} />
        </View> : <View>
          <Text style={styles.title}>{login.mode === 'register' ? 'إنشاء حساب' : 'تسجيل الدخول'}</Text>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput style={styles.input} accessibilityLabel="البريد الإلكتروني" value={login.email} onChangeText={login.setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!login.operationLoading && !login.codeSent} />
          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput style={styles.input} accessibilityLabel="كلمة المرور" value={login.password} onChangeText={login.setPassword} secureTextEntry editable={!login.operationLoading && !login.codeSent} />
          {login.mode === 'register' ? <>
            <Text style={styles.label}>تأكيد كلمة المرور</Text>
            <TextInput style={styles.input} accessibilityLabel="تأكيد كلمة المرور" value={login.confirmation} onChangeText={login.setConfirmation} secureTextEntry editable={!login.operationLoading && !login.codeSent} />
            {login.codeSent ? <>
              <Field label="رمز البريد الإلكتروني (4 أرقام)" value={login.otp} onChangeText={login.setOtp} keyboardType="numeric" />
              <Button variant="ghost" title={login.seconds ? `إعادة الإرسال خلال ${login.seconds} ثانية` : 'إعادة إرسال الرمز'} onPress={login.resend} disabled={login.seconds > 0 || login.operationLoading} />
            </> : null}
          </> : null}
        </View>}
        {login.error || login.syncError ? <View style={styles.error}><MaterialCommunityIcons name="alert-circle-outline" color={colors.danger} size={20} /><Text style={styles.errorText}>{login.error || login.syncError}</Text></View> : null}
        <Button title={login.user ? 'حفظ نوع الحساب والمتابعة' : login.mode === 'login' ? 'تسجيل الدخول' : login.codeSent ? 'تحقق وأنشئ الحساب' : 'إرسال رمز تحقق البريد'} onPress={login.submit} loading={login.operationLoading} disabled={login.loading || (!!login.user && !login.name.trim())} />
        {!login.user ? <Pressable onPress={login.toggle} disabled={login.operationLoading} style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>{login.mode === 'login' ? 'إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}</Text></Pressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center', padding: spacing.md, gap: spacing.md },
  title: { ...typography.title, color: colors.text, textAlign: 'right', marginVertical: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.xs },
  input: { ...typography.body, backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, minHeight: layout.touchTarget, padding: spacing.md, marginBottom: spacing.md },
  link: { minHeight: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  linkText: { ...typography.bodyStrong, color: colors.primary }, pressed: { opacity: 0.7 },
  error: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.danger, flex: 1, textAlign: 'right' },
});
