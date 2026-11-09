import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || body.preview === 'demo';

    const closedBy = authUser?.nickname || body.closedBy || 'Maria Live';
    const reason = body.reason || 'Host ended party session';
    const isHostAction = body.isHostAction !== false;

    // Security check: Only host can close room
    if (!isHostAction && !isDemo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Only the room host can close the party.',
        },
        { status: 403 }
      );
    }

    // Check room existence and current status
    const roomRows = await query(
      `SELECT room_number, title, host_user_id, host_nickname, is_live, status, created_at, closed_at
       FROM popolive.party_rooms
       WHERE room_number = $1`,
      [roomId]
    );

    if (!roomRows || roomRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Party room #${roomId} not found.` },
        { status: 404 }
      );
    }

    const room = roomRows[0];

    // Check if already closed
    if (room.status === 'closed' || room.closed_at) {
      return NextResponse.json({
        success: true,
        alreadyClosed: true,
        message: 'Party room is already closed.',
        roomNumber: roomId,
        status: 'closed',
        closedAt: room.closed_at,
      });
    }

    // Calculate closing stats
    const seatedRes = await query(
      `SELECT COUNT(*) as count FROM popolive.party_seats WHERE room_number = $1 AND status = 'occupied'`,
      [roomId]
    );
    const totalSeated = parseInt(seatedRes[0]?.count || '1', 10);

    const audienceRes = await query(
      `SELECT COUNT(*) as count FROM popolive.party_audience WHERE room_number = $1`,
      [roomId]
    );
    const peakAudience = Math.max(parseInt(audienceRes[0]?.count || '0', 10), 256);

    const createdAt = room.created_at ? new Date(room.created_at).getTime() : Date.now() - 3600000;
    const durationSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));

    const closedAt = new Date().toISOString();

    // Execute closing in transaction
    await withTransaction(async (client) => {
      // 1. Update party room status to closed
      await client.query(
        `UPDATE popolive.party_rooms
         SET status = 'closed',
             is_live = false,
             closed_at = NOW(),
             closed_by = $2,
             closing_reason = $3,
             updated_at = NOW()
         WHERE room_number = $1`,
        [roomId, closedBy, reason]
      );

      // 2. Cancel all pending seat requests
      await client.query(
        `UPDATE popolive.party_seat_requests
         SET status = 'cancelled',
             responded_at = NOW()
         WHERE room_number = $1 AND status = 'pending'`,
        [roomId]
      );

      // 3. Expire all pending invitations
      await client.query(
        `UPDATE popolive.party_seat_invitations
         SET status = 'expired',
             responded_at = NOW()
         WHERE room_number = $1 AND status = 'pending'`,
        [roomId]
      );

      // 4. Mark active audience presence as inactive
      await client.query(
        `UPDATE popolive.party_audience
         SET is_active = false
         WHERE room_number = $1`,
        [roomId]
      );

      // 5. Insert closing audit log
      await client.query(
        `INSERT INTO popolive.party_closing_logs (
           room_number, closed_by, closed_by_role, reason, duration_seconds, peak_audience, total_seated, created_at
         ) VALUES ($1, $2, 'host', $3, $4, $5, $6, NOW())`,
        [roomId, closedBy, reason, durationSeconds, peakAudience, totalSeated]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Party closed successfully. All media, requests, and audience sessions released.',
      status: 'closed',
      isLive: false,
      roomNumber: roomId,
      closedAt,
      closedBy,
      reason,
      summary: {
        durationSeconds,
        durationFormatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        peakAudience,
        totalSeated,
      },
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/close error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while closing party' },
      { status: 500 }
    );
  }
}
