import { JoinedClubRecord } from './types';

const FAN_CLUB_STORAGE_KEY = 'popo_live_fan_club_memberships_v1';

export function loadLocalJoinedFanClubs(): JoinedClubRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAN_CLUB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JoinedClubRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalJoinedFanClubs(records: JoinedClubRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAN_CLUB_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage denial gracefully
  }
}

export function clearLocalJoinedFanClubs(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FAN_CLUB_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
