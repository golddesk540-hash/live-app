import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, respondToFanClubInvite } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const { inviteId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action === 'reject' ? 'reject' : 'accept';

    const result = await respondToFanClubInvite({
      inviteId,
      userId: user.id,
      action,
    });

    return NextResponse.json({ ...result });
  } catch (error: any) {
    console.error('Error responding to fan club invite:', error);
    const status = error.message === 'FORBIDDEN_NOT_INVITEE' ? 403 : error.message === 'INVITE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_PROCESS_INVITE' }, { status });
  }
}
