'use client';

import { useEffect, useState } from 'react';
import {
  getLocalUnreadNotificationCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from './notificationsLocalStore';

/**
 * Single shared hook returning the frontend demo unread notification count.
 * Reused across navigation headers so no duplicate notification counters exist.
 */
export function useUnreadNotificationsCount(): number {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const sync = () => setUnreadCount(getLocalUnreadNotificationCount());
    sync();

    const handleCustom = () => sync();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleCustom);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleCustom);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return unreadCount;
}
