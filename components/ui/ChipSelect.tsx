// Powered by OnSpace.AI
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface ChipItem {
  id: string;
  label: string;
}

interface ChipSelectProps {
  label?: string;
  items: ChipItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ChipSelect({ label, items, selectedId, onSelect }: ChipSelectProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.barOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipDefault,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextDefault]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, textAlign: 'right', marginBottom: spacing.sm },
  barOuter: { minHeight: 44 },
  content: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 2 },
  chip: {
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDefault: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
  chipText: { ...typography.label },
  chipTextDefault: { color: colors.textSubtle },
  chipTextSelected: { color: colors.onPrimary },
  pressed: { opacity: 0.85 },
});
