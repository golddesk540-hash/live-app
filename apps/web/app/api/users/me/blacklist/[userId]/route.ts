import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveUserByIdentifier } from '@/lib/userLookup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await query(
      `DELETE FROM popolive.user_blocks 
       WHERE blocker_id = $1 AND blocked_id = $2`,
      [user.id, targetUser.id]
    );

    return NextResponse.json({
      success: true,
      message: `${targetUser.nickname} has been removed from your blacklist.`,
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/users/me/blacklist/[userId]:', err);
    return NextResponse.json({ error: 'Failed to unblock user.' }, { status: 500 });
  }
}
