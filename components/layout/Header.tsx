// Powered by OnSpace.AI
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  onBackground?: boolean;
}

export function Header({ title, subtitle, showBack = false, right, onBackground = false }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fg = onBackground ? colors.onPrimary : colors.text;
  const sub = onBackground ? 'rgba(255,255,255,0.8)' : colors.textSubtle;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: sub }]} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <MaterialIcons name="chevron-right" size={26} color={fg} />
          </Pressable>
        ) : null}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titleBlock: { flex: 1 },
  title: { ...typography.title, textAlign: 'right' },
  subtitle: { ...typography.caption, textAlign: 'right', marginTop: 2 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  right: {},
});
