import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, getInboxSummary } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const summary = await getInboxSummary(actor.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/summary:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
