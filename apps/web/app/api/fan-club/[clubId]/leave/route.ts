import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, leaveFanClub } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await leaveFanClub(clubId, user.id);
    return NextResponse.json({ ...result });
  } catch (error: any) {
    console.error('Error leaving fan club:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_LEAVE_CLUB' }, { status: 500 });
  }
}
