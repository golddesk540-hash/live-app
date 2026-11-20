import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

const CATEGORY_MAP: Record<string, string[]> = {
  achievements: ['achievements', 'milestone', 'reward', 'achievement'],
  system: ['system', 'platform', 'announcement'],
  security: ['security', 'account', 'security_safety'],
  followers: ['followers', 'follow', 'social'],
};

/**
 * GET /api/message/official/:id (and /message/official/:id)
 * Fetches official notices for a category (e.g. 'achievements', 'system', 'security', 'followers')
 * or a specific notice UUID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { noticeId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'read official notices');

    const identifier = params.noticeId.toLowerCase();

    // Check if identifier is a category slug
    const matchingCategories = CATEGORY_MAP[identifier];

    if (matchingCategories) {
      const notices = await query<any>(
        `SELECT 
          sn.id,
          sn.reference_code,
          sn.category,
          sn.badge_label,
          sn.title,
          sn.title_ur,
          sn.short_desc,
          sn.short_desc_ur,
          sn.full_message,
          sn.full_message_ur,
          sn.is_important,
          sn.created_at,
          EXISTS (
            SELECT 1 FROM popolive.user_notice_reads unr 
            WHERE unr.notice_id = sn.id AND unr.user_id = $1
          ) as is_read
         FROM popolive.system_notices sn
         WHERE sn.category = ANY($2)
         ORDER BY sn.created_at DESC
         LIMIT 50`,
        [user.id, matchingCategories]
      );

      return NextResponse.json({
        success: true,
        category: identifier,
        notices: notices.map((n) => ({
          id: n.id,
          referenceCode: n.reference_code,
          category: n.category,
          badgeLabel: n.badge_label,
          title: n.title,
          titleUr: n.title_ur,
          shortDesc: n.short_desc,
          fullMessage: n.full_message,
          isImportant: Boolean(n.is_important),
          isRead: Boolean(n.is_read),
          createdAt: n.created_at,
          timestamp: n.created_at ? new Date(n.created_at).toLocaleDateString() : '',
        })),
        total: notices.length,
      });
    }

    // Otherwise query by specific notice UUID
    const singleNotice = await query<any>(
      `SELECT sn.*, 
              EXISTS (
                SELECT 1 FROM popolive.user_notice_reads unr 
                WHERE unr.notice_id = sn.id AND unr.user_id = $1
              ) as is_read
       FROM popolive.system_notices sn
       WHERE sn.id::text = $2 OR sn.reference_code = $2
       LIMIT 1`,
      [user.id, params.noticeId]
    );

    if (singleNotice.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notice not found.', code: 'NOTICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const n = singleNotice[0];

    // Mark notice as read for user
    await query(
      `INSERT INTO popolive.user_notice_reads (id, notice_id, user_id, read_at)
       VALUES (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (notice_id, user_id) DO NOTHING`,
      [n.id, user.id]
    );

    return NextResponse.json({
      success: true,
      notice: {
        id: n.id,
        referenceCode: n.reference_code,
        category: n.category,
        badgeLabel: n.badge_label,
        title: n.title,
        titleUr: n.title_ur,
        shortDesc: n.short_desc,
        fullMessage: n.full_message,
        isImportant: Boolean(n.is_important),
        isRead: true,
        createdAt: n.created_at,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}

/**
 * POST /api/message/official/:id
 * Enforces Rule 3: Official notices are strictly system-generated.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'CANNOT_WRITE_OFFICIAL_NOTICE: Official notices are system-generated. Users cannot write to official rows.',
      code: 'CANNOT_WRITE_OFFICIAL_NOTICE',
    },
    { status: 403 }
  );
}
