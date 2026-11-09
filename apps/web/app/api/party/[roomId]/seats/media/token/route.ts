import { NextRequest, NextResponse } from 'next/server';
import { generateHostRtcToken, generateViewerRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const { searchParams } = new URL(req.url);

    const seatNumber = Number(searchParams.get('seatNumber') || '1');
    const roleParam = searchParams.get('role') || 'publisher';
    const rawUid = searchParams.get('uid');
    
    // Default UID derived from room and seat if not supplied
    const uid = rawUid ? parseInt(rawUid, 10) : 700000 + seatNumber;

    const channelName = `party_${roomId}`;

    let tokenResult;
    if (roleParam === 'subscriber' || roleParam === 'audience') {
      tokenResult = generateViewerRtcToken(channelName, uid);
    } else {
      tokenResult = generateHostRtcToken(channelName, uid);
    }

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      seatNumber,
      tokenResult,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/media/token error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate Agora token' },
      { status: 500 }
    );
  }
}
