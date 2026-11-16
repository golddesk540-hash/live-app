import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, getAgencyMembers } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get('agencyId');
    const statusFilter = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'agencyId is required.' }, { status: 400 });
    }

    const members = await getAgencyMembers({
      agencyId,
      requesterId: user.id,
      statusFilter,
      search,
    });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error: any) {
    console.error('Error fetching agency members:', error);
    let status = 500;
    if (error.message === 'AGENCY_NOT_FOUND') status = 404;
    if (error.message === 'UNAUTHORIZED_AGENCY_ACCESS') status = 403;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_MEMBERS' }, { status });
  }
}
