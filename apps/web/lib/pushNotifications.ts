import { query, withTransaction } from '@/lib/db';
import { AuthUser, getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export interface DeviceTokenRecord {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'android' | 'ios';
  deviceModel: string;
  appVersion: string;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface PushNotificationPayload {
  type: 'direct_message' | 'gift_received' | 'live_broadcast' | 'system_notice' | 'party_event' | 'pk_battle';
  title: string;
  body: string;
  data: Record<string, any>;
  senderId?: string;
}

export interface PushDispatchResult {
  dispatched: boolean;
  tokensCount: number;
  status: 'sent' | 'suppressed_by_preference' | 'suppressed_by_block' | 'no_active_devices';
  reason?: string;
  dispatchId?: string;
}

/**
 * Register a device token for push notifications
 */
export async function registerDeviceToken(params: {
  userId: string;
  deviceToken: string;
  platform?: string;
  deviceModel?: string;
  appVersion?: string;
}): Promise<DeviceTokenRecord> {
  const { userId, deviceToken, platform = 'android', deviceModel = 'Mobile Device', appVersion = '1.0.0' } = params;

  if (!deviceToken || !deviceToken.trim()) {
    throw new Error('DEVICE_TOKEN_REQUIRED');
  }

  const normalizedPlatform = platform.toLowerCase() === 'ios' ? 'ios' : 'android';

  const rows = await query(
    `INSERT INTO popolive.user_device_tokens (
       user_id, device_token, platform, device_model, app_version, is_active, last_active_at
     ) VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, device_token) DO UPDATE SET
       platform = EXCLUDED.platform,
       device_model = EXCLUDED.device_model,
       app_version = EXCLUDED.app_version,
       is_active = true,
       last_active_at = CURRENT_TIMESTAMP
     RETURNING id, user_id, device_token, platform, device_model, app_version, is_active, created_at, last_active_at`,
    [userId, deviceToken.trim(), normalizedPlatform, deviceModel, appVersion]
  );

  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    deviceToken: r.device_token,
    platform: r.platform,
    deviceModel: r.device_model,
    appVersion: r.app_version,
    isActive: Boolean(r.is_active),
    createdAt: new Date(r.created_at).toISOString(),
    lastActiveAt: new Date(r.last_active_at).toISOString(),
  };
}

/**
 * Unregister / deactivate a device token on logout
 */
export async function unregisterDeviceToken(params: {
  userId: string;
  deviceToken: string;
}): Promise<boolean> {
  const { userId, deviceToken } = params;
  const res = await query(
    `UPDATE popolive.user_device_tokens
     SET is_active = false, last_active_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND device_token = $2
     RETURNING id`,
    [userId, deviceToken.trim()]
  );
  return res.length > 0;
}

/**
 * Get all active device tokens for a user
 */
export async function getUserActiveDeviceTokens(userId: string): Promise<DeviceTokenRecord[]> {
  const rows = await query(
    `SELECT id, user_id, device_token, platform, device_model, app_version, is_active, created_at, last_active_at
     FROM popolive.user_device_tokens
     WHERE user_id = $1 AND is_active = true
     ORDER BY last_active_at DESC`,
    [userId]
  );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    deviceToken: r.device_token,
    platform: r.platform,
    deviceModel: r.device_model,
    appVersion: r.app_version,
    isActive: Boolean(r.is_active),
    createdAt: new Date(r.created_at).toISOString(),
    lastActiveAt: new Date(r.last_active_at).toISOString(),
  }));
}

/**
 * Core push notification dispatcher
 * Checks notification settings, block lists, fetches tokens, dispatches, and logs
 */
export async function dispatchPushNotification(
  recipientUserId: string,
  payload: PushNotificationPayload
): Promise<PushDispatchResult> {
  const { type, title, body, data, senderId } = payload;

  // 1. Check user notification settings
  const settingsRows = await query(
    `SELECT account_notifications, security_notifications, system_announcements,
            promotional_notifications, direct_messages, gift_alerts, live_broadcasts
     FROM popolive.user_notification_settings
     WHERE user_id = $1`,
    [recipientUserId]
  );

  const settings = settingsRows[0] || {
    direct_messages: true,
    gift_alerts: true,
    live_broadcasts: true,
    system_announcements: true,
  };

  // Preference suppression checks
  let isSuppressed = false;
  let suppressionReason = '';

  if (type === 'direct_message' && settings.direct_messages === false) {
    isSuppressed = true;
    suppressionReason = 'USER_PREFERENCE_DIRECT_MESSAGES_DISABLED';
  } else if (type === 'gift_received' && settings.gift_alerts === false) {
    isSuppressed = true;
    suppressionReason = 'USER_PREFERENCE_GIFT_ALERTS_DISABLED';
  } else if (type === 'live_broadcast' && settings.live_broadcasts === false) {
    isSuppressed = true;
    suppressionReason = 'USER_PREFERENCE_LIVE_ALERTS_DISABLED';
  } else if (type === 'system_notice' && settings.system_announcements === false) {
    isSuppressed = true;
    suppressionReason = 'USER_PREFERENCE_SYSTEM_NOTICES_DISABLED';
  }

  if (isSuppressed) {
    await query(
      `INSERT INTO popolive.push_notification_dispatch_logs (
         user_id, notification_type, title, body, payload, status, suppression_reason
       ) VALUES ($1, $2, $3, $4, $5, 'suppressed_by_preference', $6)`,
      [recipientUserId, type, title, body, JSON.stringify(data), suppressionReason]
    );
    return {
      dispatched: false,
      tokensCount: 0,
      status: 'suppressed_by_preference',
      reason: suppressionReason,
    };
  }

  // 2. Block check (if senderId is present)
  if (senderId) {
    const blockRows = await query(
      `SELECT 1 FROM popolive.user_blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [recipientUserId, senderId]
    );
    if (blockRows.length > 0) {
      await query(
        `INSERT INTO popolive.push_notification_dispatch_logs (
           user_id, notification_type, title, body, payload, status, suppression_reason
         ) VALUES ($1, $2, $3, $4, $5, 'suppressed_by_block', 'USER_RELATIONSHIP_BLOCKED')`,
        [recipientUserId, type, title, body, JSON.stringify(data)]
      );
      return {
        dispatched: false,
        tokensCount: 0,
        status: 'suppressed_by_block',
        reason: 'USER_RELATIONSHIP_BLOCKED',
      };
    }
  }

  // 3. Retrieve active device tokens
  const tokens = await getUserActiveDeviceTokens(recipientUserId);
  if (tokens.length === 0) {
    await query(
      `INSERT INTO popolive.push_notification_dispatch_logs (
         user_id, notification_type, title, body, payload, status, suppression_reason
       ) VALUES ($1, $2, $3, $4, $5, 'no_active_devices', 'NO_ACTIVE_DEVICE_TOKENS')`,
      [recipientUserId, type, title, body, JSON.stringify(data)]
    );
    return {
      dispatched: false,
      tokensCount: 0,
      status: 'no_active_devices',
      reason: 'NO_ACTIVE_DEVICE_TOKENS',
    };
  }

  // 4. Dispatch to each active device token & log
  const logIds: string[] = [];
  for (const t of tokens) {
    const logRes = await query(
      `INSERT INTO popolive.push_notification_dispatch_logs (
         user_id, device_token, notification_type, title, body, payload, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'sent')
       RETURNING id`,
      [recipientUserId, t.deviceToken, type, title, body, JSON.stringify(data)]
    );
    if (logRes.length > 0) logIds.push(logRes[0].id);
  }

  return {
    dispatched: true,
    tokensCount: tokens.length,
    status: 'sent',
    dispatchId: logIds[0],
  };
}

/**
 * Dispatch live alert to all eligible followers when a host starts broadcasting
 */
export async function dispatchFollowedHostLiveAlert(params: {
  hostId: string;
  roomId: string;
  title: string;
}): Promise<{ totalNotified: number; errors: number }> {
  const { hostId, roomId, title } = params;

  // Retrieve host nickname
  const hostRows = await query(`SELECT nickname, avatar_url FROM popolive.users WHERE id = $1`, [hostId]);
  const hostName = hostRows[0]?.nickname || 'Host';

  // Find followers with live_notifications_enabled = true
  const followers = await query(
    `SELECT follower_id FROM popolive.user_follows WHERE following_id = $1 AND live_notifications_enabled = true`,
    [hostId]
  );

  let notified = 0;
  let errCount = 0;

  for (const f of followers) {
    try {
      const res = await dispatchPushNotification(f.follower_id, {
        type: 'live_broadcast',
        title: `${hostName} is Live Now! ✨`,
        body: title || `Join ${hostName}'s live stream now on Popo Live!`,
        data: {
          type: 'live_broadcast',
          roomId,
          hostId,
          hostNickname: hostName,
        },
        senderId: hostId,
      });
      if (res.dispatched) notified++;
    } catch (_) {
      errCount++;
    }
  }

  return { totalNotified: notified, errors: errCount };
}

/**
 * Dispatch gift notification to recipient host
 */
export async function dispatchGiftPushNotification(params: {
  recipientHostId: string;
  senderUserId: string;
  giftName: string;
  coinPrice: number;
  roomId?: string;
}): Promise<PushDispatchResult> {
  const { recipientHostId, senderUserId, giftName, coinPrice, roomId } = params;

  const senderRows = await query(`SELECT nickname FROM popolive.users WHERE id = $1`, [senderUserId]);
  const senderName = senderRows[0]?.nickname || 'A supporter';

  return await dispatchPushNotification(recipientHostId, {
    type: 'gift_received',
    title: 'Gift Received! 🎁',
    body: `${senderName} sent you ${giftName} (${coinPrice} Coins)`,
    data: {
      type: 'gift_received',
      senderId: senderUserId,
      giftName,
      coinPrice,
      roomId,
    },
    senderId: senderUserId,
  });
}
