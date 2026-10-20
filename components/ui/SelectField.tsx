// Powered by OnSpace.AI
import React, { memo, useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useViewport } from '@/hooks/useViewport';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';

export interface SelectItem { id: string; label: string; icon?: string; meta?: string; }
interface SelectFieldProps {
  label: string; placeholder?: string; items: SelectItem[]; selectedId?: string;
  onSelect: (id: string) => void; title?: string; compact?: boolean; icon?: string;
}
export const SelectField = memo(function SelectField({ label, placeholder = 'اختر', items, selectedId, onSelect, title, compact = false, icon }: SelectFieldProps) {
  const insets = useSafeAreaInsets();
  const { height } = useViewport();
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === selectedId);
  const choose = useCallback((id: string) => { onSelect(id); setOpen(false); }, [onSelect]);
  return (
    <View style={styles.wrap}>
      {!compact ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={({ pressed }) => [styles.trigger, compact ? styles.compactTrigger : null, open ? styles.triggerOpen : null, pressed ? styles.pressed : null]}
        onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`} accessibilityState={{ expanded: open }}>
        <View style={compact ? styles.insetIcon : null}><MaterialCommunityIcons name={(icon ?? selected?.icon ?? 'format-list-bulleted') as any} size={24} color={colors.textSubtle} /></View>
        <View style={styles.triggerTextWrap}>
          {compact ? <Text style={styles.insetLabel}>{label}</Text> : null}
          <Text style={[styles.triggerText, selected ? null : styles.triggerPlaceholder]} numberOfLines={1}>{selected?.label ?? placeholder}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textSubtle} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="إغلاق القائمة" />
          <View style={[styles.sheet, { height: Math.max(1, height * 0.76), paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title ?? label}</Text>
              <Pressable style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="إغلاق">
                <MaterialCommunityIcons name="close" size={24} color={colors.textSubtle} />
              </Pressable>
            </View>
            <FlatList data={items} keyExtractor={(item) => item.id} style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable style={({ pressed }) => [styles.option, isSelected ? styles.optionSelected : null, pressed ? styles.pressed : null]}
                    onPress={() => choose(item.id)} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: isSelected }}>
                    <View style={styles.optionIcon}><MaterialCommunityIcons name={(item.icon ?? 'format-list-bulleted') as any} size={24} color={isSelected ? colors.primary : colors.textSubtle} /></View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>{item.label}</Text>
                      {item.meta ? <Text style={styles.optionMeta}>{item.meta}</Text> : null}
                    </View>
                    {isSelected ? <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} /> : null}
                  </Pressable>
                );
              }} />
          </View>
        </View>
      </Modal>
    </View>
  );
});
const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.xs },
  trigger: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 56 },
  compactTrigger: { minHeight: layout.controlHeight },
  triggerOpen: { borderColor: colors.primary },
  insetIcon: { width: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border },
  triggerTextWrap: { flex: 1, minWidth: 0 },
  insetLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  triggerText: { ...typography.body, color: colors.text, textAlign: 'right' },
  triggerPlaceholder: { color: colors.textMuted },
  pressed: { opacity: 0.8 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: layout.authMaxWidth + spacing.xxl, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingTop: spacing.sm, ...shadow.raised },
  grabber: { alignSelf: 'center', width: 48, height: 4, borderRadius: radius.pill, backgroundColor: colors.borderStrong, marginBottom: spacing.sm },
  sheetHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sheetTitle: { ...typography.section, color: colors.text },
  close: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.sm },
  sep: { height: spacing.sm },
  option: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, minHeight: layout.controlHeight, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  optionSelected: { backgroundColor: colors.surfaceSelected, borderColor: colors.primary },
  optionIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  optionTextWrap: { flex: 1 },
  optionText: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' },
  optionTextSelected: { color: colors.primary },
  optionMeta: { ...typography.caption, color: colors.textSubtle, textAlign: 'right' },
});
