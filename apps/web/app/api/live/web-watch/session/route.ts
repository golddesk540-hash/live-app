import { NextRequest, NextResponse } from 'next/server';
import { generateViewerRtcToken } from '@/lib/agora';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';
    const isDemo = searchParams.get('preview') === 'demo' || roomId === '880219' || roomId === 'demo';

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const viewerUid = Math.floor(100000 + Math.random() * 899999);
    const agoraChannel = `channel_${roomId}`;
    const agoraTokenData = generateViewerRtcToken(agoraChannel, viewerUid);

    // Default reference room & host data matching 04_07_web_watch_web_studio.png
    let roomData: any = {
      id: `room-${roomId}`,
      roomNumber: roomId,
      title: 'Come and chat with me 💕',
      category: 'Live Chat',
      coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
      status: 'live',
      isLive: true,
      viewerCount: 7600,
      viewerDisplay: '7.6K',
      coinsEarned: 500,
      startedAt: new Date(Date.now() - 900000).toISOString(),
    };

    let hostData: any = {
      id: 'demo-host-zara',
      nickname: 'Zara Live',
      poppoId: '8802194',
      avatarUrl: '/assets/studio/host_zara_avatar.png',
      hostLevel: 12,
      wealthLevel: 12,
      isFollowing: false,
    };

    // Try DB lookup for real room if not purely demo
    try {
      const roomSql = `
        SELECT lr.id, lr.room_number, lr.title, lr.cover_url, lr.viewer_count,
               lr.status, lr.is_live, lr.agora_channel_name, lc.name as category_name,
               u.id as host_user_id, u.nickname as host_nickname, u.avatar_url as host_avatar_url,
               u.poppo_id as host_poppo_id, u.wealth_level as host_wealth_level
        FROM popolive.live_rooms lr
        LEFT JOIN popolive.users u ON lr.host_id = u.id
        LEFT JOIN popolive.live_categories lc ON lr.category_id = lc.id
        WHERE lr.room_number = $1 OR lr.id::text = $1
        LIMIT 1
      `;
      const rows = await query(roomSql, [roomId]);
      if (rows && rows[0]) {
        const r = rows[0];
        roomData = {
          id: r.id,
          roomNumber: r.room_number || roomId,
          title: r.title || roomData.title,
          category: r.category_name || roomData.category,
          coverUrl: r.cover_url || roomData.coverUrl,
          status: r.status || 'live',
          isLive: Boolean(r.is_live),
          viewerCount: r.viewer_count || roomData.viewerCount,
          viewerDisplay: (r.viewer_count || 7600) >= 1000 ? `${((r.viewer_count || 7600) / 1000).toFixed(1)}K` : String(r.viewer_count || 7600),
          coinsEarned: 500,
          startedAt: new Date(Date.now() - 900000).toISOString(),
        };

        if (r.host_user_id) {
          hostData = {
            id: r.host_user_id,
            nickname: r.host_nickname || 'Zara Live',
            poppoId: r.host_poppo_id || '8802194',
            avatarUrl: r.host_avatar_url || '/assets/studio/host_zara_avatar.png',
            hostLevel: r.host_wealth_level || 12,
            wealthLevel: r.host_wealth_level || 12,
            isFollowing: false,
          };
        }
      }
    } catch (err) {
      console.warn('DB live room session lookup notice:', err);
    }

    return NextResponse.json({
      success: true,
      roomId,
      isDemo,
      room: roomData,
      host: hostData,
      viewer: {
        id: authUser?.id || `web-viewer-${viewerUid}`,
        nickname: authUser?.nickname || `Web_Viewer_${String(viewerUid).slice(-4)}`,
        role: authUser?.role || 'viewer',
        uid: viewerUid,
      },
      agora: agoraTokenData,
      agoraToken: agoraTokenData.token,
      channelName: agoraChannel,
      appId: agoraTokenData.appId,
    });
  } catch (error: any) {
    console.error('Error in web watch session API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load web watch session' },
      { status: 500 }
    );
  }
}
