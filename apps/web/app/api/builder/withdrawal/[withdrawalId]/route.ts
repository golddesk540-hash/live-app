import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { withdrawalId: string } }
) {
  try {
    const { withdrawalId } = params;
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.nextUrl.searchParams.get('userId') || undefined;

    const history = userId ? await webKycPayoutService.getWithdrawalHistory(userId) : [];
    const withdrawal = history.find(
      (w) => w.withdrawalReference === withdrawalId || w.id === withdrawalId
    );

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve withdrawal status.' },
      { status: 500 }
    );
  }
}
