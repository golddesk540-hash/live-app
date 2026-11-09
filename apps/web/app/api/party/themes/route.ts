import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CANONICAL_PARTY_THEMES, PartyTheme } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let dbThemes: any[] = [];
    try {
      dbThemes = await query(
        `SELECT id, name, description, thumbnail_url, background_gradient, card_bg,
                button_gradient, accent_color, text_color, subtext_color, display_order, is_active
         FROM popolive.party_themes
         WHERE is_active = true
         ORDER BY display_order ASC`
      );
    } catch (dbErr) {
      console.warn('DB query party_themes error, using canonical fallback:', dbErr);
    }

    let themes: PartyTheme[] = CANONICAL_PARTY_THEMES;

    if (dbThemes && dbThemes.length > 0) {
      themes = dbThemes.map((t) => ({
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
        displayOrder: Number(t.display_order) || 1,
        isActive: Boolean(t.is_active),
      }));
    }

    return NextResponse.json({
      success: true,
      count: themes.length,
      themes,
    });
  } catch (error: any) {
    console.error('Failed to fetch party themes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch party themes' },
      { status: 500 }
    );
  }
}
