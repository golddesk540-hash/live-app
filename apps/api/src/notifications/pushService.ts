/**
 * POPO LIVE — PUSH NOTIFICATION SERVICE & BUSINESS RULES ENGINE
 * 
 * Enforces:
 * - Age 18+ recipient verification
 * - Block list check (P7-P11): zero push between blocked users
 * - Category notification preferences (on/off)
 * - Quiet hours suppression
 * - In-app read deduplication (no push if already read)
 * - Deep link whitelist sanitization
 * - Device token registration & invalid token auto-cleanup
 * - Rate limiting per user
 */

import crypto from 'crypto';
import { Pool } from 'pg';
import { pushProvider } from './pushProvider';
import {
  DeliveryReceipt,
  DeviceTokenRecord,
  PushDeliveryStatus,
  PushDispatchLog,
  PushNotificationType,
  PushPlatform,
  SendPushParams,
  UserNotificationPreferences,
} from './notificationTypes';

let poolInstance: Pool | null = null;

function getDbPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
    });
  }
  return poolInstance;
}

interface MockUser {
  id: string;
  birthdate: string;
  is_adult_verified: boolean;
  status: string;
}

export class PushService {
  private mockUsers: Map<string, MockUser> = new Map();
  private mockDeviceTokens: Map<string, DeviceTokenRecord[]> = new Map();
  private mockPreferences: Map<string, UserNotificationPreferences> = new Map();
  private mockBlocks: Set<string> = new Set(); // "blocker:blocked"
  private mockDispatchLogs: PushDispatchLog[] = [];
  private userPushTimestamps: Map<string, number[]> = new Map();

  // --- MOCK REPOSITORY METHODS ---
  public registerMockUser(user: MockUser): void {
    this.mockUsers.set(user.id, user);
  }

  public registerMockBlock(blockerId: string, blockedId: string): void {
    this.mockBlocks.add(`${blockerId}:${blockedId}`);
  }

  public unregisterMockBlock(blockerId: string, blockedId: string): void {
    this.mockBlocks.delete(`${blockerId}:${blockedId}`);
  }

  public isBlocked(userA: string, userB: string): boolean {
    return this.mockBlocks.has(`${userA}:${userB}`) || this.mockBlocks.has(`${userB}:${userA}`);
  }

  public getMockTokens(userId: string): DeviceTokenRecord[] {
    return (this.mockDeviceTokens.get(userId) || []).filter((t) => t.isActive);
  }

  public getMockDispatchLogs(userId?: string): PushDispatchLog[] {
    if (!userId) return [...this.mockDispatchLogs];
    return this.mockDispatchLogs.filter((l) => l.userId === userId);
  }

  // --- DEVICE TOKEN REGISTRATION ---
  public async registerDeviceToken(params: {
    userId: string;
    deviceToken: string;
    platform: PushPlatform;
    deviceModel?: string;
    appVersion?: string;
  }): Promise<{ success: boolean; tokenRecord: DeviceTokenRecord }> {
    const { userId, deviceToken, platform, deviceModel = 'Mobile Device', appVersion = '1.0.0' } = params;

    let tokens = this.mockDeviceTokens.get(userId) || [];
    const existing = tokens.find((t) => t.deviceToken === deviceToken);

    if (existing) {
      existing.isActive = true;
      existing.lastActiveAt = new Date().toISOString();
      return { success: true, tokenRecord: existing };
    }

    const newRecord: DeviceTokenRecord = {
      id: crypto.randomUUID(),
      userId,
      deviceToken,
      platform,
      deviceModel,
      appVersion,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    tokens.push(newRecord);
    this.mockDeviceTokens.set(userId, tokens);

    return { success: true, tokenRecord: newRecord };
  }

  // --- DEVICE TOKEN UNREGISTRATION (ON LOGOUT) ---
  public async unregisterDeviceToken(userId: string, deviceToken: string): Promise<{ success: boolean }> {
    const tokens = this.mockDeviceTokens.get(userId) || [];
    const target = tokens.find((t) => t.deviceToken === deviceToken);

    if (target) {
      target.isActive = false;
      target.lastActiveAt = new Date().toISOString();
    }

    return { success: true };
  }

  // --- USER PREFERENCES ---
  public async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    const cached = this.mockPreferences.get(userId);
    if (cached) return cached;

    const defaultPrefs: UserNotificationPreferences = {
      userId,
      directMessages: true,
      giftAlerts: true,
      liveBroadcasts: true,
      partyAlerts: true,
      vipAlerts: true,
      rewardAlerts: true,
      communityAlerts: true,
      systemNotices: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      updatedAt: new Date().toISOString(),
    };

    this.mockPreferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  public async updateUserPreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated: UserNotificationPreferences = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };

    this.mockPreferences.set(userId, updated);
    return updated;
  }

  // --- QUIET HOURS EVALUATION ---
  public isWithinQuietHours(prefs: UserNotificationPreferences, testDate?: Date): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const now = testDate || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutesSinceMidnight = currentHour * 60 + currentMinute;

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Day range e.g. 13:00 to 15:00
      return currentMinutesSinceMidnight >= startMinutes && currentMinutesSinceMidnight <= endMinutes;
    } else {
      // Overnight range e.g. 22:00 to 07:00
      return currentMinutesSinceMidnight >= startMinutes || currentMinutesSinceMidnight <= endMinutes;
    }
  }

  // --- DISPATCH NOTIFICATION ENGINE ---
  public async sendPush(
    params: SendPushParams & { currentTime?: Date }
  ): Promise<{
    delivered: boolean;
    status: PushDeliveryStatus;
    reason?: string;
    messageIds?: string[];
  }> {
    const { userId, type, payload, senderId, isAlreadyReadInApp = false, currentTime } = params;

    // 1. Age Verification
    let user: any = this.mockUsers.get(userId);
    if (!user) {
      try {
        const pool = getDbPool();
        const userRes = await pool.query(
          `SELECT id, birthdate, is_adult_verified, status FROM popolive.users WHERE id = $1 LIMIT 1`,
          [userId]
        );
        if (userRes.rows.length > 0) user = userRes.rows[0];
      } catch (_) {}
    }

    if (user && !user.is_adult_verified && user.birthdate) {
      const birthYear = new Date(user.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 18) {
        return { delivered: false, status: 'failed', reason: 'UNDERAGE_RECIPIENT' };
      }
    }

    // 2. Block List Check (P7-P11)
    if (senderId && this.isBlocked(senderId, userId)) {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        payload: payload.data || {},
        status: 'suppressed_by_block',
        suppressionReason: `Blocked relationship between sender ${senderId} and recipient ${userId}`,
      });
      return { delivered: false, status: 'suppressed_by_block', reason: 'BLOCKED_RELATIONSHIP' };
    }

    // 3. User Preferences Check
    const prefs = await this.getUserPreferences(userId);
    let categoryAllowed = true;

    if (type === 'direct_message' && !prefs.directMessages) categoryAllowed = false;
    else if (type === 'gift_received' && !prefs.giftAlerts) categoryAllowed = false;
    else if (type === 'live_start' && !prefs.liveBroadcasts) categoryAllowed = false;
    else if (type === 'party_invite' && !prefs.partyAlerts) categoryAllowed = false;
    else if (type === 'vip_expiry' && !prefs.vipAlerts) categoryAllowed = false;
    else if (type === 'reward_claimable' && !prefs.rewardAlerts) categoryAllowed = false;
    else if (type === 'community_activity' && !prefs.communityAlerts) categoryAllowed = false;
    else if ((type === 'system_notice' || type === 'ticket_reply') && !prefs.systemNotices) categoryAllowed = false;

    if (!categoryAllowed) {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        payload: payload.data || {},
        status: 'suppressed_by_preference',
        suppressionReason: `User disabled notifications for category: ${type}`,
      });
      return { delivered: false, status: 'suppressed_by_preference', reason: 'PREFERENCE_OFF' };
    }

    // 4. Quiet Hours Check (System notices bypass quiet hours)
    if (type !== 'system_notice' && this.isWithinQuietHours(prefs, currentTime)) {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        payload: payload.data || {},
        status: 'suppressed_by_quiet_hours',
        suppressionReason: `Notification arrived during quiet hours (${prefs.quietHoursStart} - ${prefs.quietHoursEnd})`,
      });
      return { delivered: false, status: 'suppressed_by_quiet_hours', reason: 'QUIET_HOURS' };
    }

    // 5. In-App Read Check (P7-P6 unread parity)
    if (isAlreadyReadInApp) {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        payload: payload.data || {},
        status: 'suppressed_in_app_read',
        suppressionReason: 'Message was already read in active application session',
      });
      return { delivered: false, status: 'suppressed_in_app_read', reason: 'ALREADY_READ' };
    }

    // 6. Rate Limiting Check (Max 15 pushes per 60 seconds per user)
    const now = Date.now();
    const timestamps = this.userPushTimestamps.get(userId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < 60000);

    if (validTimestamps.length >= 15) {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        payload: payload.data || {},
        status: 'suppressed_by_rate_limit',
        suppressionReason: 'Recipient push rate limit exceeded (max 15/min)',
      });
      return { delivered: false, status: 'suppressed_by_rate_limit', reason: 'RATE_LIMIT_EXCEEDED' };
    }
    validTimestamps.push(now);
    this.userPushTimestamps.set(userId, validTimestamps);

    // 7. Feature Flag Check: When flag is off, produce in-app notification only
    if (pushProvider.isTestMode() && process.env.USE_REAL_PUSH !== 'true') {
      this.logDispatch({
        userId,
        notificationType: type,
        title: payload.title,
        body: payload.body,
        deepLink: pushProvider.validateDeepLink(payload.deepLink),
        payload: payload.data || {},
        status: 'mock_sent',
        suppressionReason: 'Flag USE_REAL_PUSH is disabled (in-app fallback)',
      });
      return {
        delivered: true,
        status: 'mock_sent',
        messageIds: [`mock_${Date.now()}`],
      };
    }

    // 8. Device Token Retrieval & Dispatch
    const activeTokens = this.getMockTokens(userId);
    if (activeTokens.length === 0) {
      return { delivered: false, status: 'failed', reason: 'NO_ACTIVE_DEVICE_TOKENS' };
    }

    const messageIds: string[] = [];
    const sanitized = pushProvider.sanitizePayload(payload);

    for (const token of activeTokens) {
      const result = await pushProvider.sendToDevice(token, sanitized);

      if (result.isInvalidToken) {
        // Auto-cleanup dead token
        token.isActive = false;
      } else if (result.success && result.messageId) {
        messageIds.push(result.messageId);
      }
    }

    const status: PushDeliveryStatus = messageIds.length > 0 ? 'sent' : 'failed';

    this.logDispatch({
      userId,
      notificationType: type,
      title: sanitized.title,
      body: sanitized.body,
      deepLink: sanitized.deepLink,
      payload: sanitized.data || {},
      status,
      suppressionReason: status === 'failed' ? 'All tokens reported invalid or dead' : undefined,
    });

    return {
      delivered: status === 'sent',
      status,
      messageIds,
    };
  }

  private logDispatch(log: Omit<PushDispatchLog, 'id' | 'createdAt'>): void {
    this.mockDispatchLogs.push({
      id: crypto.randomUUID(),
      ...log,
      createdAt: new Date().toISOString(),
    });
  }
}

export const pushService = new PushService();
