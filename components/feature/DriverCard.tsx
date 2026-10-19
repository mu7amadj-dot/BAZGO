// Powered by OnSpace.AI
import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Driver } from '@/services/types';
import { vehicleLabel, vehicleIcon } from '@/constants/config';
import { formatWeight } from '@/services/format';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface DriverCardProps {
  driver: Driver;
  reasons?: string[];
  onAccept?: () => void;
  onReject?: () => void;
  onChat?: () => void;
  accepted?: boolean;
}

export function DriverCard({ driver, reasons, onAccept, onReject, onChat, accepted }: DriverCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Image source={{ uri: driver.photo }} style={styles.avatar} contentFit="cover" transition={200} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{driver.name}</Text>
            {driver.verified ? (
              <MaterialIcons name="verified" size={16} color={colors.info} />
            ) : null}
          </View>
          <View style={styles.statRow}>
            <MaterialIcons name="star" size={14} color={colors.emphasis} />
            <Text style={styles.stat}>{driver.rating.toFixed(1)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.stat}>{driver.completedTrips} رحلة</Text>
          </View>
        </View>
        {accepted ? <Badge label="مقبول" tone="success" /> : null}
      </View>

      <Image source={{ uri: driver.vehiclePhoto }} style={styles.vehiclePhoto} contentFit="cover" transition={200} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name={vehicleIcon(driver.vehicleType) as any} size={16} color={colors.textSubtle} />
          <Text style={styles.metaText}>{vehicleLabel(driver.vehicleType)}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="weight" size={16} color={colors.textSubtle} />
          <Text style={styles.metaText}>حتى {formatWeight(driver.maxCapacity)}</Text>
        </View>
      </View>

      {reasons && reasons.length > 0 ? (
        <View style={styles.reasons}>
          {reasons.map((r) => (
            <View key={r} style={styles.reasonItem}>
              <MaterialIcons name="check-circle" size={13} color={colors.success} />
              <Text style={styles.reasonText}>{r}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {accepted ? (
        <Button title="مراسلة السائق" variant="primary" onPress={onChat} />
      ) : onAccept || onReject ? (
        <View style={styles.actions}>
          <View style={styles.actionFlex}>
            <Button title="قبول" variant="emphasis" onPress={onAccept} />
          </View>
          <View style={styles.actionFlex}>
            <Button title="رفض" variant="outline" onPress={onReject} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

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
  top: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceAlt },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  name: { ...typography.section, color: colors.text },
  statRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  stat: { ...typography.caption, color: colors.textSubtle },
  dot: { color: colors.textMuted },
  vehiclePhoto: { width: '100%', height: 140, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: colors.surfaceAlt },
  metaRow: { flexDirection: 'row-reverse', gap: spacing.lg, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textSubtle },
  reasons: { marginTop: spacing.sm, gap: 4 },
  reasonItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  reasonText: { ...typography.caption, color: colors.textSubtle },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md },
  actionFlex: { flex: 1 },
});
