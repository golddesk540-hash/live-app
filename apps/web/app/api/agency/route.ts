import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, getAgencyInfo } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const data = await getAgencyInfo(user.id);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('Error fetching agency info:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_AGENCY' }, { status: 500 });
  }
}
