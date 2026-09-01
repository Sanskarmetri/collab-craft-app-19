import { useCallback, useRef } from 'react';

/**
 * Prevents repeated taps from stacking route transitions.
 * Returns a guard that reports whether the click should be blocked.
 */
export function useNavLock(lockMs = 500) {
  const lastRef = useRef(0);

  const shouldBlock = useCallback(() => {
    const now = Date.now();
    if (now - lastRef.current < lockMs) return true;
    lastRef.current = now;
    return false;
  }, [lockMs]);

  return shouldBlock;
}
