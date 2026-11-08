import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveUserByIdentifier } from '@/lib/userLookup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const viewer = await getAuthenticatedUser(req);
    if (!viewer) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to follow users.' }, { status: 401 });
    }

    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    // Security check: cannot follow self
    if (viewer.id === targetUser.id) {
      return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
    }

    // Security check: cannot follow if blocked
    const blockCheck = await query(
      `SELECT id FROM popolive.user_blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`,
      [viewer.id, targetUser.id]
    );
    if (blockCheck.length > 0) {
      return NextResponse.json({ error: 'Unable to follow this user due to block restrictions.' }, { status: 403 });
    }

    // Insert follow relationship
    await query(
      `INSERT INTO popolive.user_follows (follower_id, following_id) 
       VALUES ($1, $2) 
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [viewer.id, targetUser.id]
    );

    // Get fresh followers count
    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE following_id = $1`,
      [targetUser.id]
    );
    const followersCount = countRes[0]?.count || 0;

    return NextResponse.json({
      success: true,
      isFollowing: true,
      message: `You are now following ${targetUser.nickname}`,
      followersCount,
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/[userId]/follow:', err);
    return NextResponse.json({ error: 'Failed to follow user.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const viewer = await getAuthenticatedUser(req);
    if (!viewer) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    // Remove follow relationship
    await query(
      `DELETE FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2`,
      [viewer.id, targetUser.id]
    );

    // Get fresh followers count
    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_follows WHERE following_id = $1`,
      [targetUser.id]
    );
    const followersCount = countRes[0]?.count || 0;

    return NextResponse.json({
      success: true,
      isFollowing: false,
      message: `Unfollowed ${targetUser.nickname} successfully.`,
      followersCount,
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/users/[userId]/follow:', err);
    return NextResponse.json({ error: 'Failed to unfollow user.' }, { status: 500 });
  }
}
