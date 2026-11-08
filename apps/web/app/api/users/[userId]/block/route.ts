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
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    if (viewer.id === targetUser.id) {
      return NextResponse.json({ error: 'You cannot block your own account.' }, { status: 400 });
    }

    // Insert block
    await query(
      `INSERT INTO popolive.user_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [viewer.id, targetUser.id]
    );

    // Sever mutual follow relationships automatically
    await query(
      `DELETE FROM popolive.user_follows 
       WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)`,
      [viewer.id, targetUser.id]
    );

    return NextResponse.json({
      success: true,
      blocked: true,
      message: `${targetUser.nickname} has been blocked. They can no longer interact with your streams or profile.`,
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/[userId]/block:', err);
    return NextResponse.json({ error: 'Failed to block user.' }, { status: 500 });
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

    await query(
      `DELETE FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [viewer.id, targetUser.id]
    );

    return NextResponse.json({
      success: true,
      blocked: false,
      message: `${targetUser.nickname} has been unblocked.`,
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/users/[userId]/block:', err);
    return NextResponse.json({ error: 'Failed to unblock user.' }, { status: 500 });
  }
}
