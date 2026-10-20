// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { scoreDriver, matchDrivers } from '@/services/matchingService';
import { STATUS_LABELS, STATUS_COLORS } from '@/services/mockData';
import { formatIQD } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { DriverCard } from '@/components/feature/DriverCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { requests, drivers, applications, acceptDriver, rejectDriver, ensureConversation } = useApp();

  const request = requests.find((r) => r.id === id);

  const applicants = useMemo(() => {
    if (!request) return [];
    return applications
      .filter((a) => a.freightId === request.id && a.status !== 'rejected')
      .map((a) => {
        const driver = drivers.find((d) => d.id === a.driverId)!;
        return { application: a, driver, match: scoreDriver(request, driver) };
      })
      .filter((x) => x.driver)
      .sort((a, b) => b.match.score - a.match.score);
  }, [request, applications, drivers]);

  const suggested = useMemo(() => {
    if (!request) return [];
    const appliedIds = applications.map((a) => a.driverId);
    return matchDrivers(request, drivers).filter((m) => !appliedIds.includes(m.driver.id)).slice(0, 2);
  }, [request, drivers, applications]);

  if (!request) {
    return (
      <View style={styles.screen}>
        <Header title="العروض" showBack />
        <EmptyState title="الطلب غير متوفر" />
      </View>
    );
  }

  const accept = (driverId: string) => {
    showAlert('قبول السائق', 'سيتم تأكيد النقل مع هذا السائق ورفض باقي العروض.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'قبول',
        onPress: () => {
          acceptDriver(request.id, driverId);
          const cid = ensureConversation(request.id, driverId);
          router.push(`/chat/${cid}`);
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title="إدارة الطلب" subtitle={`${request.pickupProvince} ← ${request.deliveryProvince}`} showBack />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Badge label={STATUS_LABELS[request.status]} tone={STATUS_COLORS[request.status]} />
            <Text style={styles.summaryPrice}>{formatIQD(request.priceIQD)}</Text>
          </View>
          <Text style={styles.summaryCargo}>{request.cargoType} • {request.weightTons} طن</Text>
        </View>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-check-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>السائقون المتقدمون ({applicants.length})</Text>
        </View>

        {applicants.length === 0 ? (
          <EmptyState title="لا توجد عروض بعد" subtitle="سيظهر السائقون هنا فور تقديمهم" icon={<MaterialCommunityIcons name="timer-sand" size={40} color={colors.textMuted} />} />
        ) : (
          applicants.map(({ driver, application, match }) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              reasons={match.reasons}
              accepted={application.status === 'accepted'}
              onAccept={() => accept(driver.id)}
              onReject={() => rejectDriver(request.id, driver.id)}
              onChat={() => router.push(`/chat/${ensureConversation(request.id, driver.id)}`)}
            />
          ))
        )}

        {suggested.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="auto-fix" size={20} color={colors.emphasisDark} />
              <Text style={styles.sectionTitle}>مطابقة ذكية من BAZGO</Text>
            </View>
            {suggested.map((m) => (
              <DriverCard key={m.driver.id} driver={m.driver} reasons={m.match.reasons} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  summary: { backgroundColor: colors.surfaceTint, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  summaryPrice: { ...typography.section, color: colors.primary },
  summaryCargo: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.section, color: colors.text },
});
