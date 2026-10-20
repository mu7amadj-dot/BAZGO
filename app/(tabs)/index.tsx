// Powered by OnSpace.AI
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { FreightRequest } from '@/services/types';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { width } = useViewport();
  const { isMerchant, matchedIds, featuredRequests } = useFreightOverview();
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
        ListEmptyComponent={<EmptyState title={isMerchant ? 'لا توجد طلبات منشورة فعالة' : 'لا توجد حمولات بعد'} subtitle={isMerchant ? 'انشر حمولة جديدة عبر «اطلب ناقل». لا تظهر هنا الطلبات المسلّمة أو المكتملة أو الملغاة.' : 'ستظهر الحمولات المنشورة هنا.'} />}
        ListHeaderComponent={
          <View>
            <MarketConnectionBanner />
            {isMerchant ? (
              <>
                <View style={styles.topbar}>
                  <BrandMark compact showSlogan={false} />
                  <View style={styles.roleBadge}><MaterialCommunityIcons name="store-outline" size={18} color={colors.primary} /><Text style={styles.roleText}>تاجر</Text></View>
                </View>
                <View style={styles.actionsRow}>
                  <Pressable onPress={createRequest} style={({ pressed }) => [styles.actionCard, styles.primaryCard, pressed ? styles.actionPressed : null]} accessibilityRole="button" accessibilityLabel="اطلب ناقل">
                    <MaterialCommunityIcons name="truck-plus-outline" size={36} color={colors.onPrimary} />
                    <Text style={[styles.actionTitle, styles.primaryText]}>اطلب ناقل</Text>
                    <Text style={[styles.actionSubtitle, styles.primaryText]}>انشر حمولة جديدة</Text>
                  </Pressable>
                  <Pressable onPress={sharedTransport} style={({ pressed }) => [styles.actionCard, pressed ? styles.actionPressed : null]} accessibilityRole="button" accessibilityLabel="نقل مشترك">
                    <MaterialCommunityIcons name="truck-delivery-outline" size={36} color={colors.primary} />
                    <Text style={styles.actionTitle}>نقل مشترك</Text>
                    <Text style={styles.actionSubtitle}>مساحة شاغرة على نفس مسارك</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isMerchant ? 'طلباتي المنشورة الفعالة' : 'حمولات مقترحة لك'}</Text>
              {!isMerchant ? <Pressable onPress={openRequests} style={({ pressed }) => [styles.seeAllButton, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="عرض كل الطلبات"><Text style={styles.seeAll}>عرض الكل</Text></Pressable> : null}
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
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.md, width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center', marginBottom: spacing.md },
  actionCard: { flex: 1, minWidth: 0, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  primaryCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionTitle: { ...typography.section, color: colors.text, textAlign: 'center' },
  actionSubtitle: { ...typography.caption, color: colors.textSubtle, textAlign: 'center' },
  primaryText: { color: colors.onPrimary },
  actionPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm },
  sectionTitle: { ...typography.section, color: colors.text },
  seeAllButton: { minHeight: layout.touchTarget, minWidth: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  seeAll: { ...typography.label, color: colors.primary },
  item: { flex: 1, minWidth: 0 },
  twoColumns: { paddingHorizontal: spacing.xs, maxWidth: '50%' },
  pressed: { opacity: 0.8 },
});
