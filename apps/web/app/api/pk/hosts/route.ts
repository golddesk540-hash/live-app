import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { LiveHost } from '@/lib/pk';

export const dynamic = 'force-dynamic';

function getFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const excludeHostId = searchParams.get('excludeHostId') || '';
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const currentHostId = excludeHostId || authUser?.id || '';

    let sql = `
      SELECT 
        u.id,
        u.poppo_id,
        u.nickname,
        u.avatar_url,
        u.country,
        u.country_code,
        u.status as user_status,
        u.is_face_verified,
        u.go_live_eligible,
        COALESCE(u.in_pk_battle, false) as in_pk_battle,
        COALESCE(u.pk_invites_enabled, true) as pk_invites_enabled,
        lr.room_number,
        COALESCE(lr.viewer_count, 0) as viewer_count,
        lr.status as room_status,
        lr.is_live
      FROM popolive.users u
      JOIN popolive.live_rooms lr ON lr.host_id = u.id
      WHERE (lr.is_live = true OR lr.status = 'live')
        AND u.status = 'active'
    `;

    const params: any[] = [];

    if (currentHostId) {
      params.push(currentHostId);
      sql += ` AND u.id::text != $${params.length} AND u.poppo_id != $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (LOWER(u.nickname) LIKE $${params.length} OR u.poppo_id LIKE $${params.length})`;
    }

    // Prioritize canonical hosts (Sara Live, Ayesha, Zoya) then viewer count
    sql += `
      ORDER BY 
        CASE 
          WHEN u.poppo_id = '88201' THEN 1
          WHEN u.poppo_id = '88202' THEN 2
          WHEN u.poppo_id = '88203' THEN 3
          ELSE 4
        END,
        lr.viewer_count DESC
      LIMIT 30;
    `;

    const rows = await query(sql, params);

    const hosts: LiveHost[] = rows.map((r: any) => {
      const isEligible = Boolean(
        r.is_face_verified &&
        r.go_live_eligible &&
        !r.in_pk_battle &&
        r.pk_invites_enabled
      );

      return {
        id: r.id,
        poppoId: r.poppo_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url || '/avatars/default.png',
        country: r.country || 'Pakistan',
        countryCode: r.country_code || 'PK',
        flagEmoji: getFlagEmoji(r.country_code),
        roomNumber: r.room_number,
        viewerCount: Number(r.viewer_count) || 0,
        isLive: Boolean(r.is_live || r.room_status === 'live'),
        inPkBattle: Boolean(r.in_pk_battle),
        pkInvitesEnabled: Boolean(r.pk_invites_enabled),
        isOnline: true,
        isEligibleForPk: isEligible,
      };
    });

    return NextResponse.json({
      success: true,
      count: hosts.length,
      hosts,
    });
  } catch (err: any) {
    console.error('API /api/pk/hosts error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live hosts for PK' },
      { status: 500 }
    );
  }
}
