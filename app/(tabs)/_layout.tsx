// Powered by OnSpace.AI
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { role } = useApp();

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: role === 'merchant' ? 'طلباتي' : 'الحمولات',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'المحادثات', tabBarIcon: ({ color, size }) => <MaterialIcons name="chat-bubble-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'الإشعارات', tabBarIcon: ({ color, size }) => <MaterialIcons name="notifications-none" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
