import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveWalletActor } from '@/lib/walletAuth';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

/**
 * Report Financial Discrepancy API
 * POST /api/wallet/reconcile/report
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';

    const userId = body.userId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);
    const description = String(body.description || '').trim();
    const orderId = body.orderId ? String(body.orderId).trim() : null;

    if (!description || description.length < 5) {
      return NextResponse.json(
        { success: false, error: 'A clear description of the discrepancy (minimum 5 characters) is required.' },
        { status: 400 }
      );
    }

    const reportId = `DISC_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await query(
      `INSERT INTO popolive.wallet_audit_logs (
         audit_id, target_user_id, action_type, actor_id, actor_role,
         reason, balance_type, amount, reference_tx_id, ip_address, created_at
       ) VALUES ($1, $2, 'discrepancy_reported', $3, $4, $5, 'coins', 0, $6, $7, NOW())`,
      [
        reportId,
        userId,
        actor.actorId,
        actor.actorRole,
        description,
        orderId,
        actor.ipAddress,
      ]
    );

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Financial discrepancy reported to security and reconciliation team.',
      status: 'under_investigation',
      reportedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/wallet/reconcile/report error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit discrepancy report.' },
      { status: 500 }
    );
  }
}
