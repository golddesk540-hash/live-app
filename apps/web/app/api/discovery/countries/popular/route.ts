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

    // 1. Start with the authoritative POPULAR_COUNTRY_SHORTCUTS
    const seenCodes = new Set<string>();
    const popular = POPULAR_COUNTRY_SHORTCUTS.map((item) => {
      seenCodes.add(item.code.toUpperCase());
      const isAll = item.code === 'ALL';
      const activeRooms = isAll ? totalRooms : (countMap.get(item.code.toUpperCase()) || 0);
      return {
        code: item.code,
        name: item.name,
        flag: item.flag,
        activeRooms,
      };
    });

    // 2. Also append any other country from COUNTRIES_LIST that currently has active live rooms
    for (const r of rows) {
      const code = (r.country_code || '').toUpperCase();
      if (code && !seenCodes.has(code) && (r.live_rooms_count || 0) > 0) {
        const countryMeta = COUNTRIES_LIST.find((c) => c.code.toUpperCase() === code);
        if (countryMeta) {
          seenCodes.add(code);
          popular.push({
            code: countryMeta.code,
            name: countryMeta.name,
            flag: countryMeta.flag,
            activeRooms: r.live_rooms_count || 0,
          });
        }
      }
    }

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
