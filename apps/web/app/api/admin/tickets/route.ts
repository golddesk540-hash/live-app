import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'tickets:read');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const tickets = adminDeskService.listTickets(auth.actor);

    return NextResponse.json({
      success: true,
      tickets,
      total: tickets.length,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
