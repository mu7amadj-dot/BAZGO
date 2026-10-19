// Powered by OnSpace.AI
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { UserRole } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

const CODE_LENGTH = 6;
const DEMO_CODE = '123456';
const RESEND_SECONDS = 60;
const CELLS = [0, 1, 2, 3, 4, 5];

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { setRole, setNames } = useApp();
  const params = useLocalSearchParams<{ role?: string; name?: string; phone?: string }>();

  const role: UserRole = params.role === 'driver' ? 'driver' : 'merchant';
  const name = (params.name as string) || (role === 'merchant' ? 'التاجر' : 'السائق');
  const phone = (params.phone as string) || '0770 123 4567';

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const timeText = useMemo(() => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  }, [seconds]);

  const onChange = (t: string) => {
    const digits = t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError('');
  };

  const verify = () => {
    if (code.length < CODE_LENGTH) return;
    if (code !== DEMO_CODE) {
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
    setCode('');
    setError('');
    setSeconds(RESEND_SECONDS);
    inputRef.current?.focus();
    showAlert('تم إرسال الرمز', `أرسلنا رمزاً جديداً إلى ${phone}. رمز التجربة: ${DEMO_CODE}`);
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.heroTop}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <MaterialIcons name="arrow-forward" size={22} color={colors.onPrimary} />
          </Pressable>
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name={role === 'merchant' ? 'store' : 'truck'} size={16} color={colors.emphasis} />
            <Text style={styles.rolePillText}>{role === 'merchant' ? 'تاجر' : 'سائق'}</Text>
          </View>
        </View>

        <View style={styles.shield}>
          <MaterialCommunityIcons name="shield-check" size={34} color={colors.onPrimary} />
        </View>
        <Text style={styles.title}>تأكيد رقم الهاتف</Text>
        <Text style={styles.subtitle}>أدخل رمز التحقق المكوّن من 6 أرقام</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sentTo}>أرسلنا الرمز إلى الرقم</Text>
          <Text style={styles.phone}>{phone}</Text>

          <View style={styles.mockBanner}>
            <MaterialCommunityIcons name="test-tube" size={16} color={colors.emphasisDark} />
            <Text style={styles.mockText}>وضع تجريبي — رمز التحقق: {DEMO_CODE}</Text>
          </View>

          <Pressable style={styles.otpRow} onPress={() => inputRef.current?.focus()}>
            {CELLS.map((i) => {
              const char = code[i] ?? '';
              const filled = char !== '';
              const active = i === code.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    filled && styles.cellFilled,
                    active && styles.cellActive,
                    error ? styles.cellError : null,
                  ]}
                >
                  <Text style={styles.cellText}>{char}</Text>
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
              caretHidden
              textContentType="oneTimeCode"
              style={styles.hiddenInput}
              accessibilityLabel="رمز التحقق المكوّن من ستة أرقام"
            />
          </Pressable>

          {error ? (
            <View style={styles.errorRow}>
              <MaterialIcons name="error-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.timerText}>إعادة إرسال الرمز خلال {timeText}</Text>
            ) : (
              <Pressable onPress={resend} hitSlop={8} accessibilityRole="button" accessibilityLabel="إعادة إرسال الرمز">
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </Pressable>
            )}
          </View>

          <Button
            title="تأكيد وتفعيل الحساب"
            variant="emphasis"
            disabled={code.length < CODE_LENGTH}
            onPress={verify}
          />

          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.changeBtn}>
            <Text style={styles.changeText}>تغيير رقم الهاتف</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  rolePill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill,
  },
  rolePillText: { ...typography.label, color: colors.onPrimary },
  shield: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  title: { ...typography.title, color: colors.onPrimary, marginTop: spacing.sm },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sentTo: { ...typography.body, color: colors.textSubtle, textAlign: 'center' },
  phone: { ...typography.section, color: colors.text, textAlign: 'center', marginTop: 4, writingDirection: 'ltr' },
  mockBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.lg,
  },
  mockText: { ...typography.caption, color: colors.emphasisDark, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
  cell: {
    flex: 1, height: 56, maxWidth: 54, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  cellFilled: { borderColor: colors.primary, backgroundColor: colors.surfaceTint },
  cellActive: { borderColor: colors.primary },
  cellError: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  cellText: { fontSize: 24, fontWeight: '700', color: colors.text },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  errorRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  errorText: { ...typography.caption, color: colors.danger },
  resendRow: { alignItems: 'center', marginVertical: spacing.lg },
  timerText: { ...typography.body, color: colors.textMuted },
  resendText: { ...typography.bodyStrong, color: colors.primary },
  changeBtn: { alignItems: 'center', marginTop: spacing.md },
  changeText: { ...typography.label, color: colors.textSubtle },
});
