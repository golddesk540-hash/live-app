import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { queryGiftAuditLogs } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const logs = await queryGiftAuditLogs(limit);

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err: any) {
    console.error('GET /api/admin/gifts/audit-logs error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve gift catalog audit logs.' },
      { status: 500 }
    );
  }
}
