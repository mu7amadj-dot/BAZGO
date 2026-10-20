// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

export const Header = memo(function Header({ title, subtitle, showBack = false, right, onBackground = false }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fg = onBackground ? colors.onDark : colors.text;
  const sub = colors.textSubtle;

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
            style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={fg} />
          </Pressable>
        ) : null}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titleBlock: { flex: 1 },
  title: { ...typography.title, textAlign: 'right' },
  subtitle: { ...typography.caption, textAlign: 'right', marginTop: 2 },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  right: {},
});
