import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateHostRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/start
 * Start broadcasting session for an existing room.
 * Enforces host ownership and Wealth Level 5.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

    // Verify room exists and belongs to host
    const roomRows = await query<any>(
      `SELECT lr.id, lr.room_number, lr.host_id, lr.title, lr.status, lr.agora_channel_name, lr.agora_uid,
              u.wealth_level, u.poppo_id
       FROM popolive.live_rooms lr
       JOIN popolive.users u ON lr.host_id = u.id
       WHERE ${isUuid ? 'lr.id = $1' : 'lr.room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.' }, { status: 404 });
    }

    const room = roomRows[0];
    if (room.host_id !== user.id && !user.is_staff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not own this live room.', code: 'FORBIDDEN_NOT_ROOM_OWNER' },
        { status: 403 }
      );
    }

    // Enforce locked business rule: Wealth level 5 required to go live
    const wealthLevel = Number(room.wealth_level) || 1;
    if (wealthLevel < 5) {
      return NextResponse.json(
        {
          success: false,
          error: `Wealth Level 5 is required to go live. Your current wealth level is Level ${wealthLevel}.`,
          code: 'WEALTH_LEVEL_INSUFFICIENT',
          currentWealthLevel: wealthLevel,
          requiredWealthLevel: 5,
        },
        { status: 403 }
      );
    }

    // Activate live session
    const agoraChannelName = room.agora_channel_name || `popo_room_${room.room_number}`;
    const agoraUid = Number(room.agora_uid) || Number(room.poppo_id) || 880219;

    await query(
      `UPDATE popolive.live_rooms
       SET status = 'live',
           is_live = true,
           started_at = CURRENT_TIMESTAMP,
           ended_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [room.id]
    );

    const agoraToken = generateHostRtcToken(agoraChannelName, agoraUid);

    return NextResponse.json({
      success: true,
      message: 'Live broadcast session started.',
      status: 'live',
      isLive: true,
      roomId: room.id,
      roomNumber: room.room_number,
      agora: agoraToken,
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/start error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to start live session.' }, { status: 500 });
  }
}
