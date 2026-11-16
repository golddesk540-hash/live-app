import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, joinFanClub } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await joinFanClub(clubId, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error joining fan club:', error);
    const status = error.message === 'FAN_CLUB_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_JOIN_CLUB' }, { status });
  }
}
