import { NextRequest } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';
import { dispatchPushNotification } from '@/lib/pushNotifications';

export interface HostRankingItem {
  rank: number;
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  hostLevel: number;
  wealthLevel: number;
  isVerified: boolean;
  score: number;
  scoreFormatted: string;
  giftPoints: number;
  profileUrl: string;
}

export interface EventItem {
  id: string;
  eventCode: string;
  title: string;
  titleUrdu: string;
  description: string;
  bannerUrl: string;
  status: 'active' | 'upcoming' | 'completed';
  startTime: string;
  endTime: string;
  prizePool: string;
  rules: string;
  totalParticipants: number;
}

export interface AgencyInfo {
  id: string;
  agencyCode: string;
  name: string;
  description: string;
  adminUserId: string;
  adminNickname?: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: number;
  totalHosts: number;
  activeHosts: number;
  pendingHosts: number;
  announcement: string;
  createdAt: string;
}

export interface AgencyMemberItem {
  id: string;
  agencyId: string;
  hostUserId: string;
  nickname: string;
  handle: string;
  avatarUrl: string;
  poppoId: string;
  hostLevel: number;
  status: 'active' | 'pending' | 'inactive' | 'suspended' | 'rejected';
  joinedAt: string | null;
  notes: string;
}

function formatScore(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

/**
 * Resolve actor from session cookies, Bearer header, or dev headers
 */
export async function resolveUserActor(req: NextRequest): Promise<{ id: string; nickname: string; role: string; wealthLevel: number } | null> {
  const devViewerId = req.headers.get('x-viewer-id') || req.headers.get('x-user-id');
  if (devViewerId) {
    const res = await query<any>(
      `SELECT id, nickname, role, wealth_level, status FROM popolive.users WHERE id = $1`,
      [devViewerId]
    );
    if (res.length > 0) {
      return {
        id: res[0].id,
        nickname: res[0].nickname,
        role: res[0].role,
        wealthLevel: res[0].wealth_level || 1,
      };
    }
  }

  const sessionToken = req.cookies.get('poppo_session')?.value || req.cookies.get('session_token')?.value;
  if (sessionToken) {
    const sessionRes = await query<any>(
      `SELECT s.user_id, u.nickname, u.role, u.wealth_level, u.status
       FROM popolive.user_sessions s
       JOIN popolive.users u ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );
    if (sessionRes.length > 0) {
      return {
        id: sessionRes[0].user_id,
        nickname: sessionRes[0].nickname,
        role: sessionRes[0].role,
        wealthLevel: sessionRes[0].wealth_level || 1,
      };
    }
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const sessionRes = await query<any>(
      `SELECT s.user_id, u.nickname, u.role, u.wealth_level, u.status
       FROM popolive.user_sessions s
       JOIN popolive.users u ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    if (sessionRes.length > 0) {
      return {
        id: sessionRes[0].user_id,
        nickname: sessionRes[0].nickname,
        role: sessionRes[0].role,
        wealthLevel: sessionRes[0].wealth_level || 1,
      };
    }
  }

  return null;
}

/**
 * 1. HOST RANKINGS
 */
export async function getHostRankings(params: {
  period?: string;
  limit?: number;
  viewerId?: string | null;
}): Promise<{
  period: string;
  rankings: HostRankingItem[];
  podium: { first: HostRankingItem | null; second: HostRankingItem | null; third: HostRankingItem | null };
  myRank: { rank: number | null; score: number; scoreFormatted: string } | null;
}> {
  const period = (params.period || 'daily').toLowerCase();
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  let timeFilter = "AND pt.created_at >= CURRENT_DATE";
  if (period === 'weekly') {
    timeFilter = "AND pt.created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')";
  } else if (period === 'monthly') {
    timeFilter = "AND pt.created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')";
  }

  // Calculate actual gift points and live earnings for hosts
  const rows = await query<any>(
    `SELECT 
       u.id,
       u.poppo_id,
       u.nickname,
       u.avatar_url,
       COALESCE(u.country, 'Pakistan') AS country,
       COALESCE(u.country_code, 'PK') AS country_code,
       COALESCE(u.host_level, 1) AS host_level,
       COALESCE(u.wealth_level, 1) AS wealth_level,
       COALESCE(u.is_adult_verified, false) AS is_adult_verified,
       COALESCE(SUM(pt.points_amount), 0) AS gift_points,
       COALESCE(SUM(lr.coins_earned), 0) AS room_coins,
       (COALESCE(SUM(pt.points_amount), 0) + COALESCE(SUM(lr.coins_earned), 0) + (u.host_level * 500)) AS total_score
     FROM popolive.users u
     LEFT JOIN popolive.points_transactions pt 
       ON pt.host_user_id = u.id::text AND pt.transaction_type IN ('gift_earned', 'pk_gift_earned', 'task_reward') ${timeFilter}
     LEFT JOIN popolive.live_rooms lr 
       ON lr.host_id = u.id AND lr.created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
     WHERE u.status = 'active' AND (u.role = 'host' OR u.host_level >= 1)
     GROUP BY u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, u.host_level, u.wealth_level, u.is_adult_verified
     ORDER BY total_score DESC, u.host_level DESC
     LIMIT $1`,
    [limit]
  );

  const rankings: HostRankingItem[] = rows.map((r, idx) => {
    const scoreNum = parseInt(r.total_score || '0', 10);
    const countryCodeClean = r.country_code || 'PK';
    return {
      rank: idx + 1,
      id: r.id,
      poppoId: r.poppo_id || r.id.substring(0, 8),
      nickname: r.nickname || 'Host Creator',
      avatarUrl: r.avatar_url || '/avatars/default.png',
      country: r.country,
      countryCode: countryCodeClean,
      flagEmoji: getCountryFlag(countryCodeClean),
      hostLevel: r.host_level,
      wealthLevel: r.wealth_level,
      isVerified: Boolean(r.is_adult_verified || r.host_level >= 3),
      score: scoreNum,
      scoreFormatted: formatScore(scoreNum),
      giftPoints: parseInt(r.gift_points || '0', 10),
      profileUrl: `/user/${r.id}`,
    };
  });

  const podium = {
    first: rankings[0] || null,
    second: rankings[1] || null,
    third: rankings[2] || null,
  };

  let myRank: { rank: number | null; score: number; scoreFormatted: string } | null = null;
  if (params.viewerId) {
    const foundIndex = rankings.findIndex((item) => item.id === params.viewerId);
    if (foundIndex !== -1) {
      myRank = {
        rank: foundIndex + 1,
        score: rankings[foundIndex].score,
        scoreFormatted: rankings[foundIndex].scoreFormatted,
      };
    } else {
      // Query specific user score
      const userRes = await query<any>(
        `SELECT u.id, u.host_level, COALESCE(SUM(pt.points_amount), 0) as gift_points
         FROM popolive.users u
         LEFT JOIN popolive.points_transactions pt ON pt.host_user_id = u.id::text ${timeFilter}
         WHERE u.id = $1
         GROUP BY u.id, u.host_level`,
        [params.viewerId]
      );
      if (userRes.length > 0) {
        const myScore = parseInt(userRes[0].gift_points || '0', 10) + (userRes[0].host_level * 500);
        myRank = {
          rank: null,
          score: myScore,
          scoreFormatted: formatScore(myScore),
        };
      }
    }
  }

  return {
    period,
    rankings,
    podium,
    myRank,
  };
}

/**
 * 2. EVENT LEADERBOARD
 */
export async function getEventsList(statusFilter?: string): Promise<EventItem[]> {
  let queryText = 'SELECT * FROM popolive.events';
  const queryParams: any[] = [];

  if (statusFilter && ['active', 'upcoming', 'completed'].includes(statusFilter.toLowerCase())) {
    queryText += ' WHERE status = $1';
    queryParams.push(statusFilter.toLowerCase());
  }

  queryText += ' ORDER BY start_time DESC';

  const rows = await query<any>(queryText, queryParams);
  return rows.map((r) => ({
    id: r.id,
    eventCode: r.event_code,
    title: r.title,
    titleUrdu: r.title_urdu || '',
    description: r.description || '',
    bannerUrl: r.banner_url || '/banners/star_creator_banner.png',
    status: r.status,
    startTime: r.start_time.toISOString(),
    endTime: r.end_time.toISOString(),
    prizePool: r.prize_pool || 'Exclusive Rewards',
    rules: r.rules || '',
    totalParticipants: r.total_participants || 0,
  }));
}

export async function getEventLeaderboard(eventId: string, currentUserId?: string): Promise<{
  event: EventItem;
  participants: {
    rank: number;
    userId: string;
    nickname: string;
    avatarUrl: string;
    poppoId: string;
    score: number;
    scoreFormatted: string;
    registeredAt: string;
  }[];
  myRank: { rank: number | null; score: number; isParticipating: boolean };
}> {
  // Query event
  const eventRows = await query<any>(
    'SELECT * FROM popolive.events WHERE id::text = $1 OR event_code = $1 LIMIT 1',
    [eventId]
  );
  if (eventRows.length === 0) {
    throw new Error('EVENT_NOT_FOUND');
  }

  const ev = eventRows[0];
  const eventItem: EventItem = {
    id: ev.id,
    eventCode: ev.event_code,
    title: ev.title,
    titleUrdu: ev.title_urdu || '',
    description: ev.description || '',
    bannerUrl: ev.banner_url || '/banners/star_creator_banner.png',
    status: ev.status,
    startTime: ev.start_time.toISOString(),
    endTime: ev.end_time.toISOString(),
    prizePool: ev.prize_pool || 'Exclusive Rewards',
    rules: ev.rules || '',
    totalParticipants: ev.total_participants || 0,
  };

  // Query participants ranked by score DESC
  const partRows = await query<any>(
    `SELECT 
       ep.rank,
       ep.score,
       ep.registered_at,
       u.id AS user_id,
       u.nickname,
       u.avatar_url,
       u.poppo_id
     FROM popolive.event_participants ep
     JOIN popolive.users u ON u.id = ep.user_id
     WHERE ep.event_id = $1
     ORDER BY ep.score DESC, ep.registered_at ASC`,
    [ev.id]
  );

  const participants = partRows.map((r, idx) => {
    const scoreNum = parseInt(r.score || '0', 10);
    return {
      rank: idx + 1,
      userId: r.user_id,
      nickname: r.nickname || 'Participant',
      avatarUrl: r.avatar_url || '/avatars/default.png',
      poppoId: r.poppo_id || r.user_id.substring(0, 8),
      score: scoreNum,
      scoreFormatted: formatScore(scoreNum),
      registeredAt: r.registered_at.toISOString(),
    };
  });

  let myRank = { rank: null as number | null, score: 0, isParticipating: false };
  if (currentUserId) {
    const myIdx = participants.findIndex((p) => p.userId === currentUserId);
    if (myIdx !== -1) {
      myRank = {
        rank: myIdx + 1,
        score: participants[myIdx].score,
        isParticipating: true,
      };
    }
  }

  return {
    event: eventItem,
    participants,
    myRank,
  };
}

export async function joinEvent(eventId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return await withTransaction(async (client) => {
    const evRes = await client.query('SELECT id, status FROM popolive.events WHERE id::text = $1 OR event_code = $1', [eventId]);
    if (evRes.rows.length === 0) throw new Error('EVENT_NOT_FOUND');
    const ev = evRes.rows[0];

    if (ev.status === 'completed') throw new Error('EVENT_COMPLETED');

    await client.query(
      `INSERT INTO popolive.event_participants (event_id, user_id, score, rank)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [ev.id, userId]
    );

    // Update participants count
    await client.query(
      `UPDATE popolive.events
       SET total_participants = (SELECT COUNT(*) FROM popolive.event_participants WHERE event_id = $1)
       WHERE id = $1`,
      [ev.id]
    );

    return { success: true, message: 'Successfully registered for event.' };
  });
}

/**
 * 3. AGENCY MANAGEMENT
 */

/**
 * Fetch agency where the user is an admin or member
 */
export async function getAgencyInfo(userId: string): Promise<{
  agency: AgencyInfo | null;
  roleInAgency: 'admin' | 'member' | 'pending' | 'none';
}> {
  // Check if admin of an agency
  const adminRes = await query<any>(
    `SELECT a.*, u.nickname as admin_nickname
     FROM popolive.agencies a
     JOIN popolive.users u ON u.id = a.admin_user_id
     WHERE a.admin_user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (adminRes.length > 0) {
    const a = adminRes[0];
    const memberCounts = await query<any>(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'active') as active,
         COUNT(*) FILTER (WHERE status = 'pending') as pending
       FROM popolive.agency_members
       WHERE agency_id = $1`,
      [a.id]
    );

    const counts = memberCounts[0] || { total: 0, active: 0, pending: 0 };

    return {
      agency: {
        id: a.id,
        agencyCode: a.agency_code,
        name: a.name,
        description: a.description || '',
        adminUserId: a.admin_user_id,
        adminNickname: a.admin_nickname,
        status: a.status,
        logoUrl: a.logo_url || '/avatars/agency_default.png',
        contactEmail: a.contact_email || '',
        contactPhone: a.contact_phone || '',
        commissionRate: parseFloat(a.commission_rate || '10.00'),
        totalHosts: parseInt(counts.total, 10),
        activeHosts: parseInt(counts.active, 10),
        pendingHosts: parseInt(counts.pending, 10),
        announcement: a.announcement || '',
        createdAt: a.created_at.toISOString(),
      },
      roleInAgency: 'admin',
    };
  }

  // Check if user is a member of an agency
  const memberRes = await query<any>(
    `SELECT am.status as membership_status, a.*, u.nickname as admin_nickname
     FROM popolive.agency_members am
     JOIN popolive.agencies a ON a.id = am.agency_id
     JOIN popolive.users u ON u.id = a.admin_user_id
     WHERE am.host_user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (memberRes.length > 0) {
    const m = memberRes[0];
    const counts = await query<any>(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'active') as active,
         COUNT(*) FILTER (WHERE status = 'pending') as pending
       FROM popolive.agency_members
       WHERE agency_id = $1`,
      [m.id]
    );

    return {
      agency: {
        id: m.id,
        agencyCode: m.agency_code,
        name: m.name,
        description: m.description || '',
        adminUserId: m.admin_user_id,
        adminNickname: m.admin_nickname,
        status: m.status,
        logoUrl: m.logo_url || '/avatars/agency_default.png',
        contactEmail: m.contact_email || '',
        contactPhone: m.contact_phone || '',
        commissionRate: parseFloat(m.commission_rate || '10.00'),
        totalHosts: parseInt(counts[0]?.total || '0', 10),
        activeHosts: parseInt(counts[0]?.active || '0', 10),
        pendingHosts: parseInt(counts[0]?.pending || '0', 10),
        announcement: m.announcement || '',
        createdAt: m.created_at.toISOString(),
      },
      roleInAgency: m.membership_status === 'active' ? 'member' : 'pending',
    };
  }

  return { agency: null, roleInAgency: 'none' };
}

/**
 * Register a new Agency
 * Preserves admin approval workflow: initial status is always 'pending'.
 */
export async function registerAgency(params: {
  userId: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<AgencyInfo> {
  const { userId, name, description, contactEmail, contactPhone } = params;

  if (!name || name.trim().length < 3) {
    throw new Error('AGENCY_NAME_TOO_SHORT');
  }

  // Check if user already owns an agency
  const existing = await query<any>('SELECT id FROM popolive.agencies WHERE admin_user_id = $1', [userId]);
  if (existing.length > 0) {
    throw new Error('USER_ALREADY_OWNS_AGENCY');
  }

  // Generate unique agency code e.g. AG-XXXX
  const codeSuffix = Math.floor(1000 + Math.random() * 9000);
  const agencyCode = `AG-${codeSuffix}`;

  const res = await query<any>(
    `INSERT INTO popolive.agencies (
       agency_code, name, description, admin_user_id, status, contact_email, contact_phone, logo_url, total_hosts
     ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, '/avatars/agency_default.png', 1)
     RETURNING *`,
    [agencyCode, name.trim(), description || '', userId, contactEmail || '', contactPhone || '']
  );

  const a = res[0];

  // Register admin as first active member
  await query(
    `INSERT INTO popolive.agency_members (agency_id, host_user_id, status, joined_at, notes)
     VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, 'Founding Agency Leader')`,
    [a.id, userId]
  );

  // Log real-time event
  await query(
    `INSERT INTO popolive.agency_realtime_events (agency_id, user_id, event_type, payload)
     VALUES ($1, $2, 'agency_registered', $3::jsonb)`,
    [a.id, userId, JSON.stringify({ agencyCode, name, status: 'pending' })]
  );

  return {
    id: a.id,
    agencyCode: a.agency_code,
    name: a.name,
    description: a.description || '',
    adminUserId: a.admin_user_id,
    status: a.status,
    logoUrl: a.logo_url,
    contactEmail: a.contact_email || '',
    contactPhone: a.contact_phone || '',
    commissionRate: 10.0,
    totalHosts: 1,
    activeHosts: 1,
    pendingHosts: 0,
    announcement: '',
    createdAt: a.created_at.toISOString(),
  };
}

/**
 * Get agency members (strictly for authorized agency admins or hosts viewing their agency)
 */
export async function getAgencyMembers(params: {
  agencyId: string;
  requesterId: string;
  statusFilter?: string;
  search?: string;
}): Promise<AgencyMemberItem[]> {
  const { agencyId, requesterId, statusFilter, search } = params;

  // Authorization check: requester must be agency admin or member
  const authRes = await query<any>(
    `SELECT a.admin_user_id, am.status as member_status
     FROM popolive.agencies a
     LEFT JOIN popolive.agency_members am ON am.agency_id = a.id AND am.host_user_id = $2
     WHERE a.id = $1`,
    [agencyId, requesterId]
  );

  if (authRes.length === 0) {
    throw new Error('AGENCY_NOT_FOUND');
  }

  const isAgencyAdmin = authRes[0].admin_user_id === requesterId;
  const isMember = authRes[0].member_status === 'active';

  if (!isAgencyAdmin && !isMember) {
    throw new Error('UNAUTHORIZED_AGENCY_ACCESS');
  }

  let sql = `
    SELECT 
      am.id,
      am.agency_id,
      am.host_user_id,
      am.status,
      am.joined_at,
      COALESCE(am.notes, '') as notes,
      u.nickname,
      u.poppo_id,
      u.avatar_url,
      u.host_level
    FROM popolive.agency_members am
    JOIN popolive.users u ON u.id = am.host_user_id
    WHERE am.agency_id = $1
  `;
  const values: any[] = [agencyId];

  if (statusFilter && statusFilter !== 'All') {
    values.push(statusFilter.toLowerCase());
    sql += ` AND am.status = $${values.length}`;
  }

  if (search && search.trim()) {
    values.push(`%${search.trim().toLowerCase()}%`);
    sql += ` AND (LOWER(u.nickname) LIKE $${values.length} OR LOWER(u.poppo_id) LIKE $${values.length})`;
  }

  sql += ` ORDER BY CASE WHEN am.status = 'pending' THEN 0 WHEN am.status = 'active' THEN 1 ELSE 2 END, am.created_at DESC`;

  const rows = await query<any>(sql, values);

  return rows.map((r) => ({
    id: r.id,
    agencyId: r.agency_id,
    hostUserId: r.host_user_id,
    nickname: r.nickname || 'Creator',
    handle: `@${(r.nickname || 'creator').toLowerCase().replace(/\s+/g, '.')}`,
    avatarUrl: r.avatar_url || '/avatars/default.png',
    poppoId: r.poppo_id || r.host_user_id.substring(0, 8),
    hostLevel: r.host_level || 1,
    status: r.status,
    joinedAt: r.joined_at ? r.joined_at.toISOString() : null,
    notes: r.notes || '',
  }));
}

/**
 * Approve pending agency member (Agency Admin Only)
 */
export async function approveAgencyMember(params: {
  agencyId: string;
  memberId: string;
  adminUserId: string;
}): Promise<{ success: boolean; message: string }> {
  const { agencyId, memberId, adminUserId } = params;

  return await withTransaction(async (client) => {
    // Verify admin ownership
    const agencyRes = await client.query('SELECT admin_user_id FROM popolive.agencies WHERE id = $1', [agencyId]);
    if (agencyRes.rows.length === 0) throw new Error('AGENCY_NOT_FOUND');
    if (agencyRes.rows[0].admin_user_id !== adminUserId) throw new Error('FORBIDDEN_NOT_AGENCY_ADMIN');

    // Update member
    const updateRes = await client.query(
      `UPDATE popolive.agency_members
       SET status = 'active', joined_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND agency_id = $2
       RETURNING host_user_id`,
      [memberId, agencyId]
    );

    if (updateRes.rows.length === 0) throw new Error('MEMBER_NOT_FOUND');
    const hostUserId = updateRes.rows[0].host_user_id;

    // Update total hosts count
    await client.query(
      `UPDATE popolive.agencies
       SET total_hosts = (SELECT COUNT(*) FROM popolive.agency_members WHERE agency_id = $1 AND status = 'active')
       WHERE id = $1`,
      [agencyId]
    );

    // Real-time event
    await client.query(
      `INSERT INTO popolive.agency_realtime_events (agency_id, user_id, event_type, payload)
       VALUES ($1, $2, 'member_approved', $3::jsonb)`,
      [agencyId, hostUserId, JSON.stringify({ memberId, approvedBy: adminUserId })]
    );

    // Dispatch notification to host
    dispatchPushNotification({
      userId: hostUserId,
      payload: {
        type: 'system_notice',
        title: 'Agency Membership Approved!',
        body: 'Your join request was approved by the agency administrator. Welcome aboard!',
        data: { agencyId, action: 'agency_approved' },
      },
    }).catch(() => null);

    return { success: true, message: 'Host approved and joined agency successfully.' };
  });
}

/**
 * Reject pending agency member (Agency Admin Only)
 */
export async function rejectAgencyMember(params: {
  agencyId: string;
  memberId: string;
  adminUserId: string;
}): Promise<{ success: boolean; message: string }> {
  const { agencyId, memberId, adminUserId } = params;

  return await withTransaction(async (client) => {
    const agencyRes = await client.query('SELECT admin_user_id FROM popolive.agencies WHERE id = $1', [agencyId]);
    if (agencyRes.rows.length === 0) throw new Error('AGENCY_NOT_FOUND');
    if (agencyRes.rows[0].admin_user_id !== adminUserId) throw new Error('FORBIDDEN_NOT_AGENCY_ADMIN');

    const updateRes = await client.query(
      `UPDATE popolive.agency_members
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND agency_id = $2
       RETURNING host_user_id`,
      [memberId, agencyId]
    );

    if (updateRes.rows.length === 0) throw new Error('MEMBER_NOT_FOUND');

    return { success: true, message: 'Agency membership request rejected.' };
  });
}

/**
 * Remove active agency member (Agency Admin Only)
 */
export async function removeAgencyMember(params: {
  agencyId: string;
  memberId: string;
  adminUserId: string;
}): Promise<{ success: boolean; message: string }> {
  const { agencyId, memberId, adminUserId } = params;

  return await withTransaction(async (client) => {
    const agencyRes = await client.query('SELECT admin_user_id FROM popolive.agencies WHERE id = $1', [agencyId]);
    if (agencyRes.rows.length === 0) throw new Error('AGENCY_NOT_FOUND');
    if (agencyRes.rows[0].admin_user_id !== adminUserId) throw new Error('FORBIDDEN_NOT_AGENCY_ADMIN');

    const delRes = await client.query(
      `DELETE FROM popolive.agency_members WHERE id = $1 AND agency_id = $2 RETURNING host_user_id`,
      [memberId, agencyId]
    );

    if (delRes.rows.length === 0) throw new Error('MEMBER_NOT_FOUND');

    // Update total count
    await client.query(
      `UPDATE popolive.agencies
       SET total_hosts = (SELECT COUNT(*) FROM popolive.agency_members WHERE agency_id = $1 AND status = 'active')
       WHERE id = $1`,
      [agencyId]
    );

    return { success: true, message: 'Host removed from agency.' };
  });
}

/**
 * Host submits join request to an agency
 */
export async function requestJoinAgency(agencyCodeOrId: string, hostUserId: string): Promise<{ success: boolean; message: string }> {
  return await withTransaction(async (client) => {
    const agencyRes = await client.query(
      'SELECT id, name, status, admin_user_id FROM popolive.agencies WHERE id::text = $1 OR agency_code = $1',
      [agencyCodeOrId]
    );
    if (agencyRes.rows.length === 0) throw new Error('AGENCY_NOT_FOUND');
    const a = agencyRes.rows[0];

    if (a.status !== 'active') throw new Error('AGENCY_NOT_ACTIVE');

    // Check existing membership
    const existRes = await client.query(
      'SELECT status FROM popolive.agency_members WHERE agency_id = $1 AND host_user_id = $2',
      [a.id, hostUserId]
    );

    if (existRes.rows.length > 0) {
      if (existRes.rows[0].status === 'active') throw new Error('ALREADY_ACTIVE_MEMBER');
      if (existRes.rows[0].status === 'pending') throw new Error('REQUEST_ALREADY_PENDING');
    }

    await client.query(
      `INSERT INTO popolive.agency_members (agency_id, host_user_id, status, notes)
       VALUES ($1, $2, 'pending', 'Host join request submitted')
       ON CONFLICT (agency_id, host_user_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP`,
      [a.id, hostUserId]
    );

    // Real-time event
    await client.query(
      `INSERT INTO popolive.agency_realtime_events (agency_id, user_id, event_type, payload)
       VALUES ($1, $2, 'join_requested', $3::jsonb)`,
      [a.id, hostUserId, JSON.stringify({ agencyId: a.id, hostUserId })]
    );

    // Notify agency admin
    dispatchPushNotification({
      userId: a.admin_user_id,
      payload: {
        type: 'system_notice',
        title: 'New Agency Join Request',
        body: 'A creator has requested to join your agency. Review their profile now.',
        data: { agencyId: a.id, action: 'agency_request' },
      },
    }).catch(() => null);

    return { success: true, message: `Join request submitted to ${a.name}. Awaiting administrator review.` };
  });
}
