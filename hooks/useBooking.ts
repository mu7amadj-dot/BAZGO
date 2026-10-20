import { useContext } from 'react';
import { BookingContext } from '@/contexts/BookingContext';
export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error('useBooking must be used within BookingProvider');
  return value;
}
