import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'withdrawals:read');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    return NextResponse.json({
      success: true,
      queue: [
        {
          id: 'wth-801',
          withdrawalRef: 'WTH_20260210_801',
          userId: 'user-p8-001',
          amountPoints: 100000,
          payoutAmountUsd: 100.0,
          status: 'pending',
          createdAt: '2026-02-10T09:00:00Z',
        },
      ],
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
