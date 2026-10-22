// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useFloatingTabBarLayout } from '@/hooks/useFloatingTabBarLayout';
import { matchDrivers } from '@/services/matchingService';
import { PROVINCES, VEHICLES } from '@/constants/config';
import { Header } from '@/components/layout/Header';
import { FreightCard } from '@/components/feature/FreightCard';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { MarketConnectionBanner } from '@/components/feature/MarketConnectionBanner';
import { colors, layout, spacing } from '@/constants/theme';

export default function RequestsScreen() {
  const router = useRouter();
  const { contentInset } = useFloatingTabBarLayout();
  const { role, requests, drivers } = useApp();
  const isMerchant = role === 'merchant';
  const [province, setProvince] = useState<string>('all');
  const [vehicle, setVehicle] = useState<string>('all');

  const provinceItems = useMemo(
    () => [{ id: 'all', label: 'كل المحافظات' }, ...PROVINCES.map((p) => ({ id: p, label: p }))],
    []
  );
  const vehicleItems = useMemo(
    () => [{ id: 'all', label: 'كل المركبات' }, ...VEHICLES.map((v) => ({ id: v.id, label: v.label }))],
    []
  );

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (province !== 'all' && r.pickupProvince !== province && r.deliveryProvince !== province) return false;
      if (vehicle !== 'all' && r.vehicleType !== vehicle) return false;
      return true;
    });
  }, [requests, province, vehicle]);

  if (isMerchant) return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header
          title={isMerchant ? 'طلباتي' : 'الحمولات المتاحة'}
          subtitle={`${province === 'all' ? 'كل المحافظات' : province} · ${filtered.length} ${isMerchant ? 'طلب' : 'حمولة'}`}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: contentInset }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filters}>
            <MarketConnectionBanner />
            <ChipSelect items={provinceItems} selectedId={province} onSelect={setProvince} />
            {!isMerchant ? <ChipSelect items={vehicleItems} selectedId={vehicle} onSelect={setVehicle} /> : null}
          </View>
        }
        renderItem={({ item }) => {
          return (
            <FreightCard
              request={item}
              matched={!isMerchant && matchDrivers(item, drivers).length > 0}
              onPress={() => router.push(isMerchant ? `/applicants/${item.id}` : `/freight/${item.id}`)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title={isMerchant ? 'لا توجد طلبات بعد' : 'لا توجد حمولات مطابقة'}
            subtitle={isMerchant ? 'انشر طلب نقل جديد لتصلك عروض السائقين' : 'جرّب تغيير عوامل التصفية'}
            icon={<MaterialCommunityIcons name="truck-outline" size={44} color={colors.textMuted} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  filters: { marginBottom: spacing.xs },
});
