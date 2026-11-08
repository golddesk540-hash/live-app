import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COUNTRIES_LIST, CountryItem } from '@/lib/countries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim().toLowerCase() || '';

    // Fetch live statistics by country code from database
    const statsSql = `
      SELECT 
        country_code,
        COUNT(*)::int AS live_rooms_count,
        SUM(viewer_count)::bigint AS total_viewers
      FROM popolive.live_rooms
      WHERE is_live = true AND status = 'live'
      GROUP BY country_code
    `;
    const userStatsSql = `
      SELECT 
        country_code,
        COUNT(*)::int AS creators_count
      FROM popolive.users
      WHERE status = 'active'
      GROUP BY country_code
    `;

    const [roomStats, userStats] = await Promise.all([
      query<any>(statsSql).catch(() => []),
      query<any>(userStatsSql).catch(() => []),
    ]);

    const roomMap = new Map<string, { rooms: number; viewers: number }>();
    for (const r of roomStats) {
      if (r.country_code) {
        roomMap.set(r.country_code.toUpperCase(), {
          rooms: r.live_rooms_count || 0,
          viewers: parseInt(r.total_viewers || '0', 10),
        });
      }
    }

    const userMap = new Map<string, number>();
    for (const u of userStats) {
      if (u.country_code) {
        userMap.set(u.country_code.toUpperCase(), u.creators_count || 0);
      }
    }

    // Filter and map countries list
    let filtered = COUNTRIES_LIST;
    if (search) {
      filtered = COUNTRIES_LIST.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search) ||
          c.phoneCode.includes(search)
      );
    }

    const countries = filtered.map((c) => {
      const rInfo = roomMap.get(c.code.toUpperCase()) || { rooms: 0, viewers: 0 };
      const creators = userMap.get(c.code.toUpperCase()) || 0;
      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        phoneCode: c.phoneCode,
        activeRooms: rInfo.rooms,
        totalViewers: rInfo.viewers,
        totalCreators: creators,
      };
    });

    // Total worldwide statistics
    const totalWorldwideRooms = roomStats.reduce((acc, curr) => acc + (curr.live_rooms_count || 0), 0);
    const totalWorldwideCreators = userStats.reduce((acc, curr) => acc + (curr.creators_count || 0), 0);

    return NextResponse.json({
      success: true,
      totalCountries: countries.length,
      worldwide: {
        activeRooms: totalWorldwideRooms,
        totalCreators: totalWorldwideCreators,
      },
      countries,
    });
  } catch (error: any) {
    console.error('Error fetching countries list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load countries', details: error.message },
      { status: 500 }
    );
  }
}
