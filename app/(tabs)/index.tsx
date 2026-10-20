// Powered by OnSpace.AI
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useFreightOverview } from '@/hooks/useFreightOverview';
import { useViewport } from '@/hooks/useViewport';
import { BrandMark } from '@/components/feature/BrandMark';
import { MarketConnectionBanner } from '@/components/feature/MarketConnectionBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FreightCard } from '@/components/feature/FreightCard';
import { Button } from '@/components/ui/Button';
import { FreightRequest } from '@/services/types';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { width } = useViewport();
  const { isMerchant, name, openCount, applicationCount, matchedIds, featuredRequests } = useFreightOverview();
  const columns = width >= layout.tabletBreakpoint ? 2 : 1;
  const createRequest = useCallback(() => router.push('/create-request'), [router]);
  const openRequests = useCallback(() => router.push('/(tabs)/requests'), [router]);
  const sharedTransport = useCallback(() => showAlert('النقل المشترك', 'ميزة إيجاد شاحنة بمساحة فارغة على نفس المسار قادمة قريباً في BAZGO.'), [showAlert]);
  const openFreight = useCallback((id: string) => router.push(isMerchant ? `/applicants/${id}` : `/freight/${id}`), [isMerchant, router]);
  const renderItem = useCallback(({ item }: { item: FreightRequest }) => (
    <View style={[styles.item, columns === 2 ? styles.twoColumns : null]}>
      <FreightCard request={item} matched={!isMerchant && matchedIds.has(item.id)} onPress={() => openFreight(item.id)} />
    </View>
  ), [columns, isMerchant, matchedIds, openFreight]);
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList key={`home-${columns}`} data={featuredRequests} numColumns={columns} keyExtractor={(request) => request.id}
        style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} renderItem={renderItem}
        ListEmptyComponent={<EmptyState title="لا توجد حمولات بعد" subtitle={isMerchant ? 'انشر حمولة لبدء التفاوض مع السائقين.' : 'ستظهر الحمولات المنشورة هنا.'} />}
        ListHeaderComponent={
          <View>
            <MarketConnectionBanner />
            {isMerchant ? (
              <>
                <View style={styles.topbar}>
                  <BrandMark compact showSlogan={false} />
                  <View style={styles.roleBadge}><MaterialCommunityIcons name="store-outline" size={18} color={colors.primary} /><Text style={styles.roleText}>تاجر</Text></View>
                </View>
                <LinearGradient colors={[colors.surface, colors.background]} style={styles.hero}>
                  <Text style={styles.hello}>مرحباً بك، {name}</Text>
                  <Text style={styles.heroTitle}>بضاعتك تستحق ناقلاً موثوقاً</Text>
                  <Text style={styles.heroSubtitle}>انشر حمولتك واختر السائق المناسب لمسارك.</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}><Text style={styles.statValue}>{openCount}</Text><Text style={styles.statLabel}>طلبات نشطة</Text></View>
                    <View style={styles.stat}><Text style={styles.statValue}>{applicationCount}</Text><Text style={styles.statLabel}>عروض السائقين</Text></View>
                  </View>
                  <Button title="اطلب ناقل" onPress={createRequest} icon={<MaterialCommunityIcons name="truck-plus-outline" size={22} color={colors.onPrimary} />} />
                </LinearGradient>
              </>
            ) : null}
            {isMerchant ? <Pressable onPress={sharedTransport} style={({ pressed }) => [styles.sharedCard, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="النقل المشترك">
              <View style={styles.sharedIcon}><MaterialCommunityIcons name="truck-delivery-outline" size={28} color={colors.primary} /></View>
              <View style={styles.sharedText}><Text style={styles.sharedTitle}>نقل مشترك</Text><Text style={styles.sharedSubtitle}>مساحة شاغرة على نفس مسارك</Text></View>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textMuted} />
            </Pressable> : null}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isMerchant ? 'أحدث طلبات النقل' : 'حمولات مقترحة لك'}</Text>
              <Pressable onPress={openRequests} style={({ pressed }) => [styles.seeAllButton, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="عرض كل الطلبات"><Text style={styles.seeAll}>عرض الكل</Text></Pressable>
            </View>
          </View>
        } />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  roleBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  roleText: { ...typography.label, color: colors.text },
  hero: { padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  hello: { ...typography.label, color: colors.primary, textAlign: 'right', marginBottom: spacing.sm },
  heroTitle: { ...typography.title, color: colors.text, textAlign: 'right' },
  heroSubtitle: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginVertical: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { ...typography.display, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSubtle, textAlign: 'center' },
  sharedCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  sharedIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceSelected, alignItems: 'center', justifyContent: 'center' },
  sharedText: { flex: 1 },
  sharedTitle: { ...typography.section, color: colors.text, textAlign: 'right' },
  sharedSubtitle: { ...typography.caption, color: colors.textSubtle, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm },
  sectionTitle: { ...typography.section, color: colors.text },
  seeAllButton: { minHeight: layout.touchTarget, minWidth: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  seeAll: { ...typography.label, color: colors.primary },
  item: { flex: 1, minWidth: 0 },
  twoColumns: { paddingHorizontal: spacing.xs, maxWidth: '50%' },
  pressed: { opacity: 0.8 },
});
