import { ActivityNotificationItem, NotificationPreferenceState } from './types';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  INITIAL_ACTIVITY_NOTIFICATIONS,
  INITIAL_FOLLOWED_BACK_IDS,
} from './mockNotificationsData';

const NOTIFICATIONS_STORAGE_KEY = 'popo_local_notifications_v1';
const SETTINGS_STORAGE_KEY = 'popo_local_notification_settings_v1';
const FOLLOW_BACKS_STORAGE_KEY = 'popo_local_notification_follow_backs_v1';
const UNREAD_COUNT_CACHE_KEY = 'popo_local_notification_unread_count_v1';
export const NOTIFICATIONS_UPDATED_EVENT = 'popo-notifications-updated';

function emitNotificationsUpdated(unreadCount?: number) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof unreadCount === 'number') {
      window.localStorage.setItem(UNREAD_COUNT_CACHE_KEY, String(unreadCount));
    }
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { unreadCount },
      })
    );
  } catch {
    // Ignore storage quota or sandbox restriction in demo mode
  }
}

export function loadLocalNotifications(): ActivityNotificationItem[] {
  if (typeof window === 'undefined') return INITIAL_ACTIVITY_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return INITIAL_ACTIVITY_NOTIFICATIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall back to default mock notifications
  }
  return INITIAL_ACTIVITY_NOTIFICATIONS;
}

export function saveLocalNotifications(items: ActivityNotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    const unreadCount = items.filter((n) => !n.isRead).length;
    emitNotificationsUpdated(unreadCount);
  } catch {
    // Ignore storage error
  }
}

export function clearLocalNotificationsState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.localStorage.removeItem(FOLLOW_BACKS_STORAGE_KEY);
    emitNotificationsUpdated(
      INITIAL_ACTIVITY_NOTIFICATIONS.filter((n) => !n.isRead).length
    );
  } catch {
    // Ignore
  }
}

export function loadLocalNotificationPreferences(): NotificationPreferenceState {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export function saveLocalNotificationPreferences(
  prefs: NotificationPreferenceState
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function loadLocalFollowBacks(): string[] {
  if (typeof window === 'undefined') return INITIAL_FOLLOWED_BACK_IDS;
  try {
    const raw = window.localStorage.getItem(FOLLOW_BACKS_STORAGE_KEY);
    if (!raw) return INITIAL_FOLLOWED_BACK_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore
  }
  return INITIAL_FOLLOWED_BACK_IDS;
}

export function saveLocalFollowBacks(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOLLOW_BACKS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore
  }
}

export function getLocalUnreadNotificationCount(): number {
  if (typeof window === 'undefined') {
    return INITIAL_ACTIVITY_NOTIFICATIONS.filter((n) => !n.isRead).length;
  }
  try {
    const cached = window.localStorage.getItem(UNREAD_COUNT_CACHE_KEY);
    if (cached !== null) {
      const parsedNum = Number(cached);
      if (Number.isFinite(parsedNum) && parsedNum >= 0) return parsedNum;
    }
    const items = loadLocalNotifications();
    return items.filter((n) => !n.isRead).length;
  } catch {
    return INITIAL_ACTIVITY_NOTIFICATIONS.filter((n) => !n.isRead).length;
  }
}
