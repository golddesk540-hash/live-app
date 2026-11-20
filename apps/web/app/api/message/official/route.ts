import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * Canonical 4 Official Notice Categories
 */
const OFFICIAL_CATEGORIES = [
  {
    id: 'achievements',
    title: 'Achievements',
    titleUr: 'کامیابیاں',
    iconType: 'trophy',
    colorGradient: 'from-amber-500 to-yellow-600',
    description: 'Level milestones, rankings, and broadcast achievements',
    dbCategories: ['achievements', 'milestone', 'reward'],
  },
  {
    id: 'system',
    title: 'System Notice',
    titleUr: 'سسٹم نوٹس',
    iconType: 'bell',
    colorGradient: 'from-blue-500 to-indigo-600',
    description: 'Platform announcements, terms updates, and maintenance schedules',
    dbCategories: ['system', 'platform', 'announcement'],
  },
  {
    id: 'security',
    title: 'Account Security',
    titleUr: 'اکاؤنٹ سیکیورٹی',
    iconType: 'shield',
    colorGradient: 'from-emerald-500 to-teal-600',
    description: 'New login alerts, password changes, and 2FA activity',
    dbCategories: ['security', 'account', 'security_safety'],
  },
  {
    id: 'followers',
    title: 'New Followers',
    titleUr: 'نئے فالوورز',
    iconType: 'user-plus',
    colorGradient: 'from-pink-500 to-rose-600',
    description: 'Notifications when fans and friends follow your profile',
    dbCategories: ['followers', 'follow', 'social'],
  },
];

/**
 * GET /api/message/official (and /message/official)
 * Retrieves summaries and unread counts for the 4 official notice categories
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'view official notices');

    // For each official category, find latest notice and count unread
    const officialRows = await Promise.all(
      OFFICIAL_CATEGORIES.map(async (cat) => {
        // Find latest system notice in matching categories
        const latestRows = await query<any>(
          `SELECT sn.id, sn.title, sn.title_ur, sn.short_desc, sn.short_desc_ur, sn.created_at,
                  EXISTS (
                    SELECT 1 FROM popolive.user_notice_reads unr 
                    WHERE unr.notice_id = sn.id AND unr.user_id = $1
                  ) as is_read
           FROM popolive.system_notices sn
           WHERE sn.category = ANY($2)
           ORDER BY sn.created_at DESC
           LIMIT 1`,
          [user.id, cat.dbCategories]
        );

        // Count unread system notices for this user in this category
        const unreadCountRes = await query<{ count: string }>(
          `SELECT COUNT(*) as count
           FROM popolive.system_notices sn
           WHERE sn.category = ANY($2)
             AND NOT EXISTS (
               SELECT 1 FROM popolive.user_notice_reads unr 
               WHERE unr.notice_id = sn.id AND unr.user_id = $1
             )`,
          [user.id, cat.dbCategories]
        );

        const latest = latestRows[0] || null;
        const unreadCount = parseInt(unreadCountRes[0]?.count || '0', 10);

        return {
          id: cat.id,
          category: cat.id,
          title: cat.title,
          titleUr: cat.titleUr,
          iconType: cat.iconType,
          colorGradient: cat.colorGradient,
          description: cat.description,
          lastNoticeTitle: latest ? latest.title : 'No new notices',
          lastNoticeTime: latest?.created_at ? new Date(latest.created_at).toLocaleDateString() : '',
          unreadCount,
          latestNotice: latest,
        };
      })
    );

    return NextResponse.json({
      success: true,
      officialRows,
      notices: officialRows,
      totalCategories: officialRows.length,
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
 * POST /api/message/official (and /message/official)
 * Enforces Rule 3: Official notices are strictly system-generated.
 * Users cannot write to official notice rows; backend rejects with HTTP 403 CANNOT_WRITE_OFFICIAL_NOTICE.
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
