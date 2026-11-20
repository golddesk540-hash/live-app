import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/message/unread-count (and /message/unread-count)
 * Returns total unread messages across direct message conversations and official notice rows
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

    assertAdultMessage(user, 'check unread message counts');

    // 1. Direct Message Unread Count
    const dmUnreadRes = await query<any>(
      `SELECT COALESCE(SUM(
         CASE 
           WHEN participant_one_id::text = $1 THEN unread_count_one 
           ELSE unread_count_two 
         END
       ), 0) as dm_unread
       FROM popolive.inbox_conversations
       WHERE participant_one_id::text = $1 OR participant_two_id::text = $1`,
      [user.id]
    );
    const conversationsUnread = parseInt(dmUnreadRes[0]?.dm_unread || '0', 10);

    // 2. Official Notices Unread Count
    const officialUnreadRes = await query<any>(
      `SELECT COUNT(*) as official_unread
       FROM popolive.system_notices sn
       WHERE NOT EXISTS (
         SELECT 1 FROM popolive.user_notice_reads unr
         WHERE unr.notice_id = sn.id AND unr.user_id = $1
       )`,
      [user.id]
    );
    const officialUnread = parseInt(officialUnreadRes[0]?.official_unread || '0', 10);

    const totalUnread = conversationsUnread + officialUnread;

    return NextResponse.json({
      success: true,
      totalUnread,
      unreadCount: totalUnread,
      conversationsUnread,
      officialUnread,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}
