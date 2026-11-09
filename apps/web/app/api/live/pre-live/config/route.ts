import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || req.nextUrl.searchParams.get('demo') === 'true';
    const user = await getAuthenticatedUser(req).catch(() => null);

    // Fetch active broadcast categories
    const categoriesRows = await query(
      `SELECT id, name, description, icon_name, display_order
       FROM popolive.live_categories
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    const categories = categoriesRows.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      iconName: c.icon_name,
    }));

    if (!user) {
      if (isDemo) {
        return NextResponse.json({
          success: true,
          isDemo: true,
          user: {
            id: 'demo-user-id',
            poppoId: '8899001',
            nickname: 'Zara Live',
            wealthLevel: 12,
            isFaceVerified: true,
            liveCoverUrl: '/assets/pre-live/sample_cover_model.png',
          },
          gates: {
            isEligible: true,
            missingGates: [],
          },
          savedSetup: {
            title: 'Come and chat with me 💕',
            categoryId: 'live_chat',
            categoryName: 'Live Chat',
            coverUrl: '/assets/pre-live/sample_cover_model.png',
          },
          categories,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Authentication required to access Pre-Live Setup.' },
        { status: 401 }
      );
    }

    // Query fresh user state from PostgreSQL
    const userRows = await query(
      `SELECT id, poppo_id, nickname, COALESCE(wealth_level, 1) as wealth_level,
              COALESCE(is_face_verified, false) as is_face_verified,
              live_cover_url,
              COALESCE(preferred_live_title, 'Come and chat with me 💕') as preferred_live_title,
              COALESCE(preferred_live_category, 'live_chat') as preferred_live_category
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    const u = userRows[0];
    const wealthLevel = Number(u.wealth_level) || 1;
    const isFaceVerified = Boolean(u.is_face_verified);
    const hasCoverImage = Boolean(u.live_cover_url && u.live_cover_url.trim().length > 0);
    const isWealthQualified = wealthLevel >= 5;

    const missingGates: string[] = [];
    if (!isFaceVerified) missingGates.push('face_check');
    if (!hasCoverImage) missingGates.push('cover_image');
    if (!isWealthQualified) missingGates.push('wealth_level');

    const isEligible = missingGates.length === 0;

    // Check if user has an existing staged room
    const roomRows = await query(
      `SELECT id, room_number, title, category, cover_url
       FROM popolive.live_rooms
       WHERE host_id = $1 AND status = 'setup'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [user.id]
    );

    const stagedRoom = roomRows.length > 0 ? roomRows[0] : null;

    const activeCategoryId = stagedRoom?.category
      ? (categories.find(c => c.name.toLowerCase() === stagedRoom.category.toLowerCase())?.id || u.preferred_live_category)
      : u.preferred_live_category;

    const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];

    return NextResponse.json({
      success: true,
      isDemo: false,
      user: {
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
        wealthLevel,
        isFaceVerified,
        liveCoverUrl: u.live_cover_url || '/assets/pre-live/sample_cover_model.png',
      },
      gates: {
        isEligible,
        missingGates,
      },
      savedSetup: {
        title: stagedRoom?.title || u.preferred_live_title || 'Come and chat with me 💕',
        categoryId: activeCategory?.id || 'live_chat',
        categoryName: activeCategory?.name || 'Live Chat',
        coverUrl: stagedRoom?.cover_url || u.live_cover_url || '/assets/pre-live/sample_cover_model.png',
      },
      categories,
    });
  } catch (err: any) {
    console.error('Error in GET /api/live/pre-live/config:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
