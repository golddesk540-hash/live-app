import { NextRequest, NextResponse } from 'next/server';
import { adminQueryAuditLogs } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isAdminReadOnly && !actor.isFinanceAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator privileges required to inspect financial audit logs.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await adminQueryAuditLogs({ targetUserId, limit });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/audit-logs error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve audit logs.' }, { status: 500 });
  }
}
