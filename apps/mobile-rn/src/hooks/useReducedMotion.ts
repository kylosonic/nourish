import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.matchMedia
    ) {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const updatePreference = () => setReducedMotion(preference.matches);
      preference.addEventListener('change', updatePreference);
      return () => preference.removeEventListener('change', updatePreference);
    }

    let active = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReducedMotion(enabled);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
