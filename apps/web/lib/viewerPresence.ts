import { query } from './db';
import { getRedisClient } from './redis';

export interface RoomDetails {
  id: string;
  room_number: string;
  title: string;
  host_id: string;
  status: string;
  is_live: boolean;
  viewer_count: number;
  peak_viewer_count: number;
}

export interface ViewerInfo {
  id: string;
  viewerId: string | null;
  sessionId: string;
  joinedAt: string;
  lastHeartbeat: string;
  nickname: string;
  avatarUrl: string;
  wealthLevel: number;
  hostLevel: number;
}

export function formatViewerDisplay(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

/**
 * Resolves a room row by UUID or numeric room_number.
 */
export async function resolveLiveRoom(roomIdOrNumber: string): Promise<RoomDetails | null> {
  if (!roomIdOrNumber) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomIdOrNumber);
  const rows = await query<RoomDetails>(
    `SELECT id, room_number, title, host_id, status, is_live, viewer_count, peak_viewer_count
     FROM popolive.live_rooms
     WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
     LIMIT 1`,
    [roomIdOrNumber]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Marks inactive any viewer presence whose last_heartbeat is older than staleSeconds (default 60s).
 */
export async function cleanupStalePresence(roomId: string, staleSeconds: number = 60): Promise<number> {
  const res = await query<any>(
    `UPDATE popolive.live_room_viewers
     SET is_active = false, left_at = CURRENT_TIMESTAMP
     WHERE room_id = $1 
       AND is_active = true 
       AND last_heartbeat < CURRENT_TIMESTAMP - ($2 || ' seconds')::interval
     RETURNING id`,
    [roomId, `${staleSeconds}`]
  );
  return res.length;
}

/**
 * Calculates real viewer count from SQL active presence, excluding stale heartbeats (>60s).
 * Synchronizes room.viewer_count and peak_viewer_count in popolive.live_rooms.
 */
export async function calculateActiveViewerCount(roomId: string, staleSeconds: number = 60): Promise<number> {
  const countRows = await query<any>(
    `SELECT COUNT(DISTINCT COALESCE(viewer_id::text, session_id))::int AS active_count
     FROM popolive.live_room_viewers
     WHERE room_id = $1
       AND is_active = true
       AND (last_heartbeat >= CURRENT_TIMESTAMP - ($2 || ' seconds')::interval OR last_heartbeat IS NULL)`,
    [roomId, `${staleSeconds}`]
  );

  const count = Number(countRows[0]?.active_count) || 0;

  await query(
    `UPDATE popolive.live_rooms
     SET viewer_count = $2,
         peak_viewer_count = GREATEST(COALESCE(peak_viewer_count, 0), $2),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [roomId, count]
  );

  return count;
}

/**
 * Handles viewer joining a room.
 * - Enforces room existence (404)
 * - Enforces room is active (400 ROOM_ENDED)
 * - Upserts active presence (idempotent, no duplicate count on reconnect or refresh)
 * - Returns updated count and display string
 */
export async function recordViewerJoin(params: {
  roomIdOrNumber: string;
  userId: string;
  sessionId?: string;
  deviceInfo?: Record<string, any>;
}): Promise<{
  roomId: string;
  roomNumber: string;
  sessionId: string;
  viewerCount: number;
  viewerDisplay: string;
  isNewJoin: boolean;
}> {
  const room = await resolveLiveRoom(params.roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (room.status !== 'live' || !room.is_live) {
    const err: any = new Error('Live room has ended or is not currently active.');
    err.code = 'ROOM_ENDED';
    err.status = 400;
    throw err;
  }

  const effectiveSessionId = (params.sessionId || `sess_${params.userId.substring(0, 8)}_${Date.now()}`).trim();

  // Check if presence record exists for this user in this room
  const existingPresence = await query<any>(
    `SELECT id, is_active FROM popolive.live_room_viewers
     WHERE room_id = $1 AND (viewer_id = $2 OR session_id = $3)
     ORDER BY last_heartbeat DESC
     LIMIT 1`,
    [room.id, params.userId, effectiveSessionId]
  );

  let isNew = false;

  if (existingPresence.length > 0) {
    // Reactivate and touch heartbeat
    await query(
      `UPDATE popolive.live_room_viewers
       SET is_active = true,
           last_heartbeat = CURRENT_TIMESTAMP,
           left_at = NULL,
           session_id = $2,
           device_info = COALESCE($3::jsonb, device_info)
       WHERE id = $1`,
      [existingPresence[0].id, effectiveSessionId, JSON.stringify(params.deviceInfo || {})]
    );
  } else {
    // Insert new active presence
    await query(
      `INSERT INTO popolive.live_room_viewers (
        id, room_id, viewer_id, session_id, joined_at, last_heartbeat, is_active, device_info
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, $4::jsonb
      )`,
      [room.id, params.userId, effectiveSessionId, JSON.stringify(params.deviceInfo || {})]
    );
    isNew = true;
  }

  // Sync Redis if available
  try {
    const redis = getRedisClient();
    await redis.sadd(`room:${room.id}:viewers`, params.userId);
    await redis.expire(`room:${room.id}:viewers`, 3600);
  } catch {}

  const activeCount = await calculateActiveViewerCount(room.id);

  return {
    roomId: room.id,
    roomNumber: room.room_number,
    sessionId: effectiveSessionId,
    viewerCount: activeCount,
    viewerDisplay: formatViewerDisplay(activeCount),
    isNewJoin: isNew,
  };
}

/**
 * Handles viewer leaving a room.
 * - Idempotent (safe repeated calls, never throws if already left)
 * - Deactivates presence (is_active = false, left_at = NOW())
 * - Recalculates real count
 */
export async function recordViewerLeave(params: {
  roomIdOrNumber: string;
  userId?: string | null;
  sessionId?: string | null;
}): Promise<{
  roomId: string;
  roomNumber: string;
  viewerCount: number;
  viewerDisplay: string;
}> {
  const room = await resolveLiveRoom(params.roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (params.userId || params.sessionId) {
    await query(
      `UPDATE popolive.live_room_viewers
       SET is_active = false, left_at = CURRENT_TIMESTAMP
       WHERE room_id = $1 
         AND (($2::uuid IS NOT NULL AND viewer_id = $2::uuid) OR ($3::varchar IS NOT NULL AND session_id = $3::varchar))
         AND is_active = true`,
      [room.id, params.userId || null, params.sessionId || null]
    );

    // Sync Redis if available
    try {
      const redis = getRedisClient();
      if (params.userId) await redis.srem(`room:${room.id}:viewers`, params.userId);
    } catch {}
  }

  const activeCount = await calculateActiveViewerCount(room.id);

  return {
    roomId: room.id,
    roomNumber: room.room_number,
    viewerCount: activeCount,
    viewerDisplay: formatViewerDisplay(activeCount),
  };
}

/**
 * Handles periodic viewer heartbeat.
 * - Updates last_heartbeat for active viewer
 * - Cleans up stale presences
 * - Recalculates count
 */
export async function recordViewerHeartbeat(params: {
  roomIdOrNumber: string;
  userId: string;
  sessionId?: string;
}): Promise<{
  roomId: string;
  roomNumber: string;
  viewerCount: number;
  viewerDisplay: string;
}> {
  const room = await resolveLiveRoom(params.roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (room.status !== 'live' || !room.is_live) {
    const err: any = new Error('Live room has ended.');
    err.code = 'ROOM_ENDED';
    err.status = 400;
    throw err;
  }

  const effectiveSessionId = params.sessionId || null;

  await query(
    `UPDATE popolive.live_room_viewers
     SET last_heartbeat = CURRENT_TIMESTAMP, is_active = true
     WHERE room_id = $1 
       AND (($2::uuid IS NOT NULL AND viewer_id = $2::uuid) OR ($3::varchar IS NOT NULL AND session_id = $3::varchar))`,
    [room.id, params.userId, effectiveSessionId]
  );

  // Evict stale presence records > 60s
  await cleanupStalePresence(room.id, 60);

  const activeCount = await calculateActiveViewerCount(room.id);

  return {
    roomId: room.id,
    roomNumber: room.room_number,
    viewerCount: activeCount,
    viewerDisplay: formatViewerDisplay(activeCount),
  };
}

/**
 * Fetches list of active viewers in the room with profile info.
 */
export async function getActiveRoomViewers(
  roomIdOrNumber: string,
  limit: number = 50
): Promise<{
  roomId: string;
  roomNumber: string;
  viewerCount: number;
  viewerDisplay: string;
  viewers: ViewerInfo[];
}> {
  const room = await resolveLiveRoom(roomIdOrNumber);
  if (!room) {
    const err: any = new Error('Live room not found.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Evict stale records
  await cleanupStalePresence(room.id, 60);

  const rows = await query<any>(
    `SELECT v.id, v.viewer_id, v.session_id, v.joined_at, v.last_heartbeat,
            COALESCE(u.nickname, 'Viewer') as nickname,
            COALESCE(u.avatar_url, '/avatars/default.png') as avatar_url,
            COALESCE(u.wealth_level, 1) as wealth_level,
            COALESCE(u.host_level, 1) as host_level
     FROM popolive.live_room_viewers v
     LEFT JOIN popolive.users u ON v.viewer_id = u.id
     WHERE v.room_id = $1
       AND v.is_active = true
       AND (v.last_heartbeat >= CURRENT_TIMESTAMP - INTERVAL '60 seconds' OR v.last_heartbeat IS NULL)
     ORDER BY v.joined_at ASC
     LIMIT $2`,
    [room.id, limit]
  );

  const activeCount = await calculateActiveViewerCount(room.id);

  return {
    roomId: room.id,
    roomNumber: room.room_number,
    viewerCount: activeCount,
    viewerDisplay: formatViewerDisplay(activeCount),
    viewers: rows.map((r: any) => ({
      id: r.id,
      viewerId: r.viewer_id,
      sessionId: r.session_id,
      joinedAt: r.joined_at ? new Date(r.joined_at).toISOString() : '',
      lastHeartbeat: r.last_heartbeat ? new Date(r.last_heartbeat).toISOString() : '',
      nickname: r.nickname,
      avatarUrl: r.avatar_url,
      wealthLevel: Number(r.wealth_level) || 1,
      hostLevel: Number(r.host_level) || 1,
    })),
  };
}
