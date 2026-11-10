import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redisSetWithTtl } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const invitationId = body.invitationId;
    const senderHostId = authUser?.id || body.senderHostId || body.hostId;

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVITATION_ID_REQUIRED',
          error: 'Invitation ID is required.',
          errorUr: 'دعوت نامے کی شناخت درکار ہے۔',
        },
        { status: 400 }
      );
    }

    const inviteRows = await query(
      `SELECT * FROM popolive.pk_invitations WHERE id = $1`,
      [invitationId]
    );

    const invite = inviteRows[0];
    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVITATION_NOT_FOUND',
          error: 'Invitation not found.',
          errorUr: 'دعوت نامہ نہیں ملا۔',
        },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          code: 'CANNOT_CANCEL',
          error: `Invitation cannot be cancelled because it is already ${invite.status}.`,
          errorUr: `دعوت نامہ منسوخ نہیں کیا جا سکتا کیونکہ یہ پہلے ہی ${invite.status} ہے۔`,
        },
        { status: 400 }
      );
    }

    await query(
      `UPDATE popolive.pk_invitations 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE id = $1`,
      [invitationId]
    );

    await redisSetWithTtl(
      `pk:invitation:${invitationId}`,
      JSON.stringify({ id: invitationId, status: 'cancelled' }),
      60
    );

    return NextResponse.json({
      success: true,
      message: 'PK battle invitation cancelled successfully.',
      messageUr: 'پی کے مقابلے کا دعوت نامہ منسوخ کر دیا گیا۔',
      invitationId,
      status: 'cancelled',
    });
  } catch (err: any) {
    console.error('API /api/pk/invitation/cancel error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
