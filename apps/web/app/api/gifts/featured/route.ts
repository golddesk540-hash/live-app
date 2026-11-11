import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedGifts } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const gifts = await getFeaturedGifts(limit);
    return NextResponse.json({
      success: true,
      gifts,
      count: gifts.length,
    });
  } catch (err: any) {
    console.error('GET /api/gifts/featured error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load featured gifts.' },
      { status: 500 }
    );
  }
}
