import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to start KYC verification.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const result = await webKycPayoutService.startKyc(userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.code === 'UNDERAGE_KYC_FORBIDDEN' ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start KYC session.' },
      { status: 500 }
    );
  }
}
