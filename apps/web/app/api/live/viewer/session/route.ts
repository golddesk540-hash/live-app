import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateViewerRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const roomId = req.nextUrl.searchParams.get('roomId');
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || req.nextUrl.searchParams.get('demo') === 'true' || !roomId || roomId === 'demo' || roomId === '880219';

    if (isDemo) {
      // 1:1 match to 04_04_viewer_room.png
      return NextResponse.json({
        success: true,
        isDemo: true,
        room: {
          id: 'demo-room-404',
          roomNumber: '880219',
          title: 'Come and chat with me 💕',
          category: 'Live Chat',
          status: 'live',
          isLive: true,
          viewerCount: 7600,
          viewerDisplay: '7.6K',
          coinsEarned: 500,
          country: 'Global',
          countryCode: 'WW',
          flagEmoji: '🌐',
          startedAt: new Date(Date.now() - 754000).toISOString(),
          isFollowing: false,
        },
        host: {
          id: 'demo-host-zara',
          nickname: 'Zara Live',
          poppoId: '8802194',
          avatarUrl: '/assets/studio/host_zara_avatar.png',
          hostLevel: 12,
          wealthLevel: 12,
        },
        activeGift: {
          senderName: 'Ali Khan',
          senderAvatar: '/assets/studio/host_zara_avatar.png',
          giftName: 'Rose',
          giftCount: 10,
          icon: '🌹',
        },
        chatPreview: [
          { id: 1, user: 'Sana', avatar: '/assets/studio/host_zara_avatar.png', text: 'So beautiful', emoji: '❤️' },
          { id: 2, user: 'Rizwan', avatar: '/assets/studio/host_zara_avatar.png', text: 'Nice live', emoji: '😊' },
          { id: 3, user: 'Mehak', avatar: '/assets/studio/host_zara_avatar.png', text: 'Love your vibe', emoji: '❤️' },
          { id: 4, user: 'Khan G', avatar: '/assets/studio/host_zara_avatar.png', text: 'Great show', emoji: '👏' },
        ],
        agora: generateViewerRtcToken('channel_880219', Math.floor(100000 + Math.random() * 899999)),
      });
    }

    const user = await getAuthenticatedUser(req).catch(() => null);

    // Look up room in DB
    const roomRows = await query(
      `SELECT r.id, r.room_number, r.title, r.cover_url, r.category, r.status, r.is_live,
              r.viewer_count, r.started_at, r.country, r.country_code, r.flag_emoji,
              r.agora_channel_name, r.agora_uid,
              u.id as host_id, u.nickname as host_nickname, u.poppo_id as host_poppo_id,
              u.avatar_url as host_avatar_url, COALESCE(u.wealth_level, 1) as host_wealth_level
       FROM popolive.live_rooms r
       JOIN popolive.users u ON r.host_id = u.id
       WHERE r.id = $1 OR r.room_number = $1
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live room not found or has ended.' },
        { status: 404 }
      );
    }

    const r = roomRows[0];
    const isLive = Boolean(r.is_live && r.status === 'live');

    // Check if current user is following the host
    let isFollowing = false;
    if (user && r.host_id) {
      const followRows = await query(
        `SELECT id FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
        [user.id, r.host_id]
      );
      isFollowing = followRows.length > 0;
    }

    const viewerUid = user ? (Number((user as any).poppo_id || (user as any).poppoId) || Math.floor(100000 + Math.random() * 899999)) : Math.floor(100000 + Math.random() * 899999);
    const channelName = r.agora_channel_name || `popo_room_${r.room_number}`;
    const agoraTokenData = generateViewerRtcToken(channelName, viewerUid);

    const viewerCount = Number(r.viewer_count) || 1;
    let viewerDisplay = String(viewerCount);
    if (viewerCount >= 1000) {
      viewerDisplay = `${(viewerCount / 1000).toFixed(1)}K`;
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      room: {
        id: r.id,
        roomNumber: r.room_number,
        title: r.title || 'Come and chat with me 💕',
        category: r.category || 'Live Chat',
        coverUrl: r.cover_url || '/assets/pre-live/sample_cover_model.png',
        status: r.status,
        isLive,
        viewerCount,
        viewerDisplay,
        coinsEarned: 500,
        country: r.country || 'Global',
        countryCode: r.country_code || 'WW',
        flagEmoji: r.flag_emoji || '🌐',
        startedAt: r.started_at ? new Date(r.started_at).toISOString() : null,
        isFollowing,
      },
      host: {
        id: r.host_id,
        nickname: r.host_nickname,
        poppoId: r.host_poppo_id,
        avatarUrl: r.host_avatar_url || '/assets/studio/host_zara_avatar.png',
        hostLevel: Number(r.host_wealth_level) || 12,
        wealthLevel: Number(r.host_wealth_level) || 12,
      },
      activeGift: {
        senderName: 'Ali Khan',
        senderAvatar: '/assets/studio/host_zara_avatar.png',
        giftName: 'Rose',
        giftCount: 10,
        icon: '🌹',
      },
      chatPreview: [
        { id: 1, user: 'Sana', avatar: '/assets/studio/host_zara_avatar.png', text: 'So beautiful', emoji: '❤️' },
        { id: 2, user: 'Rizwan', avatar: '/assets/studio/host_zara_avatar.png', text: 'Nice live', emoji: '😊' },
        { id: 3, user: 'Mehak', avatar: '/assets/studio/host_zara_avatar.png', text: 'Love your vibe', emoji: '❤️' },
        { id: 4, user: 'Khan G', avatar: '/assets/studio/host_zara_avatar.png', text: 'Great show', emoji: '👏' },
      ],
      agora: agoraTokenData,
    });
  } catch (err: any) {
    console.error('Error in GET /api/live/viewer/session:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
