import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to retrieve KYC status.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const status = await webKycPayoutService.getKycStatus(userId);

    return NextResponse.json({
      success: true,
      kyc: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve KYC status.' },
      { status: 500 }
    );
  }
}
