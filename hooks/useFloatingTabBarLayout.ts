import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/constants/theme';

export function useFloatingTabBarLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? spacing.md : insets.bottom + spacing.sm;
  const barHeight = spacing.xxl + spacing.xl;
  return {
    bottomPadding,
    contentInset: barHeight + spacing.sm + bottomPadding + spacing.md,
  };
}
