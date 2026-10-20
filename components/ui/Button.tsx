// Powered by OnSpace.AI
import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

type Variant = 'primary' | 'emphasis' | 'outline' | 'ghost';
interface ButtonProps {
  title: string; onPress?: () => void; variant?: Variant; disabled?: boolean;
  loading?: boolean; fullWidth?: boolean; icon?: React.ReactNode;
}
export const Button = memo(function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, fullWidth = true, icon }: ButtonProps) {
  const secondary = variant === 'outline' || variant === 'ghost';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [styles.base, fullWidth ? styles.fullWidth : null,
        variant === 'primary' ? styles.primary : null, variant === 'emphasis' ? styles.emphasis : null,
        variant === 'outline' ? styles.outline : null, variant === 'ghost' ? styles.ghost : null,
        pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
      accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || loading, busy: loading }}>
      {loading ? <ActivityIndicator color={secondary ? colors.primary : colors.onPrimary} /> : (
        <View style={styles.content}>
          {icon ? <View>{icon}</View> : null}
          <Text style={[styles.text, secondary ? styles.secondaryText : null]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
});
const styles = StyleSheet.create({
  base: { minHeight: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.primary, ...shadow.card },
  emphasis: { backgroundColor: colors.emphasis, ...shadow.card },
  outline: { backgroundColor: colors.transparent, borderWidth: 1, borderColor: colors.primary },
  ghost: { backgroundColor: colors.transparent },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  text: { ...typography.button, color: colors.onPrimary, textAlign: 'center', flexShrink: 1 },
  secondaryText: { color: colors.primary },
});
