// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationIndicators } from '@/hooks/useNavigationIndicators';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

interface FloatingTabBarProps extends BottomTabBarProps {}

type NavigationIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icons: Record<string, { default: NavigationIcon; selected: NavigationIcon }> = {
  index: { default: 'home-outline', selected: 'home' },
  requests: { default: 'truck-outline', selected: 'truck-outline' },
  messages: { default: 'message-text-outline', selected: 'message-text-outline' },
  notifications: { default: 'bell-outline', selected: 'bell-outline' },
  profile: { default: 'account-outline', selected: 'account-outline' },
};

export const FloatingTabBar = memo(function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { hasUnreadNotifications } = useNavigationIndicators();
  const bottomPadding = Platform.select({
    ios: insets.bottom + spacing.sm,
    android: insets.bottom + spacing.sm,
    default: spacing.md,
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isSelected = state.index === index;
          const label = options.title ?? route.name;
          const icon = icons[route.name] ?? icons.index;
          const showIndicator = route.name === 'notifications' && hasUnreadNotifications;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isSelected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? `${label}${showIndicator ? '، توجد إشعارات غير مقروءة' : ''}`}
              style={({ pressed }) => [styles.tab, isSelected ? styles.selectedTab : null, pressed ? styles.pressed : null]}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={isSelected ? icon.selected : icon.default} size={26} color={isSelected ? colors.navigationText : colors.navigationMuted} />
                {showIndicator ? <View style={styles.indicator} /> : null}
              </View>
              <Text numberOfLines={1} style={[styles.label, isSelected ? styles.selectedLabel : null]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: layout.tabletBreakpoint,
    minHeight: spacing.xxl + spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.navigationBorder,
    backgroundColor: colors.navigationSurface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowOpacity: 0.16,
    shadowRadius: spacing.sm,
    elevation: 5,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: layout.controlHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.transparent,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  selectedTab: { backgroundColor: colors.navigationSelected },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.navigationLabel, color: colors.navigationMuted, textAlign: 'center' },
  selectedLabel: { color: colors.navigationText, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    right: -spacing.xs,
    top: -spacing.xs,
    width: spacing.sm + spacing.xs,
    height: spacing.sm + spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.navigationSurface,
    backgroundColor: colors.navigationIndicator,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
