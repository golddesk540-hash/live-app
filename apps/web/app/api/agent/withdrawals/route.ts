import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getWithdrawalHistory } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { withdrawals, totalCount } = await getWithdrawalHistory(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      withdrawals,
      totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching withdrawal history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_WITHDRAWALS' },
      { status: 500 }
    );
  }
}
