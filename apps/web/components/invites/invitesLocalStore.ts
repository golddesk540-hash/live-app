import { DEFAULT_INVITE_MESSAGE, INITIAL_INVITE_HISTORY } from './mockInvitesData';
import { InviteHistoryRecord } from './types';

const INVITE_MESSAGE_KEY = 'popo_local_invite_message_v1';
const INVITE_HISTORY_KEY = 'popo_local_invite_history_v1';

export function loadLocalInviteMessage(): string {
  if (typeof window === 'undefined') return DEFAULT_INVITE_MESSAGE;
  try {
    const val = window.localStorage.getItem(INVITE_MESSAGE_KEY);
    if (val && val.trim().length > 0) return val;
  } catch {
    // Ignore storage restriction
  }
  return DEFAULT_INVITE_MESSAGE;
}

export function saveLocalInviteMessage(message: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INVITE_MESSAGE_KEY, message);
  } catch {
    // Ignore storage restriction
  }
}

export function loadLocalInviteHistory(): InviteHistoryRecord[] {
  if (typeof window === 'undefined') return INITIAL_INVITE_HISTORY;
  try {
    const raw = window.localStorage.getItem(INVITE_HISTORY_KEY);
    if (!raw) return INITIAL_INVITE_HISTORY;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore parse error
  }
  return INITIAL_INVITE_HISTORY;
}

export function saveLocalInviteHistory(records: InviteHistoryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INVITE_HISTORY_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage restriction
  }
}

export function clearLocalInviteStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(INVITE_MESSAGE_KEY);
    window.localStorage.removeItem(INVITE_HISTORY_KEY);
  } catch {
    // Ignore storage restriction
  }
}
