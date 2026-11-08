import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const { timezone, displayTheme, streamQuality, language } = body;

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (timezone !== undefined) {
      updates.push(`timezone = $${idx++}`);
      params.push(String(timezone).substring(0, 64));
    }

    if (displayTheme !== undefined) {
      const allowedThemes = ['dark', 'dim', 'system'];
      if (!allowedThemes.includes(displayTheme)) {
        return NextResponse.json({ error: 'Invalid theme.' }, { status: 400 });
      }
      updates.push(`display_theme = $${idx++}`);
      params.push(displayTheme);
    }

    if (streamQuality !== undefined) {
      const allowedQualities = ['auto', '1080p', '720p', '480p'];
      if (!allowedQualities.includes(streamQuality)) {
        return NextResponse.json({ error: 'Invalid stream quality.' }, { status: 400 });
      }
      updates.push(`stream_quality = $${idx++}`);
      params.push(streamQuality);
    }

    if (language !== undefined) {
      if (!['en', 'ur'].includes(language)) {
        return NextResponse.json({ error: 'Supported languages are "en" and "ur".' }, { status: 400 });
      }
      updates.push(`preferred_language = $${idx++}`);
      params.push(language);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No preferences provided to update.' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(user.id);

    await query(`UPDATE popolive.users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    return NextResponse.json({
      success: true,
      message: 'Account preferences updated successfully.',
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/account/preferences:', err);
    return NextResponse.json({ error: 'Failed to update preferences.' }, { status: 500 });
  }
}
