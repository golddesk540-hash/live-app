import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, deletePayoutMethod } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Access denied.' }, { status: 403 });
    }

    const deleted = await deletePayoutMethod(user.id, params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Payout method not found or does not belong to user.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payout method removed successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting payout method:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_DELETE_PAYOUT_METHOD' },
      { status: 500 }
    );
  }
}
