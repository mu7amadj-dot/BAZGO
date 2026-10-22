// Powered by OnSpace.AI
import React from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { AccountGate } from '@/components/auth/AccountGate';
import { useApp } from '@/hooks/useApp';
import { useLoadBooking } from '@/hooks/useLoadBooking';
import { MarketConnectionBanner } from '@/components/feature/MarketConnectionBanner';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/loadStatus';
import { vehicleLabel } from '@/constants/config';
import { formatIQD, formatWeight, formatDistance, formatDate } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';

export default function FreightDetailScreen() { return <AccountGate><LoadDetailScreen /></AccountGate>; }
function LoadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { requests } = useApp();
  const booking = useLoadBooking(id);

  const request = requests.find((r) => r.id === id);
  if (!request) {
    return (
      <View style={styles.screen}>
        <Header title="تفاصيل الحمولة" showBack />
        <EmptyState title="الحمولة غير متوفرة" />
      </View>
    );
  }

  const hasOwnBooking = !!booking.negotiation;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title="تفاصيل الحمولة" showBack />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <MarketConnectionBanner />
        {request.cargoImage ? <Image source={{ uri: request.cargoImage }} style={styles.hero} contentFit="cover" transition={200} /> : <View style={[styles.hero, styles.imagePlaceholder]}><MaterialCommunityIcons name="package-variant-closed" size={48} color={colors.primary} /><Text style={styles.placeholderLabel}>لم تُرفق صورة للحمولة</Text></View>}

        <View style={styles.headRow}>
          <Text style={styles.cargoType}>{request.cargoType}</Text>
          <Badge label={STATUS_LABELS[request.status]} tone={STATUS_COLORS[request.status]} />
        </View>
        <Text style={styles.merchant}>{request.merchantName}</Text>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>السعر الأولي للتاجر</Text>
          <Text style={styles.price}>{formatIQD(request.priceIQD)}</Text>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeSide}>
            <MaterialCommunityIcons name="circle-outline" size={18} color={colors.primary} />
            <Text style={styles.routeProv}>{request.pickupProvince}</Text>
            <Text style={styles.routeAddr}>{request.pickupAddress || 'موقع التحميل'}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textMuted} />
          <View style={styles.routeSide}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.emphasis} />
            <Text style={styles.routeProv}>{request.deliveryProvince}</Text>
            <Text style={styles.routeAddr}>{request.deliveryAddress || 'موقع التفريغ'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow icon="truck" label="المركبة المطلوبة" value={vehicleLabel(request.vehicleType)} />
          <View style={styles.divider} />
          <InfoRow icon="weight" label="وزن الحمولة" value={formatWeight(request.weightTons)} />
          <View style={styles.divider} />
          <InfoRow icon="map-marker-distance" label="المسافة" value={formatDistance(request.distanceKm)} />
          <View style={styles.divider} />
          <InfoRow icon="calendar" label="تاريخ التحميل" value={formatDate(request.pickupDate)} />
        </View>

        {request.cargoDescription ? (
          <View style={styles.card}>
            <Text style={styles.blockTitle}>وصف الحمولة</Text>
            <Text style={styles.blockText}>{request.cargoDescription}</Text>
          </View>
        ) : null}

        {request.notes ? (
          <View style={styles.card}>
            <Text style={styles.blockTitle}>ملاحظات التاجر</Text>
            <Text style={styles.blockText}>{request.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={hasOwnBooking ? 'فتح المحادثة والاتفاق' : !booking.authenticated ? 'دخول آمن لقبول الحمولة' : booking.available ? 'قبول الحمولة · Accept Load' : request.status === 'negotiating' ? 'قيد التفاوض مع سائق آخر' : 'الحمولة غير متاحة'}
          variant="emphasis"
          disabled={booking.authenticated && !hasOwnBooking && (!booking.available || !booking.isDriver)}
          loading={booking.busy}
          onPress={hasOwnBooking ? booking.openChat : booking.accept}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  hero: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholderLabel: { ...typography.body, color: colors.textSubtle },
  headRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  cargoType: { ...typography.title, color: colors.text },
  merchant: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
  priceCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceTint, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  priceLabel: { ...typography.label, color: colors.textSubtle },
  price: { ...typography.title, color: colors.primary },
  routeCard: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, ...shadow.card },
  routeSide: { flex: 1, alignItems: 'center' },
  routeProv: { ...typography.bodyStrong, color: colors.text, marginTop: 4 },
  routeAddr: { ...typography.caption, color: colors.textSubtle, textAlign: 'center', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, ...shadow.card },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  infoLabel: { ...typography.body, color: colors.textSubtle, flex: 1, textAlign: 'right' },
  infoValue: { ...typography.bodyStrong, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  blockTitle: { ...typography.label, color: colors.primary, textAlign: 'right', marginBottom: spacing.xs },
  blockText: { ...typography.body, color: colors.text, textAlign: 'right', lineHeight: 26 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
