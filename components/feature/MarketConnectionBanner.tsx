import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBooking } from '@/hooks/useBooking';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
interface MarketConnectionBannerProps {}
export const MarketConnectionBanner = memo(function MarketConnectionBanner(_: MarketConnectionBannerProps) {
  const booking = useBooking();
  const router = useRouter();
  if (booking.authenticated && !booking.syncError && !booking.loading) return null;
  return <View style={styles.card}>
    <MaterialCommunityIcons name={booking.syncError ? 'cloud-alert-outline' : 'shield-lock-outline'} color={colors.warning} size={22} />
    <Text style={styles.text}>{!booking.authenticated ? 'وضع تجريبي محلي · الحجز الآمن يتطلب تسجيل الدخول' : booking.syncError ? `تعذر المزامنة: ${booking.syncError}` : 'جارٍ تحميل بيانات الخادم...'}</Text>
    {!booking.authenticated ? <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.link}>دخول آمن</Text></Pressable> : booking.syncError ? <Pressable onPress={() => { void booking.reload(); }} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.link}>إعادة المحاولة</Text></Pressable> : null}
  </View>;
});
const styles=StyleSheet.create({
  card:{flexDirection:'row-reverse',alignItems:'center',gap:spacing.sm,backgroundColor:colors.warningBg,borderRadius:radius.md,padding:spacing.sm,marginBottom:spacing.md},
  text:{...typography.label,color:colors.warning,textAlign:'right',flex:1},
  button:{minHeight:layout.touchTarget,justifyContent:'center',paddingHorizontal:spacing.sm},link:{...typography.label,color:colors.primary},pressed:{opacity:0.7},
});
