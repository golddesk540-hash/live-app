import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const roles = adminDeskService.listRoles(auth.actor);

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const { targetAdminId, role } = body;

    if (!targetAdminId || !role) {
      return NextResponse.json(
        { success: false, error: 'targetAdminId and role are required' },
        { status: 400 }
      );
    }

    const updated = adminDeskService.assignRole(
      auth.actor,
      targetAdminId,
      role,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      admin: updated,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
