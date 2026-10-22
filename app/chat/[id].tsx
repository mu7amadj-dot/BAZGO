import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AccountGate } from '@/components/auth/AccountGate';
import { SecureNegotiationChat } from '@/components/feature/SecureNegotiationChat';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountGate><SecureNegotiationChat key={id} id={id} /></AccountGate>;
}
