// Powered by OnSpace.AI
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Tabs from 'expo-router/tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { FloatingTabBar } from '@/components/layout/FloatingTabBar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: spacing.md,
    backgroundColor: colors.transparent,
    borderTopWidth: 0,
    borderTopColor: colors.transparent,
  };

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.navigationText,
        tabBarInactiveTintColor: colors.navigationMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', includeFontPadding: false },
        tabBarActiveBackgroundColor: colors.navigationSelected,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'الحمولات',
          href: null,
          tabBarItemStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="truck-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'المحادثات', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="message-text-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'الإشعارات', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
