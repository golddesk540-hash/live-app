import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getCoinSalesHistory } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id, 'coin_seller');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'User is not an authorized coin seller.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { sales, totalCount } = await getCoinSalesHistory(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      sales,
      totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching coin sales history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_SALES' },
      { status: 500 }
    );
  }
}
