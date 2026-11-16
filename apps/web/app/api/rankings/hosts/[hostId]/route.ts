import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ hostId: string }> }) {
  try {
    const { hostId } = await params;
    const userRes = await query<any>(
      `SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, u.host_level, u.wealth_level, u.is_adult_verified, u.bio,
              COALESCE(SUM(pt.points_amount), 0) as gift_points,
              COALESCE(SUM(lr.coins_earned), 0) as stream_coins,
              (SELECT COUNT(*) FROM popolive.user_follows WHERE following_id = u.id) as followers_count
       FROM popolive.users u
       LEFT JOIN popolive.points_transactions pt ON pt.host_user_id = u.id::text
       LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id
       WHERE u.id::text = $1 OR u.poppo_id = $1
       GROUP BY u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, u.host_level, u.wealth_level, u.is_adult_verified, u.bio`,
      [hostId]
    );

    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: 'HOST_NOT_FOUND' }, { status: 404 });
    }

    const u = userRes[0];
    const countryCodeClean = u.country_code || 'PK';

    return NextResponse.json({
      success: true,
      host: {
        id: u.id,
        poppoId: u.poppo_id || u.id.substring(0, 8),
        nickname: u.nickname,
        avatarUrl: u.avatar_url || '/avatars/default.png',
        country: u.country || 'Pakistan',
        countryCode: countryCodeClean,
        flagEmoji: getCountryFlag(countryCodeClean),
        hostLevel: u.host_level || 1,
        wealthLevel: u.wealth_level || 1,
        isVerified: Boolean(u.is_adult_verified || u.host_level >= 3),
        bio: u.bio || '',
        giftPoints: parseInt(u.gift_points || '0', 10),
        streamCoins: parseInt(u.stream_coins || '0', 10),
        followersCount: parseInt(u.followers_count || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching host ranking details:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_HOST_DETAILS' }, { status: 500 });
  }
}
