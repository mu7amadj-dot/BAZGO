// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { matchDrivers } from '@/services/matchingService';
import { FreightCard } from '@/components/feature/FreightCard';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { role, merchantName, driverName, requests, drivers, applications } = useApp();

  const isMerchant = role === 'merchant';
  const name = isMerchant ? merchantName : driverName;

  const openCount = requests.filter((r) => r.status === 'open' || r.status === 'applications').length;
  const myApplied = applications.length;

  const matchedForDriver = useMemo(() => {
    return requests.filter((r) => drivers.some((d) => d.vehicleType === r.vehicleType && d.maxCapacity >= r.weightTons));
  }, [requests, drivers]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.hello}>مرحباً بك في BAZGO</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={styles.brandPill}>
            <MaterialCommunityIcons name="truck-fast" size={18} color={colors.emphasis} />
            <Text style={styles.brandPillText}>{isMerchant ? 'تاجر' : 'سائق'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isMerchant ? openCount : matchedForDriver.length}</Text>
            <Text style={styles.statLabel}>{isMerchant ? 'طلبات نشطة' : 'حمولات مطابقة'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isMerchant ? applications.length : myApplied}</Text>
            <Text style={styles.statLabel}>{isMerchant ? 'عروض سائقين' : 'طلباتي المقدمة'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {isMerchant ? (
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.actionCard, styles.actionPrimary, pressed && styles.pressed]} onPress={() => router.push('/create-request')}>
              <MaterialCommunityIcons name="truck-plus" size={30} color={colors.onPrimary} />
              <Text style={styles.actionTitlePrimary}>اطلب ناقل</Text>
              <Text style={styles.actionSubPrimary}>انشر طلب نقل جديد</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionCard, styles.actionAlt, pressed && styles.pressed]}
              onPress={() => showAlert('النقل المشترك', 'ميزة إيجاد شاحنة بمساحة فارغة على نفس المسار قادمة قريباً في BAZGO.')}
            >
              <MaterialCommunityIcons name="truck-delivery-outline" size={30} color={colors.primary} />
              <Text style={styles.actionTitle}>نقل مشترك</Text>
              <Text style={styles.actionSub}>شاحنة على نفس المسار</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={({ pressed }) => [styles.driverCta, pressed && styles.pressed]} onPress={() => router.push('/(tabs)/requests')}>
            <View style={styles.driverCtaText}>
              <Text style={styles.driverCtaTitle}>تصفّح الحمولات المتاحة</Text>
              <Text style={styles.driverCtaSub}>{matchedForDriver.length} حمولة قد تناسب مركبتك الآن</Text>
            </View>
            <MaterialIcons name="arrow-back" size={22} color={colors.onPrimary} />
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isMerchant ? 'أحدث الطلبات' : 'حمولات مقترحة لك'}</Text>
          <Pressable onPress={() => router.push('/(tabs)/requests')} hitSlop={8}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
        </View>

        {requests.slice(0, 3).map((r) => (
          <FreightCard
            key={r.id}
            request={r}
            matched={!isMerchant && matchDrivers(r, drivers).length > 0}
            onPress={() => router.push(isMerchant ? `/applicants/${r.id}` : `/freight/${r.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  heroTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  hello: { ...typography.caption, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  name: { ...typography.title, color: colors.onPrimary, textAlign: 'right', marginTop: 2 },
  brandPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  brandPillText: { ...typography.label, color: colors.onPrimary },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.onPrimary },
  statLabel: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 120, justifyContent: 'center', ...shadow.card },
  actionPrimary: { backgroundColor: colors.primary },
  actionAlt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionTitlePrimary: { ...typography.section, color: colors.onPrimary, textAlign: 'right', marginTop: spacing.sm },
  actionSubPrimary: { ...typography.caption, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 2 },
  actionTitle: { ...typography.section, color: colors.text, textAlign: 'right', marginTop: spacing.sm },
  actionSub: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  driverCta: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.emphasisDark, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadow.card },
  driverCtaText: { flex: 1 },
  driverCtaTitle: { ...typography.section, color: colors.onPrimary, textAlign: 'right' },
  driverCtaSub: { ...typography.caption, color: 'rgba(255,255,255,0.9)', textAlign: 'right', marginTop: 2 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { ...typography.section, color: colors.text },
  seeAll: { ...typography.label, color: colors.primary },
});
