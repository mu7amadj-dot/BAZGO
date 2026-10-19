// Powered by OnSpace.AI
import React, { useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/auth'), 1900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary, colors.primaryLight]} style={styles.wrap}>
      <View style={styles.logoWrap}>
        <Image
          source={require('@/assets/images/bazgo-logo.png')}
          style={styles.logo}
          contentFit="contain"
          transition={300}
        />
      </View>
      <Text style={styles.brand}>BAZGO</Text>
      <Text style={styles.slogan}>انقل بضاعتك بذكاء</Text>
      <Text style={styles.sloganEn}>Move Your Cargo Smarter</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logo: { width: 96, height: 96 },
  brand: { fontSize: 40, fontWeight: '800', color: colors.onPrimary, letterSpacing: 2 },
  slogan: { ...typography.section, color: colors.emphasis, marginTop: spacing.sm },
  sloganEn: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 1 },
});
