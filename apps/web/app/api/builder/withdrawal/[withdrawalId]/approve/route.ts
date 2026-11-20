import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { withdrawalId: string } }
) {
  try {
    const { withdrawalId } = params;
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const adminUserId = authUser?.id || body.adminUserId || 'system_admin';

    const result = await webKycPayoutService.approveWithdrawal(withdrawalId, adminUserId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to approve withdrawal.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawal: result.withdrawal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve withdrawal.' },
      { status: 500 }
    );
  }
}
