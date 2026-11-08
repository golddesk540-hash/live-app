import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const row = (
      await query('SELECT preferred_language FROM popolive.users WHERE id = $1', [user.id])
    )[0];

    return NextResponse.json({
      success: true,
      language: row?.preferred_language || 'en',
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings/language:', err);
    return NextResponse.json({ error: 'Failed to fetch language.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const lang = (body.language || '').toLowerCase();

    if (!['en', 'ur'].includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language selection. Supported languages are "en" and "ur".' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE popolive.users SET preferred_language = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [lang, user.id]
    );

    return NextResponse.json({
      success: true,
      message: `Language updated to ${lang === 'ur' ? 'Urdu' : 'English'}.`,
      language: lang,
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/settings/language:', err);
    return NextResponse.json({ error: 'Failed to update language.' }, { status: 500 });
  }
}
