import { NextRequest, NextResponse } from 'next/server';
import { mediaService } from '@/lib/mediaService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms/:roomId/playback
 * Public Viewer Endpoint: Returns signed HLS playback URL, video presets, and live stream status.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const result = await mediaService.getPlayback(roomId);

    if (!result.success) {
      const statusCode = result.code === 'ROOM_NOT_FOUND' ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      playback: result.playback,
    });
  } catch (err: any) {
    console.error('Stream playback error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve stream playback' },
      { status: 500 }
    );
  }
}
