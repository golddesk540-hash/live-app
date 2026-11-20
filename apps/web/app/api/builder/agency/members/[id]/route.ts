import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { addAgencyMember, removeAgencyMember, getBuilderAgency } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    let agencyId = '';
    try {
      const body = await req.json();
      agencyId = body.agencyId;
    } catch {}

    if (!agencyId) {
      const agency = await getBuilderAgency(user.id);
      agencyId = agency?.id;
    }

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'Agency ID required.' }, { status: 400 });
    }

    const member = await addAgencyMember(user, agencyId, id);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    let agencyId = req.nextUrl.searchParams.get('agencyId') || '';
    if (!agencyId) {
      try {
        const body = await req.json();
        agencyId = body?.agencyId;
      } catch {}
    }

    if (!agencyId) {
      const agency = await getBuilderAgency(user.id);
      agencyId = agency?.id;
    }

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'Agency ID required.' }, { status: 400 });
    }

    const res = await removeAgencyMember(user, agencyId, id);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'REMOVE_MEMBER_ERROR' },
      { status: err.status || 500 }
    );
  }
}
