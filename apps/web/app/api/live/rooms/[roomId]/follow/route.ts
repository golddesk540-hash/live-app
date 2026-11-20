import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/follow
 * Follow the host of the specified live room.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required to follow.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id, host_id FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const hostId = roomRows[0].host_id;

    if (hostId === user.id) {
      return NextResponse.json({ success: false, error: 'You cannot follow yourself.', code: 'CANNOT_FOLLOW_SELF' }, { status: 400 });
    }

    // Insert follow record idempotently
    await query(
      `INSERT INTO popolive.user_follows (id, follower_id, following_id, created_at, live_notifications_enabled)
       VALUES (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP, true)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [user.id, hostId]
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully followed host.',
      isFollowing: true,
      hostId,
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/follow error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to follow host.' }, { status: 500 });
  }
}

/**
 * DELETE /api/live/rooms/[roomId]/follow
 * Unfollow the host of the specified live room.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required to unfollow.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id, host_id FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const hostId = roomRows[0].host_id;

    // Delete follow record
    await query(
      `DELETE FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2`,
      [user.id, hostId]
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed host.',
      isFollowing: false,
      hostId,
    });
  } catch (err: any) {
    console.error(`DELETE /api/live/rooms/${params.roomId}/follow error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to unfollow host.' }, { status: 500 });
  }
}
