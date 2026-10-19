// Powered by OnSpace.AI
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

export interface SelectItem {
  id: string;
  label: string;
  icon?: string;
  meta?: string;
}

interface SelectFieldProps {
  label: string;
  placeholder?: string;
  items: SelectItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  title?: string;
}

export function SelectField({ label, placeholder = 'اختر', items, selectedId, onSelect, title }: SelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === selectedId);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.trigger, selected && styles.triggerFilled, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MaterialCommunityIcons
          name={(selected?.icon ?? 'format-list-bulleted') as any}
          size={20}
          color={selected ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.triggerText, !selected && styles.triggerPlaceholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]} onPress={() => {}}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title ?? label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="إغلاق">
                <MaterialIcons name="close" size={22} color={colors.textSubtle} />
              </Pressable>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    style={({ pressed }) => [styles.option, isSelected && styles.optionSelected, pressed && styles.pressed]}
                    onPress={() => choose(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                      <MaterialCommunityIcons
                        name={(item.icon ?? 'truck') as any}
                        size={22}
                        color={isSelected ? colors.onPrimary : colors.primary}
                      />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item.label}</Text>
                      {item.meta ? <Text style={styles.optionMeta}>{item.meta}</Text> : null}
                    </View>
                    {isSelected ? <MaterialIcons name="check-circle" size={22} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, textAlign: 'right', marginBottom: spacing.xs },
  trigger: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  triggerFilled: { borderColor: colors.primary },
  triggerText: { ...typography.body, color: colors.text, flex: 1, textAlign: 'right' },
  triggerPlaceholder: { color: colors.textMuted },
  pressed: { opacity: 0.85 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    maxHeight: '80%', ...shadow.raised,
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sheetTitle: { ...typography.section, color: colors.text },
  list: { flexGrow: 0, flexShrink: 1 },
  sep: { height: spacing.sm },
  option: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: colors.surfaceTint, borderColor: colors.primary },
  optionIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  optionIconSelected: { backgroundColor: colors.primary },
  optionTextWrap: { flex: 1 },
  optionText: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' },
  optionTextSelected: { color: colors.primary },
  optionMeta: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
});
