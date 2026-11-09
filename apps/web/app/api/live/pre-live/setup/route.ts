import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to prepare your live session.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let { title, categoryId, coverUrl } = body;

    // 1. Title validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Live title is required.' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live title cannot be empty or only spaces.' },
        { status: 400 }
      );
    }

    if (trimmedTitle.length > 60) {
      return NextResponse.json(
        { success: false, error: `Live title exceeds maximum 60 characters limit (current: ${trimmedTitle.length}).` },
        { status: 400 }
      );
    }

    // 2. Category validation
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category selection is required.' },
        { status: 400 }
      );
    }

    const categoryRows = await query(
      `SELECT id, name FROM popolive.live_categories WHERE id = $1 AND is_active = true LIMIT 1`,
      [categoryId]
    );

    if (categoryRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid category selected. Please choose a valid category.' },
        { status: 400 }
      );
    }

    const selectedCategory = categoryRows[0];

    // 3. Re-verify Module 4.1 Go-Live Gates from PostgreSQL as authoritative source of truth
    const userRows = await query(
      `SELECT id, poppo_id, nickname, country, country_code,
              COALESCE(is_face_verified, false) as is_face_verified,
              live_cover_url,
              COALESCE(wealth_level, 1) as wealth_level
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    const u = userRows[0];
    const isFaceVerified = Boolean(u.is_face_verified);
    const resolvedCoverUrl = coverUrl || u.live_cover_url;
    const hasCoverImage = Boolean(resolvedCoverUrl && resolvedCoverUrl.trim().length > 0);
    const wealthLevel = Number(u.wealth_level) || 1;
    const isWealthQualified = wealthLevel >= 5;

    const reasons: string[] = [];
    const missingGates: string[] = [];

    if (!isFaceVerified) {
      reasons.push('Face Check: Real face biometric verification must be completed in Module 4.1.');
      missingGates.push('face_check');
    }

    if (!hasCoverImage) {
      reasons.push('Cover Image: A valid live broadcast cover image must be provided.');
      missingGates.push('cover_image');
    }

    if (!isWealthQualified) {
      reasons.push(`Wealth Level: Minimum Level 5 required to go live. Your current level is ${wealthLevel}.`);
      missingGates.push('wealth_level');
    }

    if (reasons.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Go-Live eligibility gate requirements incomplete.',
          reasons,
          missingGates,
        },
        { status: 403 }
      );
    }

    // 4. Update user default preferences
    await query(
      `UPDATE popolive.users
       SET preferred_live_title = $1,
           preferred_live_category = $2,
           live_cover_url = COALESCE($3, live_cover_url)
       WHERE id = $4`,
      [trimmedTitle, selectedCategory.id, resolvedCoverUrl, user.id]
    );

    // 5. Upsert staged room in popolive.live_rooms
    const existingRoomRows = await query(
      `SELECT id, room_number FROM popolive.live_rooms WHERE host_id = $1 AND (status = 'setup' OR is_live = false) ORDER BY updated_at DESC LIMIT 1`,
      [user.id]
    );

    let roomId = '';
    let roomNumber = '';

    if (existingRoomRows.length > 0) {
      roomId = existingRoomRows[0].id;
      roomNumber = existingRoomRows[0].room_number;
      await query(
        `UPDATE popolive.live_rooms
         SET title = $1,
             category = $2,
             cover_url = $3,
             status = 'setup',
             is_live = false,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [trimmedTitle, selectedCategory.name, resolvedCoverUrl, roomId]
      );
    } else {
      roomId = crypto.randomUUID();
      roomNumber = String(crypto.randomInt(100000, 999999));
      await query(
        `INSERT INTO popolive.live_rooms (
          id, room_number, host_id, title, cover_url, category, status, is_live,
          viewer_count, country, country_code, stream_key, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'setup', false,
          0, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          roomId,
          roomNumber,
          user.id,
          trimmedTitle,
          resolvedCoverUrl,
          selectedCategory.name,
          u.country || 'Global',
          u.country_code || 'WW',
          `sk_live_${crypto.randomBytes(8).toString('hex')}`
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-live setup configured successfully. Ready for Module 4.3 (Host Studio).',
      session: {
        roomId,
        roomNumber,
        title: trimmedTitle,
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        coverUrl: resolvedCoverUrl,
        hostNickname: u.nickname,
        hostPoppoId: u.poppo_id,
        status: 'setup',
      },
      nextStep: `/live/studio/${roomId}`,
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/pre-live/setup:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
