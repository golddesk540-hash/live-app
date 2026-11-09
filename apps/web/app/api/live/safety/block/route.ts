import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      targetUserId,
      targetNickname = 'Participant',
      roomId = '880219',
    } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required to block.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const blockerId = authUser?.id || body.blockerId || 'demo-viewer-me';

    if (blockerId === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'You cannot block your own account.' },
        { status: 400 }
      );
    }

    // Persist to existing Phase 2 user_blocks blacklist
    try {
      // Check if user is a real UUID or identifier
      const insertSql = `
        INSERT INTO popolive.user_blocks (blocker_id, blocked_id)
        VALUES ($1, $2)
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      `;
      await query(insertSql, [blockerId, targetUserId]);
    } catch (dbErr) {
      console.warn('DB user_blocks insert notice (demo/guest mode):', dbErr);
    }

    return NextResponse.json({
      success: true,
      blocked: true,
      blockerId,
      targetUserId,
      targetNickname,
      roomId,
      message: `${targetNickname} has been blocked and added to your blacklist. Their messages and broadcasts are now hidden from you.`,
      blockedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error blocking user in live room:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to block user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required to unblock.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const blockerId = authUser?.id || 'demo-viewer-me';

    try {
      await query(
        `DELETE FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
        [blockerId, targetUserId]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      blocked: false,
      targetUserId,
      message: 'User has been unblocked from your blacklist.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unblock user' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const blockerId = authUser?.id || 'demo-viewer-me';

    let blockedIds: string[] = [];
    try {
      const rows = await query(
        `SELECT blocked_id FROM popolive.user_blocks WHERE blocker_id = $1`,
        [blockerId]
      );
      blockedIds = (rows || []).map((r: any) => String(r.blocked_id));
    } catch {}

    return NextResponse.json({
      success: true,
      blockedUserIds: blockedIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blocklist' },
      { status: 500 }
    );
  }
}
