import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, getHostRankings } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await getHostRankings({
      period,
      limit,
      viewerId: user?.id || null,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('Error fetching host rankings:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_RANKINGS' }, { status: 500 });
  }
}
