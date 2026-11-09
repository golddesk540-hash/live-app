import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateHostRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || req.nextUrl.searchParams.get('demo') === 'true';

    if (isDemo) {
      // Return realistic reference data matching 04_03_host_studio.png 1:1
      return NextResponse.json({
        success: true,
        isDemo: true,
        host: {
          id: 'demo-host-zara',
          nickname: 'Zara Live',
          poppoId: '8802194',
          avatarUrl: '/assets/studio/host_zara_avatar.png',
          wealthLevel: 12,
        },
        room: {
          id: 'demo-room-403',
          roomNumber: '880219',
          title: 'Come and chat with me 💕',
          category: 'Live Chat',
          coverUrl: '/assets/pre-live/sample_cover_model.png',
          status: 'live',
          isLive: true,
          viewerCount: 1800,
          viewerDisplay: '1.8K',
          startedAt: new Date(Date.now() - 754000).toISOString(), // 12 mins 34 secs ago matching 00:12:34
          elapsedSeconds: 754,
        },
        agora: generateHostRtcToken('channel_880219', 880219),
        gates: {
          isEligible: true,
          missingGates: [],
        },
      });
    }

    const user = await getAuthenticatedUser(req).catch(() => null);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to enter Host Studio.' },
        { status: 401 }
      );
    }

    const roomId = req.nextUrl.searchParams.get('roomId');

    // Query user state
    const userRows = await query(
      `SELECT id, poppo_id, nickname, avatar_url, COALESCE(wealth_level, 1) as wealth_level,
              COALESCE(is_face_verified, false) as is_face_verified, live_cover_url
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
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

    const isEligible = missingGates.length === 0;

    // Find the room (either by roomId or active/setup room for this host)
    let roomRows;
    if (roomId) {
      roomRows = await query(
        `SELECT id, room_number, title, category, cover_url, status, is_live,
                viewer_count, started_at, created_at, agora_channel_name, agora_uid
         FROM popolive.live_rooms
         WHERE id = $1 AND host_id = $2
         LIMIT 1`,
        [roomId, user.id]
      );
    } else {
      roomRows = await query(
        `SELECT id, room_number, title, category, cover_url, status, is_live,
                viewer_count, started_at, created_at, agora_channel_name, agora_uid
         FROM popolive.live_rooms
         WHERE host_id = $1 AND (status = 'live' OR status = 'setup')
         ORDER BY updated_at DESC
         LIMIT 1`,
        [user.id]
      );
    }

    let room = roomRows.length > 0 ? roomRows[0] : null;

    if (!room) {
      // Auto-create room for eligible host if none exists yet
      const newRoomId = crypto.randomUUID();
      const newRoomNumber = String(crypto.randomInt(100000, 999999));
      await query(
        `INSERT INTO popolive.live_rooms (
          id, room_number, host_id, title, cover_url, category, status, is_live,
          viewer_count, country, country_code, stream_key, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'Come and chat with me 💕', $4, 'Live Chat', 'setup', false,
          0, 'Global', 'WW', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [newRoomId, newRoomNumber, user.id, u.live_cover_url || '/assets/pre-live/sample_cover_model.png', `sk_live_${crypto.randomBytes(8).toString('hex')}`]
      );

      room = {
        id: newRoomId,
        room_number: newRoomNumber,
        title: 'Come and chat with me 💕',
        category: 'Live Chat',
        cover_url: u.live_cover_url || '/assets/pre-live/sample_cover_model.png',
        status: 'setup',
        is_live: false,
        viewer_count: 0,
        started_at: null,
      };
    }

    const agoraUid = Number(u.poppo_id) || Math.floor(100000 + Math.random() * 899999);
    const channelName = `popo_room_${room.room_number}`;
    const agoraTokenData = generateHostRtcToken(channelName, agoraUid);

    // Compute duration if live
    let elapsedSeconds = 0;
    if (room.is_live && room.started_at) {
      elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(room.started_at).getTime()) / 1000));
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      host: {
        id: u.id,
        nickname: u.nickname,
        poppoId: u.poppo_id,
        avatarUrl: u.avatar_url || '/assets/studio/host_zara_avatar.png',
        wealthLevel,
      },
      room: {
        id: room.id,
        roomNumber: room.room_number,
        title: room.title || 'Come and chat with me 💕',
        category: room.category || 'Live Chat',
        coverUrl: room.cover_url || u.live_cover_url || '/assets/pre-live/sample_cover_model.png',
        status: room.status,
        isLive: Boolean(room.is_live),
        viewerCount: room.is_live ? (room.viewer_count || 1800) : 0,
        viewerDisplay: room.is_live ? '1.8K' : '0',
        startedAt: room.started_at ? new Date(room.started_at).toISOString() : null,
        elapsedSeconds,
      },
      agora: agoraTokenData,
      gates: {
        isEligible,
        missingGates,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/live/studio/session:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
