import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { recordInvitation } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/invite/record
 * Records an invitation with unique constraint on (inviter_id, invitee_id).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to record invitation.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const inviterId = typeof body.inviterId === 'string' ? body.inviterId : user.id;
    const inviteeId = typeof body.inviteeId === 'string' ? body.inviteeId : '';
    const codeUsed = typeof body.codeUsed === 'string' ? body.codeUsed : `POPO-${user.poppo_id}`;

    if (!inviteeId) {
      return NextResponse.json(
        { success: false, error: 'inviteeId is required.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const result = await recordInvitation({ inviterId, inviteeId, codeUsed });

    return NextResponse.json({
      success: true,
      invitationId: result.invitationId,
      message: 'Invitation recorded successfully.',
    });
  } catch (err: any) {
    if (err.code === 'DUPLICATE_INVITATION') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'DUPLICATE_INVITATION' },
        { status: 409 }
      );
    }

    console.error('POST /api/community/invite/record error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record invitation.' },
      { status: err.status || 500 }
    );
  }
}
