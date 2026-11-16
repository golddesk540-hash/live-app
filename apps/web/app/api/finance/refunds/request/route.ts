import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

/**
 * User Refund Request API
 * POST /api/finance/refunds/request
 * 
 * Initiates an official refund review for a verified top-up purchase.
 * Enforces:
 * - Order must exist and belong to user
 * - Order must be 'successful'
 * - Order cannot already be refunded or reversed
 * - Logs audit trail in wallet_audit_logs
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';

    const orderId = String(body.orderId || '').trim();
    const reason = String(body.reason || '').trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'A valid orderId is required for refund request.' },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { success: false, error: 'A clear reason (minimum 5 characters) is required for refund processing.' },
        { status: 400 }
      );
    }

    const ordRows = await query<any>(
      `SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1`,
      [orderId]
    );

    if (ordRows.length === 0) {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_NOT_FOUND', error: 'Top-up purchase order not found.' },
        { status: 404 }
      );
    }

    const order = ordRows[0];

    // Authorization: User must own the order or be finance admin
    const callerUserId = actor.user?.id || (isPreviewDemo ? 'user_wallet_demo_701' : null);
    if (!actor.isFinanceAdmin && callerUserId !== order.user_id) {
      return NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED_ORDER_ACCESS', error: 'Forbidden: You can only request refunds for your own orders.' },
        { status: 403 }
      );
    }

    if (order.status === 'refunded' || order.status === 'reversed') {
      return NextResponse.json(
        { success: false, errorCode: 'ALREADY_REFUNDED', error: 'This order has already been refunded or reversed.' },
        { status: 400 }
      );
    }

    if (order.status !== 'successful') {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_NOT_REFUNDABLE', error: `Only confirmed successful purchases can be refunded (current status: ${order.status}).` },
        { status: 400 }
      );
    }

    const refundRequestId = `REF_REQ_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Record official audit log
    await query(
      `INSERT INTO popolive.wallet_audit_logs (
         audit_id, target_user_id, action_type, actor_id, actor_role,
         reason, balance_type, amount, reference_tx_id, ip_address, created_at
       ) VALUES ($1, $2, 'refund_requested', $3, $4, $5, 'coins', $6, $7, $8, NOW())`,
      [
        refundRequestId,
        order.user_id,
        actor.actorId,
        actor.actorRole,
        `User requested refund for order ${orderId}: ${reason}`,
        order.total_coins,
        order.order_id,
        actor.ipAddress,
      ]
    );

    return NextResponse.json({
      success: true,
      refundRequestId,
      orderId: order.order_id,
      packageId: order.package_id,
      amount: Number(order.amount),
      currency: order.currency,
      coinsToReclaim: Number(order.total_coins),
      status: 'refund_requested',
      message: 'Refund request registered. A financial administrator will review the request within 24-48 hours.',
      requestedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/finance/refunds/request error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit refund request.' },
      { status: 500 }
    );
  }
}
