import { NextResponse } from 'next/server';
import { getGiftCategories } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getGiftCategories({ includeInactive: false });
    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (err: any) {
    console.error('GET /api/gifts/categories error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load gift categories.' },
      { status: 500 }
    );
  }
}
