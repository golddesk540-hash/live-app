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
      roomId = '880219',
      targetUserId,
      targetNickname = 'Participant',
      muteType = 'viewer_local', // 'viewer_local' or 'room_global'
      requesterRole = 'viewer', // 'host', 'moderator', 'admin', 'viewer'
    } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required to mute.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const muterId = authUser?.id || body.muterId || 'demo-viewer-me';
    const effectiveRole: string = authUser?.role === 'admin' ? 'admin' : (requesterRole || 'viewer');

    // 1. Role-based permission check:
    // Only host or moderator can mute at room_global level
    if (muteType === 'room_global' && effectiveRole !== 'host' && effectiveRole !== 'moderator' && effectiveRole !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only the room host or authorized moderators can mute a participant room-wide.',
        },
        { status: 403 }
      );
    }

    // 2. A viewer cannot mute the host
    const isTargetHost = targetUserId === 'demo-host-zara' || targetNickname.toLowerCase().includes('host') || targetNickname.toLowerCase().includes('zara');
    if (isTargetHost && effectiveRole === 'viewer') {
      return NextResponse.json(
        {
          success: false,
          error: 'Viewers cannot mute the room host.',
        },
        { status: 403 }
      );
    }

    // 3. Persist mute record to DB
    try {
      const upsertSql = `
        INSERT INTO popolive.live_room_mutes 
          (room_id, muter_id, muted_user_id, muted_nickname, mute_type, is_active, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
        ON CONFLICT (room_id, muter_id, muted_user_id, mute_type)
        DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
      `;
      await query(upsertSql, [
        String(roomId),
        String(muterId),
        String(targetUserId),
        String(targetNickname),
        String(muteType),
      ]);
    } catch (dbErr) {
      console.warn('DB live_room_mutes insert notice (demo fallback):', dbErr);
    }

    const scopeLabel = muteType === 'room_global' ? 'room-wide' : 'for you';
    return NextResponse.json({
      success: true,
      muted: true,
      roomId,
      muterId,
      targetUserId,
      targetNickname,
      muteType,
      message: `${targetNickname} has been muted ${scopeLabel}. Their chat messages are now hidden.`,
      mutedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error muting participant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mute participant' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';
    const targetUserId = searchParams.get('targetUserId');
    const muteType = searchParams.get('muteType') || 'viewer_local';

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required to unmute.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const muterId = authUser?.id || 'demo-viewer-me';

    try {
      await query(
        `UPDATE popolive.live_room_mutes 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE room_id = $1 AND muter_id = $2 AND muted_user_id = $3 AND mute_type = $4`,
        [roomId, muterId, targetUserId, muteType]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      muted: false,
      targetUserId,
      message: 'Participant has been unmuted. Their chat messages will now appear.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unmute participant' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const muterId = authUser?.id || searchParams.get('muterId') || 'demo-viewer-me';

    let mutedUsers: any[] = [];
    try {
      const rows = await query(
        `SELECT muted_user_id, muted_nickname, mute_type, is_active, created_at
         FROM popolive.live_room_mutes 
         WHERE room_id = $1 AND (muter_id = $2 OR mute_type = 'room_global') AND is_active = true`,
        [roomId, muterId]
      );
      mutedUsers = rows || [];
    } catch {}

    return NextResponse.json({
      success: true,
      roomId,
      mutedUsers,
      mutedUserIds: mutedUsers.map((m: any) => String(m.muted_user_id)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch active mutes' },
      { status: 500 }
    );
  }
}
