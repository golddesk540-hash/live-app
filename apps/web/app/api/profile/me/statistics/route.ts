import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 1. Query real followers count
    const followersRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE following_id = $1`,
      [user.id]
    );
    const followersCount = followersRes[0]?.count || 0;

    // 2. Query real following count
    const followingRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE follower_id = $1`,
      [user.id]
    );
    const followingCount = followingRes[0]?.count || 0;

    // 3. Query real gifts received
    const giftsRes = await query(
      `SELECT COALESCE(SUM(gift_coins), 0)::bigint AS total FROM popolive.user_gifts WHERE receiver_id = $1`,
      [user.id]
    );
    const totalGiftsReceived = Number(giftsRes[0]?.total || 0);

    // 4. Host & Wealth Level
    const hostLevel = user.host_level || 1;
    const wealthLevel = user.wealth_level || 1;

    // 5. Fan club feature metadata
    const isFanClubUnlocked = hostLevel >= 5;

    return NextResponse.json({
      authenticated: true,
      statistics: {
        followersCount,
        followingCount,
        likesCount: 0,
        totalGiftsReceived,
        hostLevel,
        wealthLevel,
        fanClub: {
          unlocked: isFanClubUnlocked,
          status: isFanClubUnlocked ? 'active' : 'coming_soon',
          membersCount: 0,
          description: isFanClubUnlocked
            ? 'Fan club is active'
            : 'Fan club membership unlocks automatically at Host Level 5',
        },
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/profile/me/statistics:', err);
    return NextResponse.json({ error: 'Failed to retrieve profile statistics.' }, { status: 500 });
  }
}
