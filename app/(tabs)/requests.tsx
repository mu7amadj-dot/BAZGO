// Powered by OnSpace.AI
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { matchDrivers } from '@/services/matchingService';
import { PROVINCES, vehicleLabel, vehicleIcon } from '@/constants/config';
import { Header } from '@/components/layout/Header';
import { FreightCard } from '@/components/feature/FreightCard';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

export default function RequestsScreen() {
  const router = useRouter();
  const { role, requests, drivers, driverProfile } = useApp();
  const isMerchant = role === 'merchant';
  const [pickupProvince, setPickupProvince] = useState<string>('all');
  const [deliveryProvince, setDeliveryProvince] = useState<string>('all');

  // نوع مركبة السائق المثبت في حسابه (مع رجوع لبيانات السائق التجريبي عند غياب التسجيل)
  const myVehicleType = driverProfile.vehicleType || drivers[0]?.vehicleType || '';

  const provinceItems = useMemo(
    () => [
      { id: 'all', label: 'كل المحافظات', icon: 'map-marker-multiple' },
      ...PROVINCES.map((p) => ({ id: p, label: p, icon: 'map-marker' })),
    ],
    []
  );

  const hasActiveFilter = pickupProvince !== 'all' || deliveryProvince !== 'all';

  const resetFilters = useCallback(() => {
    setPickupProvince('all');
    setDeliveryProvince('all');
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (pickupProvince !== 'all' && r.pickupProvince !== pickupProvince) return false;
      if (deliveryProvince !== 'all' && r.deliveryProvince !== deliveryProvince) return false;
      // مطابقة نوع المركبة للسائق فقط
      if (!isMerchant && myVehicleType && r.vehicleType !== myVehicleType) return false;
      return true;
    });
  }, [requests, pickupProvince, deliveryProvince, isMerchant, myVehicleType]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header
          title={isMerchant ? 'طلباتي' : 'الحمولات المتاحة'}
          subtitle={`${filtered.length} ${isMerchant ? 'طلب' : 'حمولة'}`}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filterCard}>
            <View style={styles.filterTitleRow}>
              <View style={styles.filterTitleLeft}>
                <MaterialIcons name="tune" size={18} color={colors.primary} />
                <Text style={styles.filterTitle}>تصفية حسب المسار</Text>
              </View>
              {hasActiveFilter ? (
                <Pressable
                  onPress={resetFilters}
                  hitSlop={8}
                  style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="مسح الفلترة"
                >
                  <MaterialIcons name="close" size={14} color={colors.emphasis} />
                  <Text style={styles.clearText}>مسح</Text>
                </Pressable>
              ) : null}
            </View>

            <SelectField
              label="محافظة التحميل"
              title="اختر محافظة التحميل"
              placeholder="كل المحافظات"
              items={provinceItems}
              selectedId={pickupProvince}
              onSelect={setPickupProvince}
            />
            <SelectField
              label="محافظة التفريغ"
              title="اختر محافظة التفريغ"
              placeholder="كل المحافظات"
              items={provinceItems}
              selectedId={deliveryProvince}
              onSelect={setDeliveryProvince}
            />

            {!isMerchant ? (
              <View style={styles.vehicleNote}>
                <MaterialCommunityIcons name={vehicleIcon(myVehicleType) as any} size={18} color={colors.primary} />
                <Text style={styles.vehicleNoteText}>
                  {myVehicleType
                    ? `الحمولات المعروضة مطابقة لمركبتك: ${vehicleLabel(myVehicleType)}`
                    : 'أضف نوع مركبتك في حسابك لعرض الحمولات المطابقة'}
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <FreightCard
            request={item}
            matched={!isMerchant && matchDrivers(item, drivers).length > 0}
            onPress={() => router.push(isMerchant ? `/applicants/${item.id}` : `/freight/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={isMerchant ? 'لا توجد طلبات بعد' : 'لا توجد حمولات مطابقة'}
            subtitle={
              isMerchant
                ? 'انشر طلب نقل جديد لتصلك عروض السائقين'
                : 'لا حمولات لمركبتك ضمن هذا المسار حالياً. جرّب تغيير المحافظات.'
            }
            icon={<MaterialIcons name="local-shipping" size={44} color={colors.textMuted} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  filterTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  filterTitleLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  filterTitle: { ...typography.section, color: colors.text },
  clearBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2, backgroundColor: colors.surfaceTint, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  clearText: { ...typography.caption, color: colors.emphasis },
  pressed: { opacity: 0.85 },
  vehicleNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  vehicleNoteText: { ...typography.caption, color: colors.primary, flex: 1, textAlign: 'right' },
});
