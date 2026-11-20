import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/message/users/:id/block (and /message/users/:id/block)
 * Blocks a target user from sending messages to caller
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'block user');

    const targetId = params.userId;

    if (targetId.toString() === user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Cannot block yourself.', code: 'CANNOT_BLOCK_SELF' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO popolive.user_blocks (id, blocker_id, blocked_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [user.id, targetId]
    );

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully.',
      blockerId: user.id,
      blockedId: targetId,
      isBlocked: true,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}

/**
 * DELETE /api/message/users/:id/block (and /message/users/:id/block)
 * Unblocks a previously blocked user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'unblock user');

    const targetId = params.userId;

    await query(
      `DELETE FROM popolive.user_blocks WHERE blocker_id::text = $1 AND blocked_id::text = $2`,
      [user.id, targetId]
    );

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully.',
      blockerId: user.id,
      blockedId: targetId,
      isBlocked: false,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}
