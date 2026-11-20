import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Host check
    if (room.host_user_id && room.host_user_id.toString() !== user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Only the party host can end the room.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await query(
      `UPDATE popolive.party_rooms 
       SET status = 'ended', is_live = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [room.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Party room broadcast ended.',
      status: 'ended',
      isLive: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
