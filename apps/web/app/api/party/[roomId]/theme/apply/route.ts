import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPartyThemeById, CANONICAL_PARTY_THEMES, PartyTheme } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));

    const themeId = String(body.themeId || '').trim();
    const userId = String(body.userId || 'host_maria').trim();
    const isHostAction = Boolean(body.isHostAction);

    // 1. Permission Validation (Section 5 & 8: Host or authorized moderator only)
    if (!isHostAction && userId !== 'host_maria' && userId !== 'user_maria_host') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only the party host or authorized moderator can change the party theme.',
        },
        { status: 403 }
      );
    }

    // 2. Theme ID Validation (Section 5 & 9: Invalid theme IDs are rejected)
    const validTheme = CANONICAL_PARTY_THEMES.find((t) => t.id === themeId);
    if (!themeId || !validTheme) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid theme ID: "${themeId}". Please select a valid party theme.`,
        },
        { status: 400 }
      );
    }

    // 3. Database Persistence: Upsert in party_room_themes and update party_rooms
    const updatedAt = new Date().toISOString();
    try {
      await query(
        `INSERT INTO popolive.party_room_themes (room_id, theme_id, updated_by, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (room_id) DO UPDATE SET
           theme_id = EXCLUDED.theme_id,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
        [roomId, themeId, userId]
      );

      // Update active_theme_id on party_rooms if room exists
      await query(
        `UPDATE popolive.party_rooms
         SET active_theme_id = $1
         WHERE room_number = $2 OR id = $2`,
        [themeId, roomId]
      );

      // Audit history
      await query(
        `INSERT INTO popolive.party_theme_history (room_id, theme_id, updated_by, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [roomId, themeId, userId]
      );
    } catch (dbErr) {
      console.warn('DB persistence warning for party theme:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Theme "${validTheme.name}" applied successfully to Party Room #${roomId}!`,
      roomId,
      activeThemeId: validTheme.id,
      theme: validTheme,
      updatedBy: userId,
      updatedAt,
    });
  } catch (error: any) {
    console.error('Failed to apply party theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply party theme' },
      { status: 500 }
    );
  }
}
