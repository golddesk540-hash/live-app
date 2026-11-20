import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'finance:read');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const transactions = adminDeskService.listTransactions(auth.actor);

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
