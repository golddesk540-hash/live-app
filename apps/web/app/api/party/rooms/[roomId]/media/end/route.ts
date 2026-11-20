import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { partyMediaService } from '@/lib/partyMediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:roomId/media/end
 * Host-only: Forces termination of party audio session, invalidating participant tokens.
 */
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

    const { roomId } = params;
    const result = await partyMediaService.endPartyMedia(roomId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to end party media' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      roomId,
      message: 'Party media session ended successfully.',
    });
  } catch (err: any) {
    console.error('Party media end error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to end party media' },
      { status: 500 }
    );
  }
}
