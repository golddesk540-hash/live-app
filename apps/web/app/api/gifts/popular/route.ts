import { NextRequest, NextResponse } from 'next/server';
import { getPopularGifts } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const gifts = await getPopularGifts(limit);
    return NextResponse.json({
      success: true,
      gifts,
      count: gifts.length,
      rule: 'Ranked by verified database usage_count and active popularity status.',
    });
  } catch (err: any) {
    console.error('GET /api/gifts/popular error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load popular gifts.' },
      { status: 500 }
    );
  }
}
