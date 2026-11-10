import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CANONICAL_PK_REAL_GIFTS, PKRealGiftItem } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const rows = await query<any>(
      `SELECT id, name, name_ur, coin_price, currency_icon, image_url, animation_name, category, display_order, is_active
       FROM popolive.pk_gift_catalog
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    let gifts: PKRealGiftItem[] = [];
    if (rows && rows.length > 0) {
      gifts = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        nameUr: r.name_ur,
        coinPrice: r.coin_price,
        currencyIcon: r.currency_icon,
        imageUrl: r.image_url,
        animationName: r.animation_name,
        category: r.category,
        displayOrder: r.display_order,
        isActive: r.is_active,
      }));
    } else {
      gifts = CANONICAL_PK_REAL_GIFTS;
    }

    return NextResponse.json({
      success: true,
      battleId: params.battleId,
      gifts,
      count: gifts.length,
      hostSharePercentage: 70, // 70% rule
      pkScoreConversionRate: 1, // 1 Coin = 1 PK Point
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/gifts/catalog error:', err);
    return NextResponse.json({
      success: true,
      battleId: params.battleId,
      gifts: CANONICAL_PK_REAL_GIFTS,
      count: CANONICAL_PK_REAL_GIFTS.length,
      hostSharePercentage: 70,
      pkScoreConversionRate: 1,
    });
  }
}
