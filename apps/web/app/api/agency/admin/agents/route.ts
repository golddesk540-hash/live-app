import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getAgencyAdminAgents } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Agency Admin permissions required.' }, { status: 403 });
    }

    const agents = await getAgencyAdminAgents(user.id);

    return NextResponse.json({
      success: true,
      agents,
    });
  } catch (error: any) {
    console.error('Error fetching agency admin agents:', error);
    const status = error.message?.includes('admin') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_AGENTS' },
      { status }
    );
  }
}
