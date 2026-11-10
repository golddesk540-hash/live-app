import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_viewer_9001';

    const rows = await query<any>(
      `SELECT user_id, coins, diamond_points, total_spent_coins, total_received_points 
       FROM popolive.user_wallets 
       WHERE user_id = $1`,
      [userId]
    );

    if (rows && rows.length > 0) {
      const w = rows[0];
      return NextResponse.json({
        success: true,
        wallet: {
          userId: w.user_id,
          coins: parseInt(w.coins || '3600', 10),
          diamondPoints: parseInt(w.diamond_points || '0', 10),
          totalSpentCoins: parseInt(w.total_spent_coins || '0', 10),
          totalReceivedPoints: parseInt(w.total_received_points || '0', 10),
        },
      });
    }

    // Upsert default demo wallet if not found
    await query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points)
       VALUES ($1, 3600, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      wallet: {
        userId,
        coins: 3600,
        diamondPoints: 0,
        totalSpentCoins: 0,
        totalReceivedPoints: 0,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/gifts/wallet error:', err);
    return NextResponse.json({
      success: true,
      wallet: {
        userId: 'user_viewer_9001',
        coins: 3600,
        diamondPoints: 0,
        totalSpentCoins: 0,
        totalReceivedPoints: 0,
      },
    });
  }
}
