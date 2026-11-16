import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getAgentEarningsDashboard } from '@/lib/agentFinancials';

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

    const earnings = await getAgentEarningsDashboard(user.id);

    return NextResponse.json({
      success: true,
      earnings,
    });
  } catch (error: any) {
    console.error('Error fetching agent earnings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_EARNINGS' },
      { status: 500 }
    );
  }
}
