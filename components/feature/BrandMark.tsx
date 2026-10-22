// Powered by OnSpace.AI
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';

interface BrandMarkProps { compact?: boolean; showSlogan?: boolean; showIcon?: boolean; }
export const BrandMark = memo(function BrandMark({ compact = false, showSlogan = true, showIcon = true }: BrandMarkProps) {
  return (
    <View style={[styles.wrap, compact ? styles.compactWrap : null]} accessibilityLabel="BAZGO، انقل بضاعتك بذكاء">
      {showIcon ? (
        <View style={styles.pinWrap}>
          <View style={styles.pinTail} />
          <View style={styles.pinCircle}>
            <MaterialCommunityIcons name="truck" size={32} color={colors.onPrimary} />
          </View>
        </View>
      ) : null}
      <Text style={styles.wordmark}>BAZ<Text style={styles.accent}>GO</Text></Text>
      {showSlogan ? <Text style={styles.slogan}>انقل بضاعتك بذكاء</Text> : null}
    </View>
  );
});
const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  compactWrap: { flexDirection: 'row', gap: spacing.sm },
  pinWrap: { width: 60, height: 68, alignItems: 'center' },
  pinCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pinTail: { position: 'absolute', width: 24, height: 24, backgroundColor: colors.primary, top: 39, transform: [{ rotate: '45deg' }], borderRadius: 3 },
  wordmark: { ...typography.brand, color: colors.text, letterSpacing: 0.5 },
  accent: { color: colors.primary },
  slogan: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
