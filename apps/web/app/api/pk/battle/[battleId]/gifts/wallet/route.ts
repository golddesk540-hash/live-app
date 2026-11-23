import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.id || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID or authenticated session is required.' },
        { status: 400 }
      );
    }

    let rows = await query<any>(
      `SELECT user_id, coins, diamond_points, total_spent_coins, total_received_points 
       FROM popolive.user_wallets 
       WHERE user_id = $1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      // Safe missing wallet initialization with 0 coins and 0 points per finance_rules
      await query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      ).catch(() => {});

      rows = await query<any>(
        `SELECT user_id, coins, diamond_points, total_spent_coins, total_received_points 
         FROM popolive.user_wallets 
         WHERE user_id = $1`,
        [userId]
      );
    }

    const w = rows && rows[0] ? rows[0] : { user_id: userId, coins: 0, diamond_points: 0, total_spent_coins: 0, total_received_points: 0 };

    return NextResponse.json({
      success: true,
      wallet: {
        userId: w.user_id,
        coins: parseInt(String(w.coins ?? 0), 10),
        diamondPoints: parseInt(String(w.diamond_points ?? 0), 10),
        totalSpentCoins: parseInt(String(w.total_spent_coins ?? 0), 10),
        totalReceivedPoints: parseInt(String(w.total_received_points ?? 0), 10),
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/gifts/wallet error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve wallet balance.' },
      { status: 500 }
    );
  }
}
