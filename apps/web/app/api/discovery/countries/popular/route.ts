import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { POPULAR_COUNTRY_SHORTCUTS, COUNTRIES_LIST } from '@/lib/countries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const statsSql = `
      SELECT 
        country_code,
        COUNT(*)::int AS live_rooms_count,
        SUM(viewer_count)::bigint AS total_viewers
      FROM popolive.live_rooms
      WHERE is_live = true AND status = 'live'
      GROUP BY country_code
    `;
    const rows = await query<any>(statsSql).catch(() => []);

    const countMap = new Map<string, number>();
    let totalRooms = 0;
    for (const r of rows) {
      if (r.country_code) {
        countMap.set(r.country_code.toUpperCase(), r.live_rooms_count || 0);
        totalRooms += r.live_rooms_count || 0;
      }
    }

    const popular = POPULAR_COUNTRY_SHORTCUTS.map((item) => {
      const isAll = item.code === 'ALL';
      const activeRooms = isAll ? totalRooms : (countMap.get(item.code.toUpperCase()) || 0);
      return {
        code: item.code,
        name: item.name,
        flag: item.flag,
        activeRooms,
      };
    });

    return NextResponse.json({
      success: true,
      popular,
      totalWorldwideRooms: totalRooms,
    });
  } catch (error: any) {
    console.error('Error fetching popular countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load popular countries', details: error.message },
      { status: 500 }
    );
  }
}
