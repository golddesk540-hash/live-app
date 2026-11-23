import { query } from './db';
import { AuthUser } from './auth';

export interface ChatMessageRecord {
  id: string;
  roomId: string;
  roomNumber?: string;
  senderId: string;
  senderNickname: string;
  senderAvatarUrl: string;
  senderRole: string;
  content: string;
  messageText: string;
  messageType: string;
  isPinned: boolean;
  wealthLevel: number;
  hostLevel: number;
  createdAt: string;
}

/**
 * Resolves a live room by UUID or numeric room_number.
 */
export async function resolveLiveRoom(roomIdOrNumber: string) {
  if (!roomIdOrNumber) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomIdOrNumber);
  const rows = await query<any>(
    `SELECT id, room_number, host_id, title, status, is_live
     FROM popolive.live_rooms
     WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
     LIMIT 1`,
    [roomIdOrNumber]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Inserts a new chat message into popolive.live_room_chat_messages.
 * Enforces session-derived sender, active room validation, non-empty content, and max length.
 */
export async function sendLiveRoomChatMessage(params: {
  roomIdOrNumber: string;
  user: AuthUser;
  content: string;
  messageType?: string;
  emoji?: string;
}): Promise<ChatMessageRecord> {
  const rawContent = (params.content || '').trim();
  if (!rawContent) {
    const err: any = new Error('Message content cannot be empty.');
    err.code = 'EMPTY_MESSAGE';
    err.status = 400;
    throw err;
  }

  if (rawContent.length > 500) {
    const err: any = new Error('Message exceeds maximum limit of 500 characters.');
    err.code = 'MESSAGE_TOO_LONG';
    err.status = 400;
    throw err;
  }

  const room = await resolveLiveRoom(params.roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Room must be active to post messages
  if (room.status !== 'live' || !room.is_live) {
    const err: any = new Error('Cannot send messages to an ended live broadcast.');
    err.code = 'ROOM_ENDED';
    err.status = 400;
    throw err;
  }

  const senderRole =
    room.host_id === params.user.id
      ? 'host'
      : params.user.is_staff || params.user.role === 'admin' || params.user.role === 'staff'
      ? 'staff'
      : 'viewer';

  const avatar = params.user.avatar_url || '/avatars/default.png';
  const nickname = params.user.nickname || 'Viewer';
  const messageType = params.messageType || (params.emoji ? 'emoji' : 'text');

  // Insert into authoritative B4 table: live_room_chat_messages
  const insertRows = await query<any>(
    `INSERT INTO popolive.live_room_chat_messages (
      id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role,
      content, message_type, is_pinned, is_deleted, created_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, false, false, CURRENT_TIMESTAMP
    )
    RETURNING id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role,
              content, message_type, is_pinned, created_at`,
    [
      room.id,
      params.user.id,
      nickname,
      avatar,
      senderRole,
      rawContent,
      messageType,
    ]
  );

  const m = insertRows[0];

  // Optional: Also sync to legacy live_room_messages for backwards compatibility
  query(
    `INSERT INTO popolive.live_room_messages (
      id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role,
      message_text, emoji, is_pinned, is_deleted, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, false, false, $9
    ) ON CONFLICT DO NOTHING`,
    [
      m.id,
      String(room.room_number || room.id),
      m.sender_id,
      m.sender_nickname,
      m.sender_avatar_url,
      m.sender_role,
      m.content,
      params.emoji || null,
      m.created_at,
    ]
  ).catch(() => {});

  return {
    id: m.id,
    roomId: m.room_id,
    roomNumber: room.room_number,
    senderId: m.sender_id,
    senderNickname: m.sender_nickname,
    senderAvatarUrl: m.sender_avatar_url,
    senderRole: m.sender_role,
    content: m.content,
    messageText: m.content,
    messageType: m.message_type,
    isPinned: Boolean(m.is_pinned),
    wealthLevel: params.user.wealth_level || 1,
    hostLevel: params.user.host_level || 1,
    createdAt: new Date(m.created_at).toISOString(),
  };
}

/**
 * Retrieves chat history from popolive.live_room_chat_messages.
 * Supports cursor/after timestamp and limit.
 */
export async function getLiveRoomChatHistory(params: {
  roomIdOrNumber: string;
  after?: string | null;
  limit?: number;
}): Promise<{
  roomId: string;
  roomNumber: string;
  messages: ChatMessageRecord[];
  totalCount: number;
}> {
  const room = await resolveLiveRoom(params.roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const limit = Math.min(Math.max(params.limit || 50, 1), 100);

  let querySql = `
    SELECT m.id, m.room_id, m.sender_id, m.sender_nickname, m.sender_avatar_url, m.sender_role,
           m.content, m.message_type, m.is_pinned, m.created_at,
           COALESCE(u.wealth_level, 1) as wealth_level,
           COALESCE(u.host_level, 1) as host_level
    FROM popolive.live_room_chat_messages m
    LEFT JOIN popolive.users u ON m.sender_id = u.id
    WHERE m.room_id = $1 AND m.is_deleted = false
  `;
  const queryParams: any[] = [room.id];

  if (params.after) {
    // Add 1 millisecond to prevent sub-millisecond precision overlap matching the cursor message itself
    querySql += ` AND m.created_at > ($2::timestamptz + INTERVAL '1 millisecond')`;
    queryParams.push(params.after);
  }

  querySql += ` ORDER BY m.created_at ASC LIMIT $${queryParams.length + 1}`;
  queryParams.push(limit);

  const rows = await query<any>(querySql, queryParams);

  const messages: ChatMessageRecord[] = rows.map((r: any) => ({
    id: r.id,
    roomId: r.room_id,
    roomNumber: room.room_number,
    senderId: r.sender_id,
    senderNickname: r.sender_nickname || 'Viewer',
    senderAvatarUrl: r.sender_avatar_url || '/avatars/default.png',
    senderRole: r.sender_role || 'viewer',
    content: r.content,
    messageText: r.content,
    messageType: r.message_type || 'text',
    isPinned: Boolean(r.is_pinned),
    wealthLevel: Number(r.wealth_level) || 1,
    hostLevel: Number(r.host_level) || 1,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  return {
    roomId: room.id,
    roomNumber: room.room_number,
    messages,
    totalCount: messages.length,
  };
}
