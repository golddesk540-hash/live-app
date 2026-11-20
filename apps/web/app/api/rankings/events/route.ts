import { NextRequest, NextResponse } from 'next/server';
import { getEventRankings } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rankings/events
 * PART 4 & Test 15:
 * Returns active event boards and leaderboards.
 */
export async function GET(req: NextRequest) {
  try {
    const events = await getEventRankings();

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (error: any) {
    console.error('Error fetching event rankings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_EVENT_RANKINGS' },
      { status: 500 }
    );
  }
}
