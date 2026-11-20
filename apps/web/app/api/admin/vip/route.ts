import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'vip:read');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    return NextResponse.json({
      success: true,
      memberships: [
        {
          id: 'vip-mem-501',
          userId: 'user-p8-003',
          planId: 'plan-gold-monthly',
          tierName: 'Gold Emperor VIP',
          status: 'active',
          expiresAt: '2026-03-10T10:00:00Z',
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
