import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/gifts
 * Read-only endpoint retrieving available virtual gifts from gift_catalog.
 */
export async function GET(req: NextRequest) {
  try {
    const gifts = await query<any>(`
      SELECT id, gift_id, name, name_ur, description, coin_price, category_id,
             thumbnail_url, image_url, animation_url, is_popular, is_featured, display_order
      FROM popolive.gift_catalog
      WHERE is_active = true
      ORDER BY display_order ASC, coin_price ASC
    `);

    return NextResponse.json({
      success: true,
      total: gifts.length,
      gifts: gifts.map((g) => ({
        id: g.gift_id || g.id,
        uuid: g.id,
        name: g.name,
        nameUr: g.name_ur,
        coins: Number(g.coin_price) || 10,
        category: g.category_id || 'Popular',
        icon: g.thumbnail_url || g.image_url || '🎁',
        imageUrl: g.image_url || g.thumbnail_url,
        animationUrl: g.animation_url,
        isPopular: Boolean(g.is_popular),
        isFeatured: Boolean(g.is_featured),
      })),
    });
  } catch (err: any) {
    console.error('GET /api/live/gifts error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve gift catalog.' }, { status: 500 });
  }
}
