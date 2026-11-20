import { NextRequest, NextResponse } from 'next/server';
import { getGiftsCatalog } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/gifts
 * Returns active gift catalog with prices.
 */
export async function GET(req: NextRequest) {
  try {
    const gifts = await getGiftsCatalog();

    return NextResponse.json({
      success: true,
      gifts,
      total: gifts.length,
    });
  } catch (err: any) {
    console.error('GET /api/economy/gifts error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve gift catalog.' },
      { status: 500 }
    );
  }
}
