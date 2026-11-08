import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveUserByIdentifier } from '@/lib/userLookup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const targetIdentifier = params.userId;
    const targetUser = await resolveUserByIdentifier(targetIdentifier);

    if (!targetUser || targetUser.status !== 'active') {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const viewer = await getAuthenticatedUser(req);
    const viewerId = viewer ? viewer.id : null;
    const isSelf = viewerId === targetUser.id;

    // Check if target user has blocked viewer, or viewer blocked target
    let isBlocked = false;
    let hasBlockedViewer = false;
    if (viewerId && !isSelf) {
      const blockRows = await query(
        `SELECT blocker_id FROM popolive.user_blocks 
         WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
        [viewerId, targetUser.id]
      );
      if (blockRows.length > 0) {
        isBlocked = blockRows.some((r: any) => r.blocker_id === viewerId);
        hasBlockedViewer = blockRows.some((r: any) => r.blocker_id === targetUser.id);
      }
    }

    // Check if viewer is following target user
    let isFollowing = false;
    if (viewerId && !isSelf) {
      const followRows = await query(
        `SELECT 1 FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
        [viewerId, targetUser.id]
      );
      isFollowing = followRows.length > 0;
    }

    // Followers & Following counts
    const followersRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE following_id = $1`,
      [targetUser.id]
    );
    const followingRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE follower_id = $1`,
      [targetUser.id]
    );

    const followersCount = followersRes[0]?.count || 0;
    const followingCount = followingRes[0]?.count || 0;

    // Likes / Gifts count
    const giftsRes = await query(
      `SELECT COALESCE(SUM(gift_coins), 0)::bigint AS total FROM popolive.user_gifts WHERE receiver_id = $1`,
      [targetUser.id]
    );
    const totalGifts = Number(giftsRes[0]?.total || 0);

    return NextResponse.json({
      success: true,
      profile: {
        id: targetUser.id,
        poppoId: targetUser.poppo_id,
        nickname: targetUser.nickname,
        avatarUrl: targetUser.avatar_url || '/avatars/default.png',
        country: targetUser.country || 'Pakistan',
        countryCode: targetUser.country_code || 'PK',
        gender: targetUser.gender || 'unspecified',
        bio: targetUser.bio || '',
        hostLevel: Number(targetUser.host_level) || 1,
        wealthLevel: Number(targetUser.wealth_level) || 1,
        isAdultVerified: Boolean(targetUser.is_adult_verified),
        memberSince: targetUser.created_at ? new Date(targetUser.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'November 2026',
        createdAt: targetUser.created_at,
        followersCount,
        followingCount,
        likesCount: totalGifts || 0,
        isFollowing,
        isBlocked,
        hasBlockedViewer,
        isSelf,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/[userId]/public-profile:', err);
    return NextResponse.json({ error: 'Failed to retrieve public profile.' }, { status: 500 });
  }
}
