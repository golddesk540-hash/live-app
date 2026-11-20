import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAgencyMembers, addAgencyMember, assertAdult } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    assertAdult(user, 'view agency members');

    const members = await getAgencyMembers(user.id);
    return NextResponse.json({
      success: true,
      members,
      count: members.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'AGENCY_MEMBERS_ERROR' },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const agencyId = body.agencyId;
    const hostUserId = body.hostUserId;

    if (!agencyId || !hostUserId) {
      return NextResponse.json(
        { success: false, error: 'Both agencyId and hostUserId are required.' },
        { status: 400 }
      );
    }

    const member = await addAgencyMember(user, agencyId, hostUserId);
    return NextResponse.json({
      success: true,
      member,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'ADD_MEMBER_ERROR' },
      { status: err.status || 500 }
    );
  }
}
