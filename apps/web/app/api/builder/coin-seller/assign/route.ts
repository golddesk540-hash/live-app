import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { assignCoinSeller, getBuilderAgency } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    let agencyId = body.agencyId;
    const targetUserId = body.targetUserId || body.userId;

    if (!agencyId) {
      const agency = await getBuilderAgency(user.id);
      agencyId = agency?.id;
    }

    if (!agencyId || !targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Both agencyId and targetUserId are required.' },
        { status: 400 }
      );
    }

    const res = await assignCoinSeller(user, agencyId, targetUserId);
    return NextResponse.json({
      success: true,
      coinSeller: res,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'ASSIGN_COIN_SELLER_ERROR' },
      { status: err.status || 500 }
    );
  }
}
