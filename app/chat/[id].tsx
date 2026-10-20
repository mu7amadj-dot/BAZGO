import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useBooking } from '@/hooks/useBooking';
import { SecureNegotiationChat } from '@/components/feature/SecureNegotiationChat';
import { DemoChat } from '@/components/feature/DemoChat';
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useBooking();
  return booking.authenticated ? <SecureNegotiationChat key={id} id={id} /> : <DemoChat key={id} id={id} />;
}
