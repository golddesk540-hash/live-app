import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, getEventLeaderboard } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const user = await resolveUserActor(req);

    const data = await getEventLeaderboard(eventId, user?.id);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('Error fetching event leaderboard:', error);
    const status = error.message === 'EVENT_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_LEADERBOARD' }, { status });
  }
}
