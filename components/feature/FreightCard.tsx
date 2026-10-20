// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FreightRequest } from '@/services/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/services/mockData';
import { vehicleLabel, vehicleIcon } from '@/constants/config';
import { formatIQD, formatWeight, formatDistance } from '@/services/format';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';

interface FreightCardProps {
  request: FreightRequest;
  onPress?: () => void;
  matched?: boolean;
}

export const FreightCard = memo(function FreightCard({ request, onPress, matched }: FreightCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${request.cargoType}، من ${request.pickupProvince} إلى ${request.deliveryProvince}`}
    >
      <View style={styles.header}>
        <Image source={{ uri: request.cargoImage }} style={styles.thumb} contentFit="cover" transition={200} />
        <View style={styles.headerText}>
          <Text style={styles.cargoType} numberOfLines={1}>{request.cargoType}</Text>
          <Text style={styles.merchant} numberOfLines={1}>{request.merchantName}</Text>
          <View style={styles.badgeRow}>
            <Badge label={STATUS_LABELS[request.status]} tone={STATUS_COLORS[request.status]} />
            {matched ? (
              <Badge
                label="مطابق لمركبتك"
                tone="success"
                icon={<MaterialCommunityIcons name="check-circle" size={12} color={colors.success} />}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <MaterialCommunityIcons name="circle-outline" size={16} color={colors.primary} />
          <Text style={styles.routeText}>{request.pickupProvince}</Text>
        </View>
        <View style={styles.routeLine}>
          <MaterialCommunityIcons name="arrow-left" size={16} color={colors.textMuted} />
        </View>
        <View style={styles.routePoint}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.emphasis} />
          <Text style={styles.routeText}>{request.deliveryProvince}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name={vehicleIcon(request.vehicleType) as any} size={16} color={colors.textSubtle} />
          <Text style={styles.metaText}>{vehicleLabel(request.vehicleType)}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="weight" size={16} color={colors.textSubtle} />
          <Text style={styles.metaText}>{formatWeight(request.weightTons)}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.textSubtle} />
          <Text style={styles.metaText}>{formatDistance(request.distanceKm)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatIQD(request.priceIQD)}</Text>
        <View style={styles.viewBtn}>
          <Text style={styles.viewText}>التفاصيل</Text>
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  header: { flexDirection: 'row-reverse', gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  headerText: { flex: 1 },
  cargoType: { ...typography.section, color: colors.text, textAlign: 'right' },
  merchant: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
  badgeRow: { flexDirection: 'row-reverse', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  route: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  routePoint: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  routeText: { ...typography.bodyStrong, color: colors.text },
  routeLine: { paddingHorizontal: spacing.xs },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.md },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textSubtle },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: { ...typography.title, color: colors.primary },
  viewBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  viewText: { ...typography.label, color: colors.primary },
});
