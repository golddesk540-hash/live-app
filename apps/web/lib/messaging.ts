import { query, withTransaction } from '@/lib/db';
import { AuthUser, getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export interface InboxUserSummary {
  id: string;
  name: string;
  poppoId: string;
  avatarUrl: string;
  status: 'online' | 'live' | 'offline';
  lastSeen: string;
  ringColorHex: string;
  isOfficial: boolean;
  hostLevel: number;
  wealthLevel: number;
}

export interface InboxConversationItem {
  id: string;
  opponent: InboxUserSummary;
  lastMessage: string;
  lastMessageSenderId: string | null;
  lastTime: string;
  lastTimestamp: string;
  unreadCount: number;
  isPinned: boolean;
  status: string;
}

export interface DirectMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  messageType: string;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  time: string;
  timestamp: string;
  isMine: boolean;
}

export interface SystemNoticeItem {
  id: string;
  referenceCode: string;
  category: string;
  badgeLabel: string;
  title: string;
  titleUr?: string;
  shortDesc: string;
  shortDescUr?: string;
  fullMessage: string;
  fullMessageUr?: string;
  pubDate: string;
  pubTime: string;
  displayTimestamp: string;
  isImportant: boolean;
  isRead: boolean;
}

export interface InAppNotificationItem {
  id: string;
  category: string;
  actorId?: string;
  actorNickname?: string;
  actorAvatarUrl?: string;
  title: string;
  titleUr?: string;
  body: string;
  bodyUr?: string;
  entityType?: string;
  entityId?: string;
  timeAgo: string;
  timestamp: string;
  isRead: boolean;
  ringColorHex: string;
}

export interface InboxSummary {
  unreadMessagesCount: number;
  unreadNoticesCount: number;
  unreadNotificationsCount: number;
  totalUnreadCount: number;
}

/**
 * Format relative time (e.g. 'Just now', '2m', '1h', 'Yesterday', 'Nov 12')
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format clock time (e.g. '21:14')
 */
export function formatClockTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Helper to determine user online status
 */
export function determineUserStatus(userRow: any): { status: 'online' | 'live' | 'offline'; lastSeen: string; ringColorHex: string } {
  if (userRow.is_live) {
    return { status: 'live', lastSeen: 'In Live Room', ringColorHex: '#3B82F6' };
  }
  if (userRow.is_official) {
    return { status: 'online', lastSeen: 'Official Support', ringColorHex: '#FBBF24' };
  }

  const lastActive = userRow.last_active_at ? new Date(userRow.last_active_at) : null;
  if (lastActive && (Date.now() - lastActive.getTime()) < 10 * 60 * 1000) {
    return { status: 'online', lastSeen: 'Online now', ringColorHex: '#FF1A6C' };
  }
  if (lastActive && (Date.now() - lastActive.getTime()) < 60 * 60 * 1000) {
    const mins = Math.floor((Date.now() - lastActive.getTime()) / 60000);
    return { status: 'online', lastSeen: `Active ${mins}m ago`, ringColorHex: '#9333EA' };
  }
  return { status: 'offline', lastSeen: 'Offline', ringColorHex: '#10B981' };
}

/**
 * Resolves requesting user from session cookie or Authorization header
 */
export async function resolveMessagingActor(req: NextRequest): Promise<AuthUser | null> {
  const authUser = await getAuthenticatedUser(req);
  if (authUser) return authUser;

  // Support test / preview viewer header if present for local integration testing
  const testViewerId = req.headers.get('x-viewer-id');
  if (testViewerId) {
    const rows = await query('SELECT * FROM popolive.users WHERE id = $1', [testViewerId]);
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        poppo_id: r.poppo_id,
        email: r.email,
        phone: r.phone,
        nickname: r.nickname,
        avatar_url: r.avatar_url,
        gender: r.gender,
        birthdate: r.birthdate,
        is_adult_verified: r.is_adult_verified,
        status: r.status,
        created_at: r.created_at ? r.created_at.toISOString() : '',
        country: r.country,
        country_code: r.country_code,
        is_profile_completed: Boolean(r.is_profile_completed),
        host_level: Number(r.host_level) || 1,
        wealth_level: Number(r.wealth_level) || 1,
        role: r.role || 'user',
        is_staff: Boolean(r.is_staff),
      };
    }
  }

  // Fallback to reference topstreamer user for demo preview
  const demoRows = await query('SELECT * FROM popolive.users WHERE email = $1 LIMIT 1', ['topstreamer@example.com']);
  if (demoRows.length > 0) {
    const r = demoRows[0];
    return {
      id: r.id,
      poppo_id: r.poppo_id,
      email: r.email,
      phone: r.phone,
      nickname: r.nickname,
      avatar_url: r.avatar_url,
      gender: r.gender,
      birthdate: r.birthdate,
      is_adult_verified: r.is_adult_verified,
      status: r.status,
      created_at: r.created_at ? r.created_at.toISOString() : '',
      country: r.country,
      country_code: r.country_code,
      is_profile_completed: Boolean(r.is_profile_completed),
      host_level: Number(r.host_level) || 1,
      wealth_level: Number(r.wealth_level) || 1,
      role: r.role || 'user',
      is_staff: Boolean(r.is_staff),
    };
  }

  return null;
}

/**
 * Fetch all inbox conversations for a user
 */
export async function getInboxConversations(userId: string): Promise<InboxConversationItem[]> {
  const sql = `
    SELECT 
      c.id,
      c.participant_one_id,
      c.participant_two_id,
      c.last_message_text,
      c.last_message_sender_id,
      c.last_message_at,
      c.status,
      CASE WHEN c.participant_one_id = $1 THEN c.unread_count_one ELSE c.unread_count_two END AS unread_count,
      CASE WHEN c.participant_one_id = $1 THEN c.is_pinned_one ELSE c.is_pinned_two END AS is_pinned,
      u.id AS opp_id,
      u.nickname AS opp_nickname,
      u.poppo_id AS opp_poppo_id,
      u.avatar_url AS opp_avatar_url,
      u.host_level AS opp_host_level,
      u.wealth_level AS opp_wealth_level,
      COALESCE(u.is_staff, false) AS opp_is_official,
      EXISTS(SELECT 1 FROM popolive.live_rooms lr WHERE lr.host_id = u.id AND lr.is_live = true) AS opp_is_live,
      (SELECT MAX(last_active_at) FROM popolive.sessions s WHERE s.user_id = u.id AND s.is_revoked = false) AS opp_last_active_at
    FROM popolive.inbox_conversations c
    INNER JOIN popolive.users u ON u.id = (CASE WHEN c.participant_one_id = $1 THEN c.participant_two_id ELSE c.participant_one_id END)
    WHERE c.participant_one_id = $1 OR c.participant_two_id = $1
    ORDER BY is_pinned DESC, c.last_message_at DESC NULLS LAST
  `;

  const rows = await query(sql, [userId]);

  return rows.map((r: any) => {
    const oppStatus = determineUserStatus({
      is_live: Boolean(r.opp_is_live),
      is_official: Boolean(r.opp_is_official),
      last_active_at: r.opp_last_active_at,
    });

    return {
      id: r.id,
      opponent: {
        id: r.opp_id,
        name: r.opp_nickname || 'Popo User',
        poppoId: String(r.opp_poppo_id || ''),
        avatarUrl: r.opp_avatar_url || '/assets/chat/avatar_default.png',
        status: oppStatus.status,
        lastSeen: oppStatus.lastSeen,
        ringColorHex: oppStatus.ringColorHex,
        isOfficial: Boolean(r.opp_is_official),
        hostLevel: Number(r.opp_host_level) || 1,
        wealthLevel: Number(r.opp_wealth_level) || 1,
      },
      lastMessage: r.last_message_text || 'No messages yet',
      lastMessageSenderId: r.last_message_sender_id,
      lastTime: r.last_message_at ? formatRelativeTime(r.last_message_at) : '',
      lastTimestamp: r.last_message_at ? new Date(r.last_message_at).toISOString() : '',
      unreadCount: Number(r.unread_count) || 0,
      isPinned: Boolean(r.is_pinned),
      status: r.status || 'active',
    };
  });
}

/**
 * Get or create 1v1 conversation between two users
 */
export async function getOrCreateConversation(userOneId: string, userTwoId: string): Promise<string> {
  const p1 = userOneId < userTwoId ? userOneId : userTwoId;
  const p2 = userOneId < userTwoId ? userTwoId : userOneId;

  const existing = await query(
    `SELECT id FROM popolive.inbox_conversations WHERE participant_one_id = $1 AND participant_two_id = $2`,
    [p1, p2]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const created = await query(
    `INSERT INTO popolive.inbox_conversations (participant_one_id, participant_two_id, status)
     VALUES ($1, $2, 'active')
     RETURNING id`,
    [p1, p2]
  );

  return created[0].id;
}

/**
 * Fetch messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<DirectMessageItem[]> {
  // Membership check
  const conv = await query(
    `SELECT participant_one_id, participant_two_id FROM popolive.inbox_conversations WHERE id = $1`,
    [conversationId]
  );

  if (conv.length === 0) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  const { participant_one_id, participant_two_id } = conv[0];
  if (participant_one_id !== userId && participant_two_id !== userId) {
    throw new Error('ACCESS_DENIED');
  }

  let sql = `
    SELECT id, conversation_id, sender_id, recipient_id, message_text,
           message_type, delivery_status, created_at
    FROM popolive.direct_messages
    WHERE conversation_id = $1
  `;
  const params: any[] = [conversationId];

  if (beforeTimestamp) {
    sql += ` AND created_at < $2`;
    params.push(beforeTimestamp);
  }

  sql += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
  params.push(limit);

  const rows = await query(sql, params);

  return rows.map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    text: m.message_text,
    messageType: m.message_type || 'text',
    deliveryStatus: m.delivery_status || 'sent',
    time: formatClockTime(m.created_at),
    timestamp: new Date(m.created_at).toISOString(),
    isMine: m.sender_id === userId,
  }));
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
  conversationId?: string;
  idempotencyKey?: string;
}): Promise<{ message: DirectMessageItem; conversationId: string; isIdempotentReplay?: boolean }> {
  const { senderId, recipientId, text, idempotencyKey } = params;

  if (!senderId || !recipientId) {
    throw new Error('INVALID_PARTICIPANTS');
  }
  if (senderId === recipientId) {
    throw new Error('CANNOT_MESSAGE_SELF');
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('EMPTY_MESSAGE');
  }

  // 1. Check idempotency
  if (idempotencyKey) {
    const existing = await query(
      `SELECT id, conversation_id, sender_id, recipient_id, message_text, message_type, delivery_status, created_at
       FROM popolive.direct_messages
       WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    if (existing.length > 0) {
      const m = existing[0];
      return {
        isIdempotentReplay: true,
        conversationId: m.conversation_id,
        message: {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          recipientId: m.recipient_id,
          text: m.message_text,
          messageType: m.message_type,
          deliveryStatus: m.delivery_status,
          time: formatClockTime(m.created_at),
          timestamp: new Date(m.created_at).toISOString(),
          isMine: m.sender_id === senderId,
        },
      };
    }
  }

  // 2. Check blocks in both directions
  const blockCheck = await query(
    `SELECT blocker_id, blocked_id FROM popolive.user_blocks 
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [senderId, recipientId]
  );

  if (blockCheck.length > 0) {
    const isBlockedByRecipient = blockCheck.some((b: any) => b.blocker_id === recipientId);
    if (isBlockedByRecipient) {
      throw new Error('USER_BLOCKED_BY_RECIPIENT');
    }
    throw new Error('USER_BLOCKED');
  }

  // 3. Check recipient privacy settings
  const privacyRows = await query(
    `SELECT message_permissions FROM popolive.user_privacy_settings WHERE user_id = $1`,
    [recipientId]
  );
  if (privacyRows.length > 0) {
    const perm = privacyRows[0].message_permissions;
    if (perm === 'none') {
      throw new Error('MESSAGE_PERMISSION_DENIED');
    }
    if (perm === 'followers') {
      const followCheck = await query(
        `SELECT 1 FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2`,
        [senderId, recipientId]
      );
      if (followCheck.length === 0) {
        throw new Error('MESSAGE_FOLLOWERS_ONLY');
      }
    }
  }

  // 4. Resolve conversation
  let convId = params.conversationId;
  if (!convId) {
    convId = await getOrCreateConversation(senderId, recipientId);
  }

  return await withTransaction(async (dbClient) => {
    // Insert message
    const msgRows = await dbClient.query(
      `INSERT INTO popolive.direct_messages (
         conversation_id, sender_id, recipient_id, message_text,
         message_type, delivery_status, idempotency_key, created_at
       ) VALUES ($1, $2, $3, $4, 'text', 'delivered', $5, CURRENT_TIMESTAMP)
       RETURNING id, created_at`,
      [convId, senderId, recipientId, trimmedText, idempotencyKey || null]
    );

    const msgId = msgRows.rows[0].id;
    const createdAt = msgRows.rows[0].created_at;

    // Update conversation last message & increment recipient unread count
    await dbClient.query(
      `UPDATE popolive.inbox_conversations
       SET last_message_id = $1,
           last_message_text = $2,
           last_message_sender_id = $3,
           last_message_at = $4,
           unread_count_one = CASE WHEN participant_one_id = $5 THEN unread_count_one + 1 ELSE unread_count_one END,
           unread_count_two = CASE WHEN participant_two_id = $5 THEN unread_count_two + 1 ELSE unread_count_two END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [msgId, trimmedText, senderId, createdAt, recipientId, convId]
    );

    // Sender details for event & notification
    const senderInfo = (await dbClient.query(
      `SELECT nickname, avatar_url FROM popolive.users WHERE id = $1`,
      [senderId]
    )).rows[0];

    // Push real-time event for recipient
    await dbClient.query(
      `INSERT INTO popolive.messaging_realtime_events (
         event_type, recipient_id, sender_id, conversation_id, payload
       ) VALUES ('new_message', $1, $2, $3, $4)`,
      [
        recipientId,
        senderId,
        convId,
        JSON.stringify({
          messageId: msgId,
          conversationId: convId,
          senderId,
          senderNickname: senderInfo?.nickname || 'Friend',
          senderAvatarUrl: senderInfo?.avatar_url || '',
          text: trimmedText,
          timestamp: new Date(createdAt).toISOString(),
        }),
      ]
    );

    // Create in-app notification for recipient
    await dbClient.query(
      `INSERT INTO popolive.user_in_app_notifications (
         user_id, category, actor_id, actor_nickname, actor_avatar_url,
         title, title_ur, body, body_ur, entity_type, entity_id
       ) VALUES ($1, 'messages', $2, $3, $4, $5, $6, $7, $8, 'conversation', $9)`,
      [
        recipientId,
        senderId,
        senderInfo?.nickname || 'Friend',
        senderInfo?.avatar_url || '',
        `Message from ${senderInfo?.nickname || 'Friend'}`,
        `${senderInfo?.nickname || 'دوست'} کی طرف سے پیغام`,
        trimmedText,
        trimmedText,
        convId,
      ]
    );

    return {
      conversationId: convId,
      message: {
        id: msgId,
        conversationId: convId,
        senderId,
        recipientId,
        text: trimmedText,
        messageType: 'text',
        deliveryStatus: 'delivered',
        time: formatClockTime(createdAt),
        timestamp: new Date(createdAt).toISOString(),
        isMine: true,
      },
    };
  });
}

/**
 * Mark a conversation as read
 */
export async function markConversationRead(conversationId: string, userId: string): Promise<boolean> {
  return await withTransaction(async (dbClient) => {
    // 1. Mark incoming messages as read
    await dbClient.query(
      `UPDATE popolive.direct_messages
       SET delivery_status = 'read', read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [conversationId, userId]
    );

    // 2. Reset unread count for user in conversation
    const res = await dbClient.query(
      `UPDATE popolive.inbox_conversations
       SET unread_count_one = CASE WHEN participant_one_id = $1 THEN 0 ELSE unread_count_one END,
           unread_count_two = CASE WHEN participant_two_id = $1 THEN 0 ELSE unread_count_two END
       WHERE id = $2 AND (participant_one_id = $1 OR participant_two_id = $1)
       RETURNING participant_one_id, participant_two_id`,
      [userId, conversationId]
    );

    if (res.rowCount === 0) return false;

    // 3. Emit real-time event
    const otherUser = res.rows[0].participant_one_id === userId
      ? res.rows[0].participant_two_id
      : res.rows[0].participant_one_id;

    await dbClient.query(
      `INSERT INTO popolive.messaging_realtime_events (
         event_type, recipient_id, sender_id, conversation_id, payload
       ) VALUES ('message_read', $1, $2, $3, $4)`,
      [otherUser, userId, conversationId, JSON.stringify({ conversationId, readByUserId: userId })]
    );

    return true;
  });
}

/**
 * Get unified inbox summary with authoritative unread counts
 */
export async function getInboxSummary(userId: string): Promise<InboxSummary> {
  // 1. Unread direct messages
  const msgRes = await query(
    `SELECT COALESCE(SUM(
       CASE WHEN participant_one_id = $1 THEN unread_count_one ELSE unread_count_two END
     ), 0) AS total_unread_messages
     FROM popolive.inbox_conversations
     WHERE participant_one_id = $1 OR participant_two_id = $1`,
    [userId]
  );
  const unreadMessagesCount = Number(msgRes[0]?.total_unread_messages) || 0;

  // 2. Unread system notices
  const noticeRes = await query(
    `SELECT COUNT(*) AS unread_notices
     FROM popolive.system_notices sn
     WHERE (sn.target_user_id IS NULL OR sn.target_user_id = $1)
       AND NOT EXISTS (
         SELECT 1 FROM popolive.user_notice_reads unr 
         WHERE unr.notice_id = sn.id AND unr.user_id = $1
       )`,
    [userId]
  );
  const unreadNoticesCount = Number(noticeRes[0]?.unread_notices) || 0;

  // 3. Unread notifications
  const notifRes = await query(
    `SELECT COUNT(*) AS unread_notifications
     FROM popolive.user_in_app_notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  const unreadNotificationsCount = Number(notifRes[0]?.unread_notifications) || 0;

  return {
    unreadMessagesCount,
    unreadNoticesCount,
    unreadNotificationsCount,
    totalUnreadCount: unreadMessagesCount + unreadNoticesCount + unreadNotificationsCount,
  };
}

/**
 * Get system notices
 */
export async function getSystemNotices(params: {
  userId: string;
  category?: string;
  unreadOnly?: boolean;
}): Promise<SystemNoticeItem[]> {
  const { userId, category = 'all', unreadOnly = false } = params;

  let sql = `
    SELECT sn.id, sn.reference_code, sn.category, sn.badge_label,
           sn.title, sn.title_ur, sn.short_desc, sn.short_desc_ur,
           sn.full_message, sn.full_message_ur, sn.is_important, sn.created_at,
           EXISTS(SELECT 1 FROM popolive.user_notice_reads unr WHERE unr.notice_id = sn.id AND unr.user_id = $1) AS is_read
    FROM popolive.system_notices sn
    WHERE (sn.target_user_id IS NULL OR sn.target_user_id = $1)
  `;
  const queryParams: any[] = [userId];

  if (category && category !== 'all') {
    queryParams.push(category);
    sql += ` AND sn.category = $${queryParams.length}`;
  }

  if (unreadOnly) {
    sql += ` AND NOT EXISTS (SELECT 1 FROM popolive.user_notice_reads unr WHERE unr.notice_id = sn.id AND unr.user_id = $1)`;
  }

  sql += ` ORDER BY sn.is_important DESC, sn.created_at DESC`;

  const rows = await query(sql, queryParams);

  return rows.map((r: any) => {
    const d = new Date(r.created_at);
    return {
      id: r.id,
      referenceCode: r.reference_code,
      category: r.category,
      badgeLabel: r.badge_label,
      title: r.title,
      titleUr: r.title_ur,
      shortDesc: r.short_desc,
      shortDescUr: r.short_desc_ur,
      fullMessage: r.full_message,
      fullMessageUr: r.full_message_ur,
      pubDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      pubTime: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      displayTimestamp: formatRelativeTime(d),
      isImportant: Boolean(r.is_important),
      isRead: Boolean(r.is_read),
    };
  });
}

/**
 * Mark a system notice as read
 */
export async function markNoticeRead(noticeId: string, userId: string): Promise<boolean> {
  await query(
    `INSERT INTO popolive.user_notice_reads (notice_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (notice_id, user_id) DO NOTHING`,
    [noticeId, userId]
  );
  return true;
}

/**
 * Mark all system notices as read
 */
export async function markAllNoticesRead(userId: string): Promise<number> {
  const notices = await query(
    `SELECT id FROM popolive.system_notices WHERE target_user_id IS NULL OR target_user_id = $1`,
    [userId]
  );
  let count = 0;
  for (const n of notices) {
    await query(
      `INSERT INTO popolive.user_notice_reads (notice_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (notice_id, user_id) DO NOTHING`,
      [n.id, userId]
    );
    count++;
  }
  return count;
}

/**
 * Get in-app notifications
 */
export async function getUserNotifications(params: {
  userId: string;
  category?: string;
  unreadOnly?: boolean;
}): Promise<InAppNotificationItem[]> {
  const { userId, category = 'all', unreadOnly = false } = params;

  let sql = `
    SELECT id, category, actor_id, actor_nickname, actor_avatar_url,
           title, title_ur, body, body_ur, entity_type, entity_id,
           is_read, created_at
    FROM popolive.user_in_app_notifications
    WHERE user_id = $1
  `;
  const queryParams: any[] = [userId];

  if (category && category.toLowerCase() !== 'all') {
    queryParams.push(category.toLowerCase());
    sql += ` AND LOWER(category) = $${queryParams.length}`;
  }

  if (unreadOnly) {
    sql += ` AND is_read = false`;
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await query(sql, queryParams);

  return rows.map((r: any) => {
    let ringColor = '#3B82F6';
    if (r.category === 'followers') ringColor = '#FF1A6C';
    else if (r.category === 'likes') ringColor = '#3B82F6';
    else if (r.category === 'comments') ringColor = '#A855F7';
    else if (r.category === 'invites') ringColor = '#10B981';
    else if (r.category === 'gifts') ringColor = '#FBBF24';

    return {
      id: r.id,
      category: r.category,
      actorId: r.actor_id,
      actorNickname: r.actor_nickname || 'Popo User',
      actorAvatarUrl: r.actor_avatar_url || '/assets/chat/avatar_default.png',
      title: r.title,
      titleUr: r.title_ur,
      body: r.body,
      bodyUr: r.body_ur,
      entityType: r.entity_type,
      entityId: r.entity_id,
      timeAgo: formatRelativeTime(r.created_at),
      timestamp: new Date(r.created_at).toISOString(),
      isRead: Boolean(r.is_read),
      ringColorHex: ringColor,
    };
  });
}

/**
 * Mark in-app notification read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  const res = await query(
    `UPDATE popolive.user_in_app_notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  return res.length > 0;
}

/**
 * Mark all notifications read
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await query(
    `UPDATE popolive.user_in_app_notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id`,
    [userId]
  );
  return res.length;
}

/**
 * Seed initial sample conversations for the reference user so inbox has realistic chats
 */
export async function seedInitialConversationsIfEmpty(userId: string): Promise<void> {
  const convCount = await query(
    `SELECT COUNT(*) AS cnt FROM popolive.inbox_conversations WHERE participant_one_id = $1 OR participant_two_id = $1`,
    [userId]
  );
  if (Number(convCount[0]?.cnt) > 0) return;

  // Find Zara, Sana, Alina, Mehak
  const hosts = await query(
    `SELECT id, nickname FROM popolive.users WHERE nickname IN ('Zara Live', 'Sana Khan', 'Alina', 'Mehak') LIMIT 4`
  );

  const sampleMessages: Record<string, string> = {
    'Zara Live': 'Hey! Are you watching my PK battle tonight? ✨',
    'Sana Khan': 'Thanks for the gift in my party room! ❤️',
    'Alina': 'Let me know if you want to join our guest seat!',
    'Mehak': 'Singing session starting in 10 minutes 🎶',
  };

  for (const h of hosts) {
    if (h.id === userId) continue;
    const text = sampleMessages[h.nickname] || 'Hey there! Welcome to Popo Live!';
    await sendDirectMessage({
      senderId: h.id,
      recipientId: userId,
      text,
    });
  }
}
