// Powered by OnSpace.AI
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export function useViewport() {
  const [dimensions, setDimensions] = useState({ width: 375, height: 667 });
  useEffect(() => {
    const update = () => {
      const current = Dimensions.get('window');
      setDimensions({ width: Math.max(1, current.width || 375), height: Math.max(1, current.height || 667) });
    };
    update();
    const subscription = Dimensions.addEventListener('change', update);
    return () => subscription.remove();
  }, []);
  return dimensions;
}
