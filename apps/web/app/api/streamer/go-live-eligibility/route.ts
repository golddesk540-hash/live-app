import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getGoLiveEligibility } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const eligibility = await getGoLiveEligibility(user);
    return NextResponse.json({
      success: true,
      ...eligibility,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'GO_LIVE_ELIGIBILITY_ERROR' },
      { status: err.status || 500 }
    );
  }
}
