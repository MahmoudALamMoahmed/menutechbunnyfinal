import { useState, useCallback } from 'react';

const STORAGE_KEY = 'notification_sound_enabled';

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { soundEnabled, toggleSound };
}
