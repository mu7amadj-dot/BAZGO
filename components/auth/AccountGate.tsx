import React, { memo, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import { Button } from '@/components/ui/Button';
import { colors, layout, spacing, typography } from '@/constants/theme';

export function SessionLoading() {
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><ActivityIndicator color={colors.primary} /><Text style={styles.body}>جارٍ تحميل حسابك...</Text></SafeAreaView>;
}
interface AccountGateProps { children: ReactNode; }
export const AccountGate = memo(function AccountGate({ children }: AccountGateProps) {
  const access = useAccountAccess();
  if (access.loading) return <SessionLoading />;
  if (!access.user) return <Redirect href="/" />;
  if (!access.account && access.error) return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.content}>
      <MaterialCommunityIcons name="cloud-off-outline" size={36} color={colors.danger} />
      <Text style={styles.title}>تعذر تحميل الحساب</Text><Text style={styles.body}>{access.error}</Text>
      <Button title="إعادة المحاولة" onPress={access.retry} />
      <Button title="تسجيل الخروج" variant="ghost" onPress={access.logout} loading={access.operationLoading} />
    </View>
  </SafeAreaView>;
  if (!access.account) return <Redirect href="/login" />;
  return <>{children}</>;
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  content: { width: '100%', maxWidth: layout.authMaxWidth, gap: spacing.md },
  title: { ...typography.title, color: colors.text, textAlign: 'right' }, body: { ...typography.body, color: colors.textSubtle, textAlign: 'right' },
});
