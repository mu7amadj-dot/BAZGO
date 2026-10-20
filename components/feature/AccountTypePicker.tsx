// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '@/services/types';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface AccountTypePickerProps { selectedRole: UserRole | null; onSelect: (role: UserRole) => void; }
export const AccountTypePicker = memo(function AccountTypePicker({ selectedRole, onSelect }: AccountTypePickerProps) {
  return (
    <View style={styles.row}>
      {(['merchant', 'driver'] as UserRole[]).map((role) => {
        const selected = selectedRole === role;
        return (
          <Pressable key={role} onPress={() => onSelect(role)}
            style={({ pressed }) => [styles.card, selected ? styles.selected : null, pressed ? styles.pressed : null]}
            accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={role === 'merchant' ? 'سجّل كتاجر' : 'سجّل كسائق'}>
            <View style={styles.indicator}>
              <MaterialCommunityIcons name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'} size={24} color={selected ? colors.primary : colors.textMuted} />
            </View>
            <MaterialCommunityIcons name={role === 'merchant' ? 'store' : 'truck'} size={40} color={selected ? colors.primary : colors.textMuted} />
            <Text style={styles.title}>{role === 'merchant' ? 'سجّل كتاجر' : 'سجّل كسائق'}</Text>
            <Text style={styles.subtitle}>{role === 'merchant' ? 'تاجر / شركة / معمل' : 'سائق شاحنة / ناقل'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});
const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  card: { flex: 1, minHeight: 144, paddingTop: spacing.lg, paddingBottom: spacing.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceSelected },
  indicator: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  title: { ...typography.section, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { ...typography.caption, color: colors.textSubtle, textAlign: 'center', marginTop: spacing.xs },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
