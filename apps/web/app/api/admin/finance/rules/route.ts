import { NextRequest, NextResponse } from 'next/server';
import { getFinanceRules } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const rules = await getFinanceRules();

    return NextResponse.json({
      success: true,
      rules,
      canEdit: actor.isFinanceAdmin,
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/rules error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve finance rules.' }, { status: 500 });
  }
}
