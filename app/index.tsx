import React from 'react';
import { Redirect } from 'expo-router';
import { AuthRouter } from '@/template';
import { AccountGate, SessionLoading } from '@/components/auth/AccountGate';

export default function RootScreen() {
  return <AuthRouter loginRoute="/login" loadingComponent={SessionLoading}>
    <AccountGate><Redirect href="/(tabs)" /></AccountGate>
  </AuthRouter>;
}
