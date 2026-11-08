import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

function formatScore(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category')?.toLowerCase() || 'host';
    const period = searchParams.get('period')?.toLowerCase() || 'monthly'; // daily, weekly, monthly

    // Available categories specification
    const categoriesMeta = [
      { id: 'host', name: 'Host Ranking', isSupported: true, isComingSoon: false },
      { id: 'wealth', name: 'Wealth Ranking', isSupported: true, isComingSoon: false },
      { id: 'popularity', name: 'Popularity Ranking', isSupported: true, isComingSoon: false },
      { id: 'gifts', name: 'Gift Ranking', isSupported: false, isComingSoon: true },
      { id: 'country', name: 'Country Ranking', isSupported: true, isComingSoon: false },
    ];

    if (category === 'gifts') {
      return NextResponse.json({
        success: true,
        category: 'gifts',
        period,
        isComingSoon: true,
        message: 'Gift Ranking data source is scheduled for Phase 4. Currently coming soon.',
        podium: [],
        rankings: [],
        categories: categoriesMeta,
      });
    }

    let rows: any[] = [];

    if (category === 'wealth') {
      // Wealth Ranking by wealth_level & user activity
      rows = await query<any>(`
        SELECT 
          u.id,
          u.poppo_id,
          u.nickname,
          u.avatar_url,
          u.country,
          u.country_code,
          u.host_level,
          u.wealth_level,
          u.is_adult_verified,
          COALESCE(u.wealth_level * 180000 + 45000, 24000) AS score_value
        FROM popolive.users u
        WHERE u.status = 'active'
        ORDER BY u.wealth_level DESC, u.created_at ASC
        LIMIT 10
      `);
    } else if (category === 'popularity') {
      // Popularity Ranking by live viewers & followers
      rows = await query<any>(`
        SELECT 
          u.id,
          u.poppo_id,
          u.nickname,
          u.avatar_url,
          u.country,
          u.country_code,
          u.host_level,
          u.wealth_level,
          u.is_adult_verified,
          COALESCE(
            (SELECT SUM(viewer_count) FROM popolive.live_rooms WHERE host_id = u.id),
            (SELECT COUNT(*) FROM popolive.user_follows WHERE following_id = u.id) * 15,
            u.host_level * 250
          ) AS score_value
        FROM popolive.users u
        WHERE u.status = 'active'
        ORDER BY score_value DESC, u.host_level DESC
        LIMIT 10
      `);
    } else if (category === 'country') {
      // Country Ranking by total active rooms & streamers
      rows = await query<any>(`
        SELECT 
          lr.country_code AS id,
          lr.country_code AS poppo_id,
          lr.country AS nickname,
          '/avatars/default.png' AS avatar_url,
          lr.country,
          lr.country_code,
          COUNT(lr.id) AS host_level,
          1 AS wealth_level,
          true AS is_adult_verified,
          SUM(lr.viewer_count) AS score_value
        FROM popolive.live_rooms lr
        GROUP BY lr.country_code, lr.country
        ORDER BY score_value DESC
        LIMIT 10
      `);
    } else {
      // Default: 'host' Ranking by stream coins earned & host level
      rows = await query<any>(`
        SELECT 
          u.id,
          u.poppo_id,
          u.nickname,
          u.avatar_url,
          u.country,
          u.country_code,
          u.host_level,
          u.wealth_level,
          u.is_adult_verified,
          COALESCE(
            (SELECT SUM(coins_earned) FROM popolive.live_rooms WHERE host_id = u.id),
            u.host_level * 150000 + 75000
          ) AS score_value
        FROM popolive.users u
        WHERE u.status = 'active'
        ORDER BY score_value DESC, u.host_level DESC
        LIMIT 10
      `);
    }

    const rankings = rows.map((r, index) => {
      const countryCodeClean = r.country_code || 'PK';
      const flagEmoji = getCountryFlag(countryCodeClean);
      const scoreNum = parseInt(r.score_value || '0', 10);

      return {
        rank: index + 1,
        id: r.id,
        poppoId: r.poppo_id,
        nickname: r.nickname || 'Streamer',
        avatarUrl: r.avatar_url || '/avatars/default.png',
        country: r.country || 'Pakistan',
        countryCode: countryCodeClean,
        flagEmoji,
        hostLevel: r.host_level || 1,
        wealthLevel: r.wealth_level || 1,
        isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
        score: scoreNum,
        scoreFormatted: formatScore(scoreNum),
        profileUrl: `/user/${r.id}`,
      };
    });

    // Prepare Podium structure (Rank 2 Silver on left, Rank 1 Gold in center, Rank 3 Bronze on right)
    let podium = {
      first: rankings[0] || null,
      second: rankings[1] || null,
      third: rankings[2] || null,
    };

    return NextResponse.json({
      success: true,
      category,
      period,
      isComingSoon: false,
      podium,
      rankings,
      categories: categoriesMeta,
    });
  } catch (error: any) {
    console.error('Error fetching rankings preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rankings preview', details: error.message },
      { status: 500 }
    );
  }
}
