import { NextRequest, NextResponse } from 'next/server';
import { getHostRankings } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rankings/hosts
 * PART 4 & Tests 13, 14, 16:
 * Derived host rankings dynamically computed from points earned.
 * Supports:
 * - range: 'day' | 'week' | 'month' (or period: 'daily' | 'weekly' | 'monthly')
 * - page: 1, 2, ...
 * - limit: 1-50
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get('range') || searchParams.get('period') || 'day';
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20;

    const result = await getHostRankings({
      range: rangeParam,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
      period: rangeParam,
      hosts: result.rankings,
    });
  } catch (error: any) {
    console.error('Error fetching host rankings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_RANKINGS' },
      { status: 500 }
    );
  }
}
