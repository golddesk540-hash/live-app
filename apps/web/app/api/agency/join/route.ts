import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, requestJoinAgency } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { agencyCode, agencyId } = body;
    const target = agencyCode || agencyId;

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Agency code or ID is required.' },
        { status: 400 }
      );
    }

    const result = await requestJoinAgency(target, user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error requesting agency join:', error);
    let status = 500;
    if (error.message === 'AGENCY_NOT_FOUND') status = 404;
    if (error.message.includes('ALREADY') || error.message === 'AGENCY_NOT_ACTIVE') status = 400;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_JOIN_AGENCY' }, { status });
  }
}
