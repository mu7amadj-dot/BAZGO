// Powered by OnSpace.AI
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { UserRole } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

const codeLength = 6;
const demoCode = '123456';
const resendSeconds = 60;
const cells = [0, 1, 2, 3, 4, 5];
export default function OtpScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { setRole, setNames } = useApp();
  const params = useLocalSearchParams<{ role?: string; name?: string; phone?: string }>();
  const role: UserRole = params.role === 'driver' ? 'driver' : 'merchant';
  const name = params.name || (role === 'merchant' ? 'التاجر' : 'السائق');
  const phone = params.phone || '07701234567';
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(resendSeconds);
  const [error, setError] = useState('');
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const timeText = useMemo(() => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`, [seconds]);
  const onChange = (text: string) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, codeLength));
    setError('');
  };
  const verify = () => {
    if (code.length < codeLength) return;
    if (code !== demoCode) {
      setError('الرمز غير صحيح. جرّب الرمز 123456');
      setCode('');
      inputRef.current?.focus();
      return;
    }
    if (role === 'merchant') setNames(name, '');
    else setNames('', name);
    setRole(role);
    router.replace('/(tabs)');
  };
  const resend = () => {
    if (seconds > 0) return;
    setCode(''); setError(''); setSeconds(resendSeconds);
    inputRef.current?.focus();
    showAlert('تم تجديد الرمز التجريبي', `رمز التحقق المحلي للرقم ${phone}: ${demoCode}. لا تُرسل رسائل SMS في هذه النسخة.`);
  };
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topbar}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="رجوع">
              <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.roleBadge}><MaterialCommunityIcons name={role === 'merchant' ? 'store-outline' : 'truck-outline'} size={18} color={colors.primary} /><Text style={styles.roleText}>{role === 'merchant' ? 'تاجر' : 'سائق'}</Text></View>
          </View>
          <View style={styles.hero}>
            <View style={styles.shield}><MaterialCommunityIcons name="shield-check-outline" size={36} color={colors.primary} /></View>
            <Text style={styles.title}>تأكيد رقم الهاتف</Text>
            <Text style={styles.subtitle}>أدخل رمز التحقق المكوّن من 6 أرقام</Text>
          </View>
          <Text style={styles.sentTo}>التحقق التجريبي للرقم</Text>
          <Text style={styles.phone}>{phone}</Text>
          <View style={styles.mockBanner}><MaterialCommunityIcons name="information-outline" size={18} color={colors.warning} /><Text style={styles.mockText}>MOCK LOGIN — رمز التحقق: {demoCode}</Text></View>
          <Pressable style={({ pressed }) => [styles.otpRow, pressed ? styles.pressed : null]} onPress={() => inputRef.current?.focus()}>
            {cells.map((index) => (
              <View key={index} style={[styles.cell, code[index] || index === code.length ? styles.cellActive : null, error ? styles.cellError : null]}><Text style={styles.cellText}>{code[index] ?? ''}</Text></View>
            ))}
            <TextInput ref={inputRef} value={code} onChangeText={onChange} keyboardType="number-pad" maxLength={codeLength} autoFocus caretHidden textContentType="oneTimeCode" style={styles.hiddenInput} accessibilityLabel="رمز التحقق المكوّن من ستة أرقام" />
          </Pressable>
          {error ? <View style={styles.errorRow}><MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}
          <View style={styles.resendRow}>
            {seconds > 0 ? <Text style={styles.timer}>إعادة إرسال الرمز خلال {timeText}</Text> : <Pressable onPress={resend} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="إعادة إرسال الرمز"><Text style={styles.resendText}>إعادة إرسال الرمز</Text></Pressable>}
          </View>
          <Button title="تأكيد وتفعيل الحساب" variant="emphasis" disabled={code.length < codeLength} onPress={verify} />
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="تغيير رقم الهاتف"><Text style={styles.changeText}>تغيير رقم الهاتف</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center' },
  topbar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  roleBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  roleText: { ...typography.label, color: colors.text },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  shield: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceSelected, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSubtle, textAlign: 'center', marginTop: spacing.sm },
  sentTo: { ...typography.body, color: colors.textSubtle, textAlign: 'center' },
  phone: { ...typography.section, color: colors.text, textAlign: 'center', writingDirection: 'ltr', marginTop: spacing.xs },
  mockBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.lg },
  mockText: { ...typography.caption, color: colors.warning, flexShrink: 1 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  cell: { flex: 1, height: 56, maxWidth: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellActive: { borderColor: colors.primary, backgroundColor: colors.surfaceSelected },
  cellError: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  cellText: { ...typography.title, color: colors.text },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  errorRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  errorText: { ...typography.caption, color: colors.danger, flexShrink: 1 },
  resendRow: { alignItems: 'center', justifyContent: 'center', minHeight: 72 },
  timer: { ...typography.body, color: colors.textMuted },
  resendText: { ...typography.bodyStrong, color: colors.primary },
  secondaryButton: { minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  changeText: { ...typography.label, color: colors.textSubtle },
  pressed: { opacity: 0.75 },
});
