import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateHostRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const isDemo = body.isDemo === true || req.nextUrl.searchParams.get('preview') === 'demo';

    if (isDemo) {
      return NextResponse.json({
        success: true,
        message: 'Demo broadcast started',
        isDemo: true,
        room: {
          id: 'demo-room-403',
          roomNumber: '880219',
          title: body.title || 'Come and chat with me 💕',
          category: body.category || 'Live Chat',
          status: 'live',
          isLive: true,
          viewerCount: 1800,
          startedAt: new Date().toISOString(),
        },
        agora: generateHostRtcToken('channel_880219', 880219),
      });
    }

    const user = await getAuthenticatedUser(req).catch(() => null);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to start broadcast.' },
        { status: 401 }
      );
    }

    // Check user gate eligibility
    const userRows = await query(
      `SELECT id, poppo_id, nickname, COALESCE(wealth_level, 1) as wealth_level,
              COALESCE(is_face_verified, false) as is_face_verified, live_cover_url
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const u = userRows[0];
    const wealthLevel = Number(u.wealth_level) || 1;
    const isFaceVerified = Boolean(u.is_face_verified);
    const hasCoverImage = Boolean(u.live_cover_url && u.live_cover_url.trim().length > 0);
    const isWealthQualified = wealthLevel >= 5;

    const missingGates: string[] = [];
    if (!isFaceVerified) missingGates.push('face_check');
    if (!hasCoverImage) missingGates.push('cover_image');
    if (!isWealthQualified) missingGates.push('wealth_level');

    if (missingGates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Host cannot go live without completing all Go-Live gates.',
          missingGates,
        },
        { status: 403 }
      );
    }

    // Locate or create room
    const roomId = body.roomId;
    let roomRows;
    if (roomId) {
      roomRows = await query(
        `SELECT id, room_number, title, category, cover_url, status, is_live
         FROM popolive.live_rooms
         WHERE id = $1 AND host_id = $2
         LIMIT 1`,
        [roomId, user.id]
      );
    } else {
      roomRows = await query(
        `SELECT id, room_number, title, category, cover_url, status, is_live
         FROM popolive.live_rooms
         WHERE host_id = $1 AND status IN ('setup', 'live')
         ORDER BY updated_at DESC
         LIMIT 1`,
        [user.id]
      );
    }

    let targetRoom = roomRows.length > 0 ? roomRows[0] : null;
    const roomNumber = targetRoom ? targetRoom.room_number : String(crypto.randomInt(100000, 999999));
    const agoraUid = Number(u.poppo_id) || Math.floor(100000 + Math.random() * 899999);
    const channelName = `popo_room_${roomNumber}`;

    if (!targetRoom) {
      const newRoomId = crypto.randomUUID();
      await query(
        `INSERT INTO popolive.live_rooms (
          id, room_number, host_id, title, cover_url, category, status, is_live,
          viewer_count, country, country_code, stream_key, agora_channel_name, agora_uid,
          started_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'live', true,
          1800, 'Global', 'WW', $7, $8, $9,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          newRoomId,
          roomNumber,
          user.id,
          body.title || 'Come and chat with me 💕',
          body.coverUrl || u.live_cover_url || '/assets/pre-live/sample_cover_model.png',
          body.category || 'Live Chat',
          `sk_live_${crypto.randomBytes(8).toString('hex')}`,
          channelName,
          agoraUid,
        ]
      );
      targetRoom = { id: newRoomId, room_number: roomNumber };
    } else {
      await query(
        `UPDATE popolive.live_rooms
         SET status = 'live',
             is_live = true,
             started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
             viewer_count = GREATEST(COALESCE(viewer_count, 0), 1800),
             agora_channel_name = $1,
             agora_uid = $2,
             title = COALESCE($3, title),
             category = COALESCE($4, category),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [channelName, agoraUid, body.title || null, body.category || null, targetRoom.id]
      );
    }

    // Insert broadcast log
    await query(
      `INSERT INTO popolive.live_broadcast_logs (
        room_id, host_id, event_type, details
      ) VALUES ($1, $2, 'started', $3)`,
      [
        targetRoom.id,
        user.id,
        JSON.stringify({
          channelName,
          agoraUid,
          startedAt: new Date().toISOString(),
          title: body.title || targetRoom.title,
        }),
      ]
    );

    const agora = generateHostRtcToken(channelName, agoraUid);

    return NextResponse.json({
      success: true,
      message: 'Broadcast started successfully',
      room: {
        id: targetRoom.id,
        roomNumber,
        title: body.title || targetRoom.title || 'Come and chat with me 💕',
        category: body.category || targetRoom.category || 'Live Chat',
        status: 'live',
        isLive: true,
        viewerCount: 1800,
        startedAt: new Date().toISOString(),
      },
      agora,
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/studio/start:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
