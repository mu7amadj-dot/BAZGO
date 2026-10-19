// Powered by OnSpace.AI
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Tone = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: colors.infoBg, fg: colors.info },
  warning: { bg: colors.warningBg, fg: colors.emphasisDark },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.surfaceAlt, fg: colors.textSubtle },
};

interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
}

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  icon: {},
  text: { ...typography.caption, fontWeight: '700' },
});
