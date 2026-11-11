import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isAdminReadOnly && !actor.isFinanceAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator access required to query financial transactions.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ledger = searchParams.get('ledger') === 'points' ? 'points' : 'coins';
    const transactionId = searchParams.get('transactionId') || '';
    const userId = searchParams.get('userId') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const params: any[] = [];

    if (transactionId) {
      params.push(`%${transactionId}%`);
      conditions.push(`transaction_id ILIKE $${params.length}`);
    }

    if (userId) {
      params.push(`%${userId}%`);
      conditions.push(
        ledger === 'coins'
          ? `user_id ILIKE $${params.length}`
          : `host_user_id ILIKE $${params.length}`
      );
    }

    if (status && ['pending', 'completed', 'failed', 'reversed'].includes(status)) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const table = ledger === 'coins' ? 'popolive.coin_transactions' : 'popolive.points_transactions';
    const whereClause = conditions.join(' AND ');

    const countRows = await query(`SELECT COUNT(*)::int AS total FROM ${table} WHERE ${whereClause}`, params);
    const total = countRows[0]?.total ?? 0;

    const rows = await query(
      `SELECT * FROM ${table} WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const transactions = rows.map((r: any) =>
      ledger === 'coins'
        ? {
            id: r.id,
            transactionId: r.transaction_id,
            walletId: r.wallet_id,
            userId: r.user_id,
            transactionType: r.transaction_type,
            direction: r.direction,
            coinAmount: parseInt(String(r.coin_amount ?? '0'), 10),
            previousBalance: parseInt(String(r.previous_balance ?? '0'), 10),
            newBalance: parseInt(String(r.new_balance ?? '0'), 10),
            status: r.status,
            referenceId: r.reference_id,
            relatedTxId: r.related_tx_id,
            description: r.description,
            createdBy: r.created_by,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
          }
        : {
            id: r.id,
            transactionId: r.transaction_id,
            walletId: r.wallet_id,
            hostUserId: r.host_user_id,
            transactionType: r.transaction_type,
            direction: r.direction,
            pointsAmount: parseInt(String(r.points_amount ?? '0'), 10),
            sourceGiftCoins: parseInt(String(r.source_gift_coins ?? '0'), 10),
            sharePercentageApplied: parseFloat(String(r.share_percentage_applied ?? '70')),
            giftSource: r.gift_source,
            senderId: r.sender_id,
            senderName: r.sender_name,
            previousBalance: parseInt(String(r.previous_balance ?? '0'), 10),
            newBalance: parseInt(String(r.new_balance ?? '0'), 10),
            status: r.status,
            referenceId: r.reference_id,
            relatedTxId: r.related_tx_id,
            description: r.description,
            createdBy: r.created_by,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
          }
    );

    return NextResponse.json({
      success: true,
      ledger,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/transactions error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve transactions.' }, { status: 500 });
  }
}
