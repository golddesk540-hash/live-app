import { NextRequest, NextResponse } from 'next/server';
import { getEventsList } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const events = await getEventsList(status);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_EVENTS' }, { status: 500 });
  }
}
