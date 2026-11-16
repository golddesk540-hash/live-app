import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, approveAgencyMember } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { memberId } = await params;
    const user = await resolveUserActor(req);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { agencyId } = body;

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'agencyId is required.' }, { status: 400 });
    }

    const result = await approveAgencyMember({
      agencyId,
      memberId,
      adminUserId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error approving agency member:', error);
    let status = 500;
    if (error.message === 'AGENCY_NOT_FOUND' || error.message === 'MEMBER_NOT_FOUND') status = 404;
    if (error.message === 'FORBIDDEN_NOT_AGENCY_ADMIN') status = 403;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_APPROVE_MEMBER' }, { status });
  }
}
