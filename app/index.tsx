// Powered by OnSpace.AI
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Redirect } from 'expo-router';
import { AuthRouter, useAuth } from '@/template';
import { useBooking } from '@/hooks/useBooking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/feature/BrandMark';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const booking = useBooking();
  useEffect(() => {
    if (user || loading) return;
    const timer = setTimeout(() => router.replace('/auth'), 1900);
    return () => clearTimeout(timer);
  }, [router, user, loading]);
  if (user && !booking.loading) return <AuthRouter loginRoute="/login"><Redirect href={booking.account ? '/(tabs)' : '/login'} /></AuthRouter>;
  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.screen}>
      <SafeAreaView style={styles.content}>
        <BrandMark />
        <View style={styles.line} />
        <Text style={styles.caption}>نقل بضاعتك يبدأ من هنا</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  line: { width: 40, height: 3, borderRadius: radius.pill, backgroundColor: colors.primary, marginTop: spacing.xl, marginBottom: spacing.md },
  caption: { ...typography.body, color: colors.textSubtle },
});
