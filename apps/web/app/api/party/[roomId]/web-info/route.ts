import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPartyThemeById, CANONICAL_PARTY_THEMES } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    // 1. Fetch Room Info
    let room = {
      roomNumber: roomId,
      title: 'Maria & Friends Mega Party 🎉',
      category: 'Chill & Chat',
      categoryId: 'chill_chat',
      roomType: 'public',
      isPrivate: false,
      hostNickname: 'Maria Live',
      hostAvatar: '/assets/party/seat_avatar_1.png',
      maxSeats: 9,
      currentMembers: 6,
      audienceCount: 256,
      status: 'active',
      webShareUrl: `https://kigolive.com/party/room/${roomId}`,
      canonicalWebSlug: `live.popolive.com/party`,
    };

    try {
      const roomRows = await query(
        `SELECT room_number, title, category_id, room_type, is_private, host_nickname, host_avatar_url, max_seats, active_theme_id
         FROM popolive.party_rooms
         WHERE room_number = $1 OR id = $1`,
        [roomId]
      );
      if (roomRows && roomRows.length > 0) {
        const r = roomRows[0];
        room.title = r.title || room.title;
        room.roomType = r.room_type || room.roomType;
        room.isPrivate = Boolean(r.is_private);
        room.hostNickname = r.host_nickname || room.hostNickname;
        room.hostAvatar = r.host_avatar_url || room.hostAvatar;
        room.maxSeats = Number(r.max_seats) || 9;
      }
    } catch (e) {
      console.warn('DB query room error in web-info:', e);
    }

    // 2. Fetch Active Theme
    let activeTheme = CANONICAL_PARTY_THEMES[0];
    try {
      const themeRows = await query(
        `SELECT pt.id, pt.name, pt.description, pt.thumbnail_url, pt.background_gradient,
                pt.card_bg, pt.button_gradient, pt.accent_color, pt.text_color, pt.subtext_color
         FROM popolive.party_room_themes prt
         JOIN popolive.party_themes pt ON prt.theme_id = pt.id
         WHERE prt.room_id = $1`,
        [roomId]
      );
      if (themeRows && themeRows.length > 0) {
        const t = themeRows[0];
        activeTheme = {
          id: t.id,
          name: t.name,
          description: t.description,
          thumbnailUrl: t.thumbnail_url,
          backgroundGradient: t.background_gradient,
          cardBg: t.card_bg,
          buttonGradient: t.button_gradient,
          accentColor: t.accent_color,
          textColor: t.text_color || '#FFFFFF',
          subtextColor: t.subtext_color || '#A78BFA',
          displayOrder: 1,
          isActive: true,
        };
      }
    } catch (e) {
      console.warn('DB query theme error in web-info:', e);
    }

    return NextResponse.json({
      success: true,
      room,
      activeTheme,
      agora: {
        channelName: `party_${roomId}`,
        isConfigured: true,
      },
    });
  } catch (error: any) {
    console.error('Failed to get party web info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve web party information' },
      { status: 500 }
    );
  }
}
