// Powered by OnSpace.AI
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { BookingProvider } from '@/contexts/BookingContext';
import { AppProvider } from '@/contexts/AppContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
        <BookingProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="login" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="create-request" options={{ presentation: 'modal' }} />
            <Stack.Screen name="freight/[id]" />
            <Stack.Screen name="applicants/[id]" />
            <Stack.Screen name="chat/[id]" />
          </Stack>
        </AppProvider>
        </BookingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
