// Powered by OnSpace.AI
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useAlert, useAuth } from '@/template';
import { useBooking } from '@/hooks/useBooking';
import { RoleSwitcher } from '@/components/feature/RoleSwitcher';
import { Button } from '@/components/ui/Button';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';

const MENU: { icon: string; label: string; route?: string }[] = [
  { icon: 'account-edit', label: 'تعديل بيانات الحساب', route: '/edit-profile' },
  { icon: 'file-document-outline', label: 'الوثائق والتوثيق' },
  { icon: 'star-outline', label: 'التقييمات' },
  { icon: 'help-circle-outline', label: 'المساعدة والدعم' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const auth = useAuth();
  const booking = useBooking();
  const logout = async () => {
    if (!booking.authenticated) { router.replace('/auth'); return; }
    const result = await auth.logout();
    if (result.error) { showAlert('تعذر تسجيل الخروج', result.error); return; }
    router.replace('/auth');
  };
  const { role, setRole, merchantName, driverName, merchantProfile, driverProfile } = useApp();
  const isMerchant = role === 'merchant';
  const name = isMerchant ? merchantName : driverName;
  const profile = isMerchant ? merchantProfile : driverProfile;
  const province = profile.province;
  const phone = profile.phone;

  const openMenu = (item: { label: string; route?: string }) => {
    if (item.route) router.push(item.route as any);
    else showAlert('قريباً', 'هذه الميزة قيد التطوير.');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name={isMerchant ? 'store' : 'truck'} size={34} color={colors.onPrimary} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.verified}>
          <MaterialCommunityIcons name="check-decagram" size={14} color={colors.info} />
          <Text style={styles.verifiedText}>{booking.authenticated ? 'حساب مسجّل على الخادم' : 'حساب تجريبي محلي'}</Text>
        </View>
        {(province || phone) ? (
          <View style={styles.chipsRow}>
            {province ? (
              <View style={styles.infoChip}>
                <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
                <Text style={styles.infoChipText}>{province}</Text>
              </View>
            ) : null}
            {phone ? (
              <View style={styles.infoChip}>
                <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
                <Text style={[styles.infoChipText, styles.phoneText]}>{phone}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isMerchant && (merchantProfile.companyName || merchantProfile.location) ? (
          <View style={styles.merchantInfo}>
            {merchantProfile.companyName ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="office-building" size={18} color={colors.primary} />
                <Text style={styles.infoRowText}>{merchantProfile.companyName}</Text>
              </View>
            ) : null}
            {merchantProfile.location ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.primary} />
                <Text style={styles.infoRowText}>{merchantProfile.location}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {!booking.authenticated ? <>
        <Text style={styles.switchLabel}>تبديل الحساب (وضع تجريبي)</Text>
        <RoleSwitcher role={role} onChange={setRole} />
        <Button title="تسجيل الدخول الآمن" onPress={() => router.push('/login')} />
      </> : <Text style={styles.switchLabel}>نوع الحساب ثابت · الحجوزات محفوظة على الخادم</Text>}

      <View style={styles.menu}>
        {MENU.map((m) => (
          <Pressable
            key={m.label}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
            onPress={() => openMenu(m)}
            accessibilityRole="button"
            accessibilityLabel={m.label}
          >
            <MaterialCommunityIcons name={m.icon as any} size={22} color={colors.primary} />
            <Text style={styles.menuText}>{m.label}</Text>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Button title="تسجيل الخروج" variant="outline" onPress={logout} loading={auth.operationLoading} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, ...shadow.card },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  verified: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { ...typography.caption, color: colors.textSubtle },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  infoChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceTint, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  infoChipText: { ...typography.label, color: colors.primary },
  phoneText: { writingDirection: 'ltr' },
  merchantInfo: { width: '100%', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  infoRowText: { ...typography.body, color: colors.text, flex: 1, textAlign: 'right' },
  switchLabel: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.sm },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginVertical: spacing.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuPressed: { backgroundColor: colors.surfaceTint },
  menuText: { ...typography.body, color: colors.text, flex: 1, textAlign: 'right' },
});
