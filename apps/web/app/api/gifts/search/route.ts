import { NextRequest, NextResponse } from 'next/server';
import { getGiftCatalog } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const categoryId = searchParams.get('category') || 'all';
    const giftType = searchParams.get('giftType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getGiftCatalog({
      search: q,
      categoryId,
      giftType,
      page,
      limit,
      includeInactive: false,
    });

    return NextResponse.json({
      success: true,
      query: q,
      gifts: result.gifts,
      pagination: result.pagination,
    });
  } catch (err: any) {
    console.error('GET /api/gifts/search error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search gifts.' },
      { status: 500 }
    );
  }
}
