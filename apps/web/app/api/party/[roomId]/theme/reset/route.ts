import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPartyThemeById, CANONICAL_PARTY_THEMES } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId || 'host_maria').trim();
    const isHostAction = Boolean(body.isHostAction);

    if (!isHostAction && userId !== 'host_maria' && userId !== 'user_maria_host') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only the party host can reset the room theme.',
        },
        { status: 403 }
      );
    }

    const defaultTheme = getPartyThemeById('default');

    try {
      await query(
        `INSERT INTO popolive.party_room_themes (room_id, theme_id, updated_by, updated_at)
         VALUES ($1, 'default', $2, NOW())
         ON CONFLICT (room_id) DO UPDATE SET
           theme_id = 'default',
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
        [roomId, userId]
      );

      await query(
        `UPDATE popolive.party_rooms
         SET active_theme_id = 'default'
         WHERE room_number = $1 OR id = $1`,
        [roomId]
      );
    } catch (dbErr) {
      console.warn('DB reset theme warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Default theme restored successfully.',
      roomId,
      activeThemeId: 'default',
      theme: defaultTheme,
    });
  } catch (error: any) {
    console.error('Failed to reset party theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset party theme' },
      { status: 500 }
    );
  }
}
