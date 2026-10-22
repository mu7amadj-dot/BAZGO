import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { AccountGate } from '@/components/auth/AccountGate';
import { Header } from '@/components/layout/Header';
import { NegotiationManager } from '@/components/feature/NegotiationManager';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, layout, spacing } from '@/constants/theme';

export default function ApplicantsScreen() { return <AccountGate><LoadManagerScreen /></AccountGate>; }
function LoadManagerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests } = useApp();
  const request = requests.find((load) => load.id === id);
  return <SafeAreaView style={styles.screen} edges={['bottom']}>
    <Header title="إدارة الحمولة" subtitle={request ? `${request.pickupProvince} ← ${request.deliveryProvince}` : undefined} showBack />
    {!request ? <EmptyState title="الطلب غير متوفر" /> : <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <NegotiationManager loadId={request.id} />
    </ScrollView>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.lg, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
});
