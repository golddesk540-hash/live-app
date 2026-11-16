import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, getUserFanClubInvites, sendFanClubInvite } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const invites = await getUserFanClubInvites(user.id);
    return NextResponse.json({ success: true, invites, count: invites.length });
  } catch (error: any) {
    console.error('Error fetching fan club invites:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_INVITES' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { clubId, inviteeId, inviteCode } = body;

    if (!clubId || !inviteeId) {
      return NextResponse.json({ success: false, error: 'clubId and inviteeId are required.' }, { status: 400 });
    }

    if (inviteeId === user.id) {
      return NextResponse.json({ success: false, error: 'Cannot send fan club invitation to yourself.' }, { status: 400 });
    }

    const invite = await sendFanClubInvite({
      clubId,
      inviterId: user.id,
      inviteeId,
      inviteCode,
    });

    return NextResponse.json({ success: true, invite });
  } catch (error: any) {
    console.error('Error sending fan club invite:', error);
    const status = error.message === 'CANNOT_INVITE_SELF' ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_SEND_INVITE' }, { status });
  }
}
