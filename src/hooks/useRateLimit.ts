import { useState, useEffect, useCallback } from 'react';

export function useRateLimit(key: string, cooldownSeconds = 60) {
  const storageKey = `rate_limit_${key}`;

  const getRemaining = useCallback(() => {
    const last = localStorage.getItem(storageKey);
    if (!last) return 0;
    const diff = cooldownSeconds - Math.floor((Date.now() - Number(last)) / 1000);
    return Math.max(0, diff);
  }, [storageKey, cooldownSeconds]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, getRemaining]);

  const recordAction = useCallback(() => {
    localStorage.setItem(storageKey, String(Date.now()));
    setRemaining(cooldownSeconds);
  }, [storageKey, cooldownSeconds]);

  return { isLimited: remaining > 0, remaining, recordAction };
}
