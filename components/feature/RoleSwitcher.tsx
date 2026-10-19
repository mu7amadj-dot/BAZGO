// Powered by OnSpace.AI
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';
import { UserRole } from '@/services/types';

interface RoleSwitcherProps {
  role: UserRole;
  onChange: (r: UserRole) => void;
}

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <View style={styles.wrap}>
      {(['merchant', 'driver'] as UserRole[]).map((r) => {
        const isSelected = role === r;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[styles.segment, isSelected && styles.segmentActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.text, isSelected && styles.textActive]}>
              {r === 'merchant' ? 'حساب تاجر' : 'حساب سائق'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, ...shadow.card },
  text: { ...typography.label, color: colors.textSubtle },
  textActive: { color: colors.onPrimary },
});
