import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required to leave audience.' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE popolive.party_audience
       SET is_active = false, last_heartbeat = NOW()
       WHERE room_number = $1 AND user_id = $2`,
      [roomId, userId]
    );

    const countRes = await query(
      `SELECT COUNT(*) as count FROM popolive.party_audience WHERE room_number = $1 AND is_active = true`,
      [roomId]
    );
    const activeDbCount = parseInt(countRes[0]?.count || '0', 10);
    const audienceCount = Math.max(roomId === '7001' ? 256 : 50, activeDbCount);

    return NextResponse.json({
      success: true,
      message: `User left party audience`,
      roomNumber: roomId,
      audienceCount,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/audience/leave error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to leave party audience' },
      { status: 500 }
    );
  }
}
