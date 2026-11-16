import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, joinEvent } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const user = await resolveUserActor(req);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await joinEvent(eventId, user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error joining event:', error);
    let status = 500;
    if (error.message === 'EVENT_NOT_FOUND') status = 404;
    if (error.message === 'EVENT_COMPLETED') status = 400;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_JOIN_EVENT' }, { status });
  }
}
