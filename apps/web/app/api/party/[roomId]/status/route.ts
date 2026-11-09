import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    const roomRows = await query(
      `SELECT room_number, title, host_nickname, host_avatar, is_live, status, 
              category, closed_at, closed_by, closing_reason, created_at, updated_at
       FROM popolive.party_rooms
       WHERE room_number = $1`,
      [roomId]
    );

    if (!roomRows || roomRows.length === 0) {
      // Fallback response for demo rooms
      return NextResponse.json({
        success: true,
        roomNumber: roomId,
        status: 'active',
        isLive: true,
        closedAt: null,
      });
    }

    const room = roomRows[0];
    const isClosed = room.status === 'closed' || !!room.closed_at;

    // Fetch latest closing log if closed
    let closingLog = null;
    if (isClosed) {
      const logs = await query(
        `SELECT duration_seconds, peak_audience, total_seated, reason, created_at
         FROM popolive.party_closing_logs
         WHERE room_number = $1
         ORDER BY created_at DESC LIMIT 1`,
        [roomId]
      );
      if (logs && logs[0]) {
        closingLog = logs[0];
      }
    }

    return NextResponse.json({
      success: true,
      roomNumber: room.room_number,
      title: room.title,
      hostNickname: room.host_nickname,
      status: room.status,
      isLive: !isClosed && room.is_live,
      isClosed,
      closedAt: room.closed_at,
      closedBy: room.closed_by,
      closingReason: room.closing_reason,
      createdAt: room.created_at,
      summary: closingLog
        ? {
            durationSeconds: closingLog.duration_seconds,
            peakAudience: closingLog.peak_audience,
            totalSeated: closingLog.total_seated,
          }
        : null,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching party status' },
      { status: 500 }
    );
  }
}
