import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  PKDiscoveryTab,
  PKDiscoveryBattleItem,
  PKAvailableHostItem,
  PKDiscoveryResponse,
  formatPKViewers,
  formatPKTime,
  determinePKTimerState,
} from '@/lib/pk';

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
    const tab = (searchParams.get('tab') || 'live').toLowerCase() as PKDiscoveryTab;
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const country = (searchParams.get('country') || '').trim().toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // 1. Fetch Real Counts for badges across categories
    const countsSql = `
      SELECT
        COUNT(CASE WHEN b.status = 'active' THEN 1 END)::int as live_count,
        COUNT(CASE WHEN b.status = 'active' AND b.is_featured = true THEN 1 END)::int as featured_count,
        COUNT(CASE WHEN b.status = 'active' AND b.viewer_count >= 10000 THEN 1 END)::int as popular_count,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::int as recent_count,
        (SELECT COUNT(*)::int FROM popolive.users u JOIN popolive.live_rooms lr ON lr.host_id = u.id WHERE lr.is_live = true AND u.status = 'active' AND u.in_pk_battle = false) as available_hosts_count
      FROM popolive.pk_battles b;
    `;
    const countRes = await query<any>(countsSql);
    const countsRow = countRes[0] || {};
    const counts = {
      all: (countsRow.live_count || 0) + (countsRow.available_hosts_count || 0),
      live: countsRow.live_count || 0,
      availableHosts: countsRow.available_hosts_count || 0,
      popular: countsRow.popular_count || 0,
      recent: countsRow.recent_count || 0,
      featured: countsRow.featured_count || 0,
    };

    let battles: PKDiscoveryBattleItem[] = [];
    let hosts: PKAvailableHostItem[] = [];
    let totalItems = 0;

    // 2. Fetch Available Hosts if requested tab is 'available_hosts' or 'all'
    if (tab === 'available_hosts' || (tab === 'all' && page === 1)) {
      let hostSql = `
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
          AND COALESCE(u.in_pk_battle, false) = false
      `;
      const hostParams: any[] = [];

      if (search) {
        hostParams.push(`%${search}%`);
        hostSql += ` AND (LOWER(u.nickname) LIKE $${hostParams.length} OR u.poppo_id LIKE $${hostParams.length} OR LOWER(u.country) LIKE $${hostParams.length})`;
      }

      if (country && country !== 'ALL') {
        hostParams.push(country);
        hostSql += ` AND (u.country_code = $${hostParams.length} OR UPPER(u.country) = $${hostParams.length})`;
      }

      hostSql += ` ORDER BY lr.viewer_count DESC LIMIT 20`;
      const hostRows = await query<any>(hostSql, hostParams);

      hosts = hostRows.map((r: any) => ({
        id: r.id,
        poppoId: r.poppo_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url || '/avatars/default.png',
        country: r.country || 'Pakistan',
        countryCode: r.country_code || 'PK',
        flagEmoji: getFlagEmoji(r.country_code),
        roomNumber: r.room_number,
        viewerCount: Number(r.viewer_count) || 0,
        viewersFormatted: formatPKViewers(Number(r.viewer_count) || 0),
        isLive: Boolean(r.is_live || r.room_status === 'live'),
        inPkBattle: Boolean(r.in_pk_battle),
        pkInvitesEnabled: Boolean(r.pk_invites_enabled),
        isEligibleForPk: Boolean(r.is_face_verified && r.go_live_eligible && !r.in_pk_battle && r.pk_invites_enabled),
      }));

      if (tab === 'available_hosts') {
        totalItems = counts.availableHosts;
      }
    }

    // 3. Fetch Battles if tab is not exclusively 'available_hosts'
    if (tab !== 'available_hosts') {
      let battleSql = `
        SELECT 
          b.id,
          b.battle_type,
          b.status,
          b.duration_seconds,
          b.remaining_seconds,
          b.timer_status,
          b.expires_at,
          b.started_at,
          b.ended_at,
          b.is_featured,
          b.featured_order,
          COALESCE(b.viewer_count, 0) as viewer_count,
          b.winner_host_id,
          b.host_a_id,
          b.host_a_room,
          b.host_a_nickname,
          b.host_a_avatar,
          b.host_a_score,
          ua.poppo_id as host_a_poppo_id,
          ua.country as host_a_country,
          ua.country_code as host_a_country_code,
          b.host_b_id,
          b.host_b_room,
          b.host_b_nickname,
          b.host_b_avatar,
          b.host_b_score,
          ub.poppo_id as host_b_poppo_id,
          ub.country as host_b_country,
          ub.country_code as host_b_country_code
        FROM popolive.pk_battles b
        LEFT JOIN popolive.users ua ON ua.id::text = b.host_a_id::text
        LEFT JOIN popolive.users ub ON ub.id::text = b.host_b_id::text
        WHERE 1=1
      `;
      const battleParams: any[] = [];

      // Filter by tab status
      if (tab === 'live' || tab === 'all') {
        battleSql += ` AND b.status = 'active'`;
      } else if (tab === 'recent') {
        battleSql += ` AND b.status = 'completed'`;
      } else if (tab === 'featured') {
        battleSql += ` AND b.status = 'active' AND b.is_featured = true`;
      } else if (tab === 'popular') {
        battleSql += ` AND b.status = 'active'`;
      }

      // Search filter
      if (search) {
        battleParams.push(`%${search}%`);
        const pIdx = battleParams.length;
        battleSql += ` AND (
          LOWER(b.host_a_nickname) LIKE $${pIdx} OR 
          LOWER(b.host_b_nickname) LIKE $${pIdx} OR
          ua.poppo_id LIKE $${pIdx} OR 
          ub.poppo_id LIKE $${pIdx} OR
          LOWER(ua.country) LIKE $${pIdx} OR
          LOWER(ub.country) LIKE $${pIdx}
        )`;
      }

      // Country filter
      if (country && country !== 'ALL') {
        battleParams.push(country);
        const pIdx = battleParams.length;
        battleSql += ` AND (
          ua.country_code = $${pIdx} OR ub.country_code = $${pIdx} OR
          UPPER(ua.country) = $${pIdx} OR UPPER(ub.country) = $${pIdx}
        )`;
      }

      // Order by
      if (tab === 'popular') {
        battleSql += ` ORDER BY b.viewer_count DESC, (b.host_a_score + b.host_b_score) DESC`;
      } else if (tab === 'recent') {
        battleSql += ` ORDER BY b.ended_at DESC NULLS LAST, b.created_at DESC`;
      } else if (tab === 'featured') {
        battleSql += ` ORDER BY b.featured_order ASC, b.viewer_count DESC`;
      } else {
        // Default Live PK view matching 06_06_pk_discovery_tab.png
        battleSql += ` ORDER BY b.is_featured DESC, b.featured_order ASC, b.viewer_count DESC`;
      }

      battleParams.push(limit);
      const limitIdx = battleParams.length;
      battleParams.push(offset);
      const offsetIdx = battleParams.length;
      battleSql += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

      const battleRows = await query<any>(battleSql, battleParams);
      const now = new Date();

      battles = battleRows.map((r: any) => {
        let remainingSeconds = r.remaining_seconds ?? 300;
        if (r.status === 'active' && r.expires_at) {
          const diffMs = new Date(r.expires_at).getTime() - now.getTime();
          remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
        }

        const timerStatus = determinePKTimerState(remainingSeconds);

        return {
          id: r.id,
          battleType: r.battle_type || '1v1',
          status: r.status,
          hostA: {
            id: r.host_a_id,
            poppoId: r.host_a_poppo_id || '88201',
            nickname: r.host_a_nickname || 'Host A',
            avatarUrl: r.host_a_avatar || '/avatars/default.png',
            country: r.host_a_country || 'Pakistan',
            countryCode: r.host_a_country_code || 'PK',
            flagEmoji: getFlagEmoji(r.host_a_country_code),
            roomNumber: r.host_a_room || '88201',
            score: parseInt(r.host_a_score || '0', 10),
          },
          hostB: {
            id: r.host_b_id,
            poppoId: r.host_b_poppo_id || '88202',
            nickname: r.host_b_nickname || 'Host B',
            avatarUrl: r.host_b_avatar || '/avatars/default.png',
            country: r.host_b_country || 'Pakistan',
            countryCode: r.host_b_country_code || 'PK',
            flagEmoji: getFlagEmoji(r.host_b_country_code),
            roomNumber: r.host_b_room || '88202',
            score: parseInt(r.host_b_score || '0', 10),
          },
          viewerCount: Number(r.viewer_count) || 0,
          viewersFormatted: formatPKViewers(Number(r.viewer_count) || 0),
          remainingSeconds,
          formattedTimer: formatPKTime(remainingSeconds),
          timerStatus,
          isFeatured: Boolean(r.is_featured),
          featuredOrder: Number(r.featured_order) || 0,
          startedAt: r.started_at,
          endedAt: r.ended_at,
          winnerHostId: r.winner_host_id,
        };
      });

      totalItems = tab === 'live' ? counts.live : tab === 'popular' ? counts.popular : tab === 'recent' ? counts.recent : counts.all;
    }

    const response: PKDiscoveryResponse = {
      success: true,
      tab,
      battles,
      hosts,
      counts,
      pagination: {
        page,
        limit,
        total: totalItems,
        hasMore: offset + limit < totalItems,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('API /api/pk/discovery error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve PK discovery list' },
      { status: 500 }
    );
  }
}
