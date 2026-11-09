import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPartyThemeById, CANONICAL_PARTY_THEMES, PartyTheme } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    let activeThemeId = 'default';
    let updatedBy = 'host_maria';
    let updatedAt = new Date().toISOString();

    try {
      const roomThemeRow = await query(
        `SELECT pt.id, pt.name, pt.description, pt.thumbnail_url, pt.background_gradient,
                pt.card_bg, pt.button_gradient, pt.accent_color, pt.text_color, pt.subtext_color,
                pt.display_order, pt.is_active, prt.updated_by, prt.updated_at
         FROM popolive.party_room_themes prt
         JOIN popolive.party_themes pt ON prt.theme_id = pt.id
         WHERE prt.room_id = $1`,
        [roomId]
      );

      if (roomThemeRow && roomThemeRow.length > 0) {
        const row = roomThemeRow[0];
        const theme: PartyTheme = {
          id: row.id,
          name: row.name,
          description: row.description,
          thumbnailUrl: row.thumbnail_url,
          backgroundGradient: row.background_gradient,
          cardBg: row.card_bg,
          buttonGradient: row.button_gradient,
          accentColor: row.accent_color,
          textColor: row.text_color || '#FFFFFF',
          subtextColor: row.subtext_color || '#A78BFA',
          displayOrder: Number(row.display_order) || 1,
          isActive: Boolean(row.is_active),
        };

        return NextResponse.json({
          success: true,
          roomId,
          activeThemeId: theme.id,
          theme,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : updatedAt,
        });
      }
    } catch (dbErr) {
      console.warn('DB query party_room_themes failed, using memory/canonical fallback:', dbErr);
    }

    const fallbackTheme = getPartyThemeById(activeThemeId);
    return NextResponse.json({
      success: true,
      roomId,
      activeThemeId,
      theme: fallbackTheme,
      updatedBy,
      updatedAt,
    });
  } catch (error: any) {
    console.error('Failed to get party room theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get party theme' },
      { status: 500 }
    );
  }
}
