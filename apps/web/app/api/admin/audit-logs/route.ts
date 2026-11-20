import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'audit:read');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const logs = adminDeskService.listAuditLogs(auth.actor, {
      action,
      actorId,
      targetId,
      targetType,
      limit,
    });

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
