// Powered by OnSpace.AI
import React, { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

interface FieldProps {
  label: string; value: string; onChangeText: (text: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad'; multiline?: boolean; error?: string;
  icon?: string; compact?: boolean; editable?: boolean;
}
export const Field = memo(function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, error, icon, compact = false, editable = true }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const isPhone = keyboardType === 'phone-pad';
  return (
    <View style={styles.wrap}>
      {!compact ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.shell, compact ? styles.compactShell : null, multiline ? styles.multilineShell : null, focused ? styles.focused : null, error ? styles.inputError : null]}>
        {icon ? <View style={styles.iconWrap}><MaterialCommunityIcons name={icon as any} size={24} color={focused ? colors.primary : colors.textSubtle} /></View> : null}
        <View style={styles.inputWrap}>
          {compact ? <Text style={styles.insetLabel}>{label}</Text> : null}
          <TextInput style={[styles.input, compact ? styles.compactInput : null, multiline ? styles.multilineInput : null, isPhone ? styles.phone : null]}
            value={value} onChangeText={onChangeText} editable={editable} placeholder={placeholder} placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType} multiline={multiline} textAlign="right" accessibilityLabel={label}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} selectionColor={colors.primary} />
        </View>
      </View>
      {error ? <View style={styles.errorRow}><MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} /><Text style={styles.error}>{error}</Text></View> : null}
    </View>
  );
});
const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.xs },
  shell: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, minHeight: 56, paddingHorizontal: spacing.md },
  compactShell: { minHeight: layout.controlHeight },
  iconWrap: { width: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: spacing.sm },
  inputWrap: { flex: 1, minWidth: 0 },
  insetLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  input: { ...typography.body, color: colors.text, height: 54, paddingVertical: spacing.sm, paddingHorizontal: 0, writingDirection: 'rtl' },
  compactInput: { height: 30, paddingVertical: 0 },
  multilineShell: { minHeight: 112, alignItems: 'flex-start' },
  multilineInput: { height: 110, paddingTop: spacing.sm, textAlignVertical: 'top' },
  phone: { writingDirection: 'ltr' },
  focused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  errorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  error: { ...typography.caption, color: colors.danger, textAlign: 'right', flex: 1 },
});
