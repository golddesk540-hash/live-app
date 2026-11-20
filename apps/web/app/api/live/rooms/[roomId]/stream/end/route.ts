import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { mediaService } from '@/lib/mediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/:roomId/stream/end
 * Authenticated Host-Only: Ends active live video stream and resets stream keys.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to end live stream.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { roomId } = params;
    const result = await mediaService.endStream(roomId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to end stream' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      roomId,
      message: 'Live stream terminated successfully.',
    });
  } catch (err: any) {
    console.error('Stream end error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to end stream' },
      { status: 500 }
    );
  }
}
