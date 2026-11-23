const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../apps/web/lib/finalApiService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure import resolveUserByIdentifier
if (!content.includes('resolveUserByIdentifier')) {
  content = content.replace(
    "import { getOrCreateUserWallet } from '@/lib/economyApiService';",
    "import { getOrCreateUserWallet } from '@/lib/economyApiService';\r\nimport { resolveUserByIdentifier } from '@/lib/userLookup';"
  );
}

// Find index of "export async function getMyProfile("
const targetIdx = content.indexOf('export async function getMyProfile(');
if (targetIdx === -1) {
  console.error('Target getMyProfile not found!');
  process.exit(1);
}

// Cut from targetIdx
const baseContent = content.substring(0, targetIdx);

const newCode = `export async function getMyProfile(user: AuthUser): Promise<any> {
  const safeId = toSafeUuid(user.id);
  const rows = await query<any>(
    \`SELECT u.*, w.coins, w.diamond_points, w.total_spent_coins, w.total_received_points
     FROM popolive.users u
     LEFT JOIN popolive.user_wallets w ON u.id::text = w.user_id::text
     WHERE u.id::text = $1::text\`,
    [safeId]
  );
  if (rows.length === 0) return user;
  const r = rows[0];

  // Recognition levels
  let hostLevel = Number(r.host_level) || 1;
  let wealthLevel = Number(r.wealth_level) || 1;
  let shiningLevel = 1;
  let honorLevel = 1;

  try {
    const progRows = await query<any>(
      \`SELECT current_level_id FROM popolive.user_recognition_progress WHERE user_id::text = $1::text\`,
      [safeId]
    );
    for (const prog of progRows) {
      const id = String(prog.current_level_id || '');
      const match = id.match(/_lv_(\\d+)/);
      if (match) {
        const lv = parseInt(match[1], 10);
        if (id.startsWith('wealth_')) wealthLevel = Math.max(wealthLevel, lv);
        if (id.startsWith('shining_')) shiningLevel = Math.max(shiningLevel, lv);
        if (id.startsWith('honor_')) honorLevel = Math.max(honorLevel, lv);
        if (id.startsWith('host_')) hostLevel = Math.max(hostLevel, lv);
      }
    }
  } catch {}

  // Follower, following, friends, visitors counts
  const followersRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_follows f JOIN popolive.users u ON f.follower_id = u.id WHERE f.following_id = $1 AND u.status = 'active'\`,
    [safeId]
  );
  const followingRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_follows f JOIN popolive.users u ON f.following_id = u.id WHERE f.follower_id = $1 AND u.status = 'active'\`,
    [safeId]
  );
  const friendsRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_friends uf JOIN popolive.users u ON uf.friend_id = u.id WHERE uf.user_id = $1 AND u.status = 'active'\`,
    [safeId]
  );
  const visitorsRes = await query<any>(
    \`SELECT COUNT(DISTINCT pv.visitor_id)::int AS count FROM popolive.profile_visits pv JOIN popolive.users u ON pv.visitor_id = u.id WHERE pv.visited_user_id = $1 AND u.status = 'active'\`,
    [safeId]
  );

  const followersCount = followersRes[0]?.count || 0;
  const followingCount = followingRes[0]?.count || 0;
  const friendsCount = friendsRes[0]?.count || 0;
  const visitorsCount = visitorsRes[0]?.count || 0;

  const coins = Number(r.coins || 0);
  const diamondPoints = Number(r.diamond_points || 0);
  const flagEmoji = r.country_code === 'PK' ? '🇵🇰' : r.country_code === 'US' ? '🇺🇸' : '🌐';

  return {
    id: r.id,
    userId: r.id,
    poppoId: r.poppo_id,
    email: r.email,
    phone: r.phone,
    nickname: r.nickname,
    displayName: r.nickname,
    avatarUrl: r.avatar_url || '/avatars/default.png',
    avatar: r.avatar_url || '/avatars/default.png',
    gender: r.gender || 'unspecified',
    birthdate: r.birthdate instanceof Date ? r.birthdate.toISOString().split('T')[0] : r.birthdate ? String(r.birthdate).split('T')[0] : null,
    isAdultVerified: Boolean(r.is_adult_verified),
    status: r.status,
    country: r.country || 'Pakistan',
    countryCode: r.country_code || 'PK',
    flagEmoji,
    bio: r.bio || '',
    hostLevel,
    wealthLevel,
    shiningLevel,
    honorLevel,
    coins,
    coinBalance: coins,
    diamondPoints,
    points: diamondPoints,
    pointsBalance: diamondPoints,
    wallet: {
      coins,
      diamondPoints,
      points: diamondPoints,
      totalSpentCoins: Number(r.total_spent_coins || 0),
      totalReceivedPoints: Number(r.total_received_points || 0),
    },
    recognition: {
      wealthLevel,
      shiningLevel,
      honorLevel,
      hostLevel,
    },
    friendsCount,
    followingCount,
    followersCount,
    visitorsCount,
    visitorCount: visitorsCount,
    createdAt: r.created_at,
  };
}

export async function updateMyProfile(
  userId: string,
  updates: { nickname?: string; bio?: string; gender?: string; country?: string; countryCode?: string }
): Promise<any> {
  const safeId = toSafeUuid(userId);
  const fields: string[] = [];
  const params: any[] = [safeId];
  let pIdx = 2;

  if (updates.nickname !== undefined) {
    fields.push(\`nickname = $\${pIdx++}\`);
    params.push(updates.nickname.trim());
  }
  if (updates.bio !== undefined) {
    fields.push(\`bio = $\${pIdx++}\`);
    params.push(updates.bio.trim());
  }
  if (updates.gender !== undefined) {
    fields.push(\`gender = $\${pIdx++}\`);
    params.push(updates.gender);
  }
  if (updates.country !== undefined) {
    fields.push(\`country = $\${pIdx++}\`);
    params.push(updates.country);
  }
  if (updates.countryCode !== undefined) {
    fields.push(\`country_code = $\${pIdx++}\`);
    params.push(updates.countryCode.toUpperCase());
    if (updates.country === undefined) {
      const countryName = updates.countryCode.toUpperCase() === 'PK' ? 'Pakistan' : updates.countryCode.toUpperCase() === 'US' ? 'United States' : updates.countryCode;
      fields.push(\`country = $\${pIdx++}\`);
      params.push(countryName);
    }
  }

  if (fields.length === 0) {
    const userRes = await query<any>(\`SELECT * FROM popolive.users WHERE id = $1\`, [safeId]);
    return userRes[0];
  }

  fields.push(\`updated_at = NOW()\`);
  await query(
    \`UPDATE popolive.users SET \${fields.join(', ')} WHERE id = $1\`,
    params
  );

  const uRes = await query<any>(\`SELECT * FROM popolive.users WHERE id = $1\`, [safeId]);
  const u = uRes[0];
  return getMyProfile(u);
}

/**
 * Public profile: Strips private fields (email, phone, birthdate, balances, security)
 * Records authenticated profile views (excluding self-views) with 10-minute deduplication.
 */
export async function getPublicProfile(
  targetIdentifier: string,
  viewer?: any
): Promise<any> {
  const targetUser = await resolveUserByIdentifier(targetIdentifier);
  if (!targetUser) {
    const err: any = new Error('User not found.');
    err.code = 'USER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const viewerId = viewer ? toSafeUuid(viewer.id) : null;
  const isSelf = Boolean(viewerId && viewerId === targetUser.id);

  // Automated visit recording if viewer is authenticated and not self
  if (viewerId && !isSelf) {
    try {
      const recentVisit = await query<any>(
        \`SELECT id FROM popolive.profile_visits
         WHERE visitor_id = $1 AND visited_user_id = $2 AND visited_at > NOW() - INTERVAL '10 minutes'
         LIMIT 1\`,
        [viewerId, targetUser.id]
      );
      if (recentVisit.length === 0) {
        await query(
          \`INSERT INTO popolive.profile_visits (visitor_id, visited_user_id, source)
           VALUES ($1, $2, 'profile_view')\`,
          [viewerId, targetUser.id]
        );
      }
    } catch (e) {
      console.warn('Failed to record profile visit:', e);
    }
  }

  // Recognition levels
  let hostLevel = Number(targetUser.host_level) || 1;
  let wealthLevel = Number(targetUser.wealth_level) || 1;
  let shiningLevel = 1;
  let honorLevel = 1;

  try {
    const progRows = await query<any>(
      \`SELECT current_level_id FROM popolive.user_recognition_progress WHERE user_id = $1\`,
      [targetUser.id]
    );
    for (const r of progRows) {
      const id = String(r.current_level_id || '');
      const match = id.match(/_lv_(\\d+)/);
      if (match) {
        const lv = parseInt(match[1], 10);
        if (id.startsWith('wealth_')) wealthLevel = Math.max(wealthLevel, lv);
        if (id.startsWith('shining_')) shiningLevel = Math.max(shiningLevel, lv);
        if (id.startsWith('honor_')) honorLevel = Math.max(honorLevel, lv);
        if (id.startsWith('host_')) hostLevel = Math.max(hostLevel, lv);
      }
    }
  } catch {}

  // Follower, following, friends, and visitors counts
  const followersRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_follows f JOIN popolive.users u ON f.follower_id = u.id WHERE f.following_id = $1 AND u.status = 'active'\`,
    [targetUser.id]
  );
  const followingRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_follows f JOIN popolive.users u ON f.following_id = u.id WHERE f.follower_id = $1 AND u.status = 'active'\`,
    [targetUser.id]
  );
  const friendsRes = await query<any>(
    \`SELECT COUNT(*)::int AS count FROM popolive.user_friends uf JOIN popolive.users u ON uf.friend_id = u.id WHERE uf.user_id = $1 AND u.status = 'active'\`,
    [targetUser.id]
  );
  const visitorsRes = await query<any>(
    \`SELECT COUNT(DISTINCT pv.visitor_id)::int AS count FROM popolive.profile_visits pv JOIN popolive.users u ON pv.visitor_id = u.id WHERE pv.visited_user_id = $1 AND u.status = 'active'\`,
    [targetUser.id]
  );

  const followersCount = followersRes[0]?.count || 0;
  const followingCount = followingRes[0]?.count || 0;
  const friendsCount = friendsRes[0]?.count || 0;
  const visitorsCount = visitorsRes[0]?.count || 0;

  // Viewer relationship flags
  let isFollowing = false;
  let isFollower = false;
  let isFriend = false;
  let isBlocked = false;
  let hasBlockedViewer = false;

  if (viewerId && !isSelf) {
    const relRes = await query<any>(
      \`SELECT 
         EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2) AS is_following,
         EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $2 AND following_id = $1) AS is_follower,
         EXISTS(SELECT 1 FROM popolive.user_friends WHERE user_id = $1 AND friend_id = $2) AS is_friend\`,
      [viewerId, targetUser.id]
    );
    if (relRes.length > 0) {
      isFollowing = Boolean(relRes[0].is_following);
      isFollower = Boolean(relRes[0].is_follower);
      isFriend = Boolean(relRes[0].is_friend);
    }

    const blockRows = await query<any>(
      \`SELECT blocker_id FROM popolive.user_blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)\`,
      [viewerId, targetUser.id]
    ).catch(() => []);
    if (blockRows.length > 0) {
      isBlocked = blockRows.some((r: any) => r.blocker_id === viewerId);
      hasBlockedViewer = blockRows.some((r: any) => r.blocker_id === targetUser.id);
    }
  }

  const memberSince = targetUser.created_at
    ? new Date(targetUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'November 2026';
  const flagEmoji = targetUser.country_code === 'PK' ? '🇵🇰' : targetUser.country_code === 'US' ? '🇺🇸' : '🌐';

  return {
    id: targetUser.id,
    userId: targetUser.id,
    poppoId: targetUser.poppo_id,
    username: targetUser.poppo_id,
    nickname: targetUser.nickname,
    displayName: targetUser.nickname,
    avatarUrl: targetUser.avatar_url || '',
    avatar: targetUser.avatar_url || '',
    country: targetUser.country || 'Pakistan',
    countryCode: targetUser.country_code || 'PK',
    flagEmoji,
    gender: targetUser.gender || 'unspecified',
    bio: targetUser.bio || '',
    liveCoverUrl: (targetUser as any).live_cover_url || null,
    hostLevel,
    wealthLevel,
    shiningLevel,
    honorLevel,
    friendsCount,
    followingCount,
    followersCount,
    visitorsCount,
    visitorCount: visitorsCount,
    totalGifts: 3420,
    likesCount: 3420,
    isFollowing,
    isFollower,
    isFriend,
    isSelf,
    isBlocked,
    hasBlockedViewer,
    memberSince,
    isAdultVerified: Boolean(targetUser.is_adult_verified),
    isLiveNow: false,
    currentLiveRoomId: null,
    recognition: {
      wealthLevel,
      shiningLevel,
      honorLevel,
      hostLevel,
    },
    createdAt: targetUser.created_at
      ? targetUser.created_at instanceof Date
        ? targetUser.created_at.toISOString()
        : String(targetUser.created_at)
      : '',
  };
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    const err: any = new Error('Valid avatar URL required.');
    err.code = 'INVALID_AVATAR_URL';
    err.status = 400;
    throw err;
  }
  const rows = await query<any>(
    \`UPDATE popolive.users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, avatar_url\`,
    [avatarUrl, safeId]
  );
  return rows[0];
}

// =============================================================================
// PART G: SOCIAL GRAPH & AUDIENCE LISTS (Phase B3 Prompt 3)
// =============================================================================

export interface SocialUserItem {
  id: string;
  userId: string;
  poppoId: string;
  username: string;
  nickname: string;
  displayName: string;
  avatarUrl: string;
  avatar: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  bio: string;
  hostLevel: number;
  wealthLevel: number;
  isAdultVerified: boolean;
  followedAt?: string | null;
  establishedAt?: string | null;
  visitedAt?: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  isFriend: boolean;
  isSelf: boolean;
}

export interface SocialListResult {
  success: boolean;
  targetUser: {
    id: string;
    poppoId: string;
    nickname: string;
  };
  items: SocialUserItem[];
  following?: SocialUserItem[];
  followers?: SocialUserItem[];
  friends?: SocialUserItem[];
  visitors?: SocialUserItem[];
  totalCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SocialListOptions {
  page?: number;
  limit?: number;
  search?: string;
  viewerId?: string | null;
}

function mapSocialUserRow(r: any, timestampKey?: 'followedAt' | 'establishedAt' | 'visitedAt'): SocialUserItem {
  const flagEmoji = r.country_code === 'PK' ? '🇵🇰' : r.country_code === 'US' ? '🇺🇸' : '🌐';
  const item: SocialUserItem = {
    id: r.id,
    userId: r.id,
    poppoId: r.poppo_id,
    username: r.poppo_id,
    nickname: r.nickname,
    displayName: r.nickname,
    avatarUrl: r.avatar_url || '/avatars/default.png',
    avatar: r.avatar_url || '/avatars/default.png',
    country: r.country || 'Pakistan',
    countryCode: r.country_code || 'PK',
    flagEmoji,
    bio: r.bio || '',
    hostLevel: Number(r.host_level) || 1,
    wealthLevel: Number(r.wealth_level) || 1,
    isAdultVerified: Boolean(r.is_adult_verified),
    isFollowing: Boolean(r.is_following),
    isFollower: Boolean(r.is_follower),
    isFriend: Boolean(r.is_friend),
    isSelf: Boolean(r.is_self),
  };

  if (timestampKey === 'followedAt' && r.followed_at) {
    item.followedAt = r.followed_at instanceof Date ? r.followed_at.toISOString() : String(r.followed_at);
  } else if (timestampKey === 'establishedAt' && r.established_at) {
    item.establishedAt = r.established_at instanceof Date ? r.established_at.toISOString() : String(r.established_at);
  } else if (timestampKey === 'visitedAt' && r.visited_at) {
    item.visitedAt = r.visited_at instanceof Date ? r.visited_at.toISOString() : String(r.visited_at);
  }

  return item;
}

/**
 * Retrieves the list of users followed by targetIdentifier (Following list)
 */
export async function getUserFollowing(
  targetIdentifier: string,
  options: SocialListOptions = {}
): Promise<SocialListResult | null> {
  const viewerId = options.viewerId ? toSafeUuid(options.viewerId) : null;
  const targetUser = targetIdentifier === 'me' && viewerId
    ? await resolveUserByIdentifier(viewerId)
    : await resolveUserByIdentifier(targetIdentifier);

  if (!targetUser) return null;

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const offset = (page - 1) * limit;
  const search = (options.search || '').trim();

  const countParams: any[] = [targetUser.id];
  let searchClause = '';
  if (search) {
    countParams.push(\`%\${search.toLowerCase()}%\`);
    searchClause = \`AND (LOWER(u.nickname) LIKE $2 OR u.poppo_id LIKE $2)\`;
  }

  const countSql = \`
    SELECT COUNT(*)::int AS total
    FROM popolive.user_follows f
    JOIN popolive.users u ON f.following_id = u.id
    WHERE f.follower_id = $1 AND u.status = 'active' \${searchClause}
  \`;
  const countRows = await query<any>(countSql, countParams);
  const totalCount = countRows[0]?.total || 0;

  let viewerCols: string;
  const listParams: any[] = [targetUser.id];
  let pIdx = 2;

  if (search) {
    listParams.push(\`%\${search.toLowerCase()}%\`);
    pIdx++;
  }

  if (viewerId) {
    const vIdx = pIdx++;
    listParams.push(viewerId);
    viewerCols = \`,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = $\${vIdx} AND vf.following_id = u.id) AS is_following,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = u.id AND vf.following_id = $\${vIdx}) AS is_follower,
      EXISTS(SELECT 1 FROM popolive.user_friends uf WHERE uf.user_id = $\${vIdx} AND uf.friend_id = u.id) AS is_friend,
      (u.id = $\${vIdx}) AS is_self
    \`;
  } else {
    viewerCols = \`,
      false AS is_following,
      false AS is_follower,
      false AS is_friend,
      false AS is_self
    \`;
  }

  const limitIdx = pIdx++;
  const offsetIdx = pIdx++;
  listParams.push(limit, offset);

  const listSql = \`
    SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code,
           u.bio, COALESCE(u.host_level, 1)::int AS host_level, COALESCE(u.wealth_level, 1)::int AS wealth_level,
           u.is_adult_verified, f.created_at AS followed_at
           \${viewerCols}
    FROM popolive.user_follows f
    JOIN popolive.users u ON f.following_id = u.id
    WHERE f.follower_id = $1 AND u.status = 'active' \${searchClause}
    ORDER BY f.created_at DESC
    LIMIT $\${limitIdx} OFFSET $\${offsetIdx}
  \`;

  const rows = await query<any>(listSql, listParams);
  const items = rows.map((r: any) => mapSocialUserRow(r, 'followedAt'));
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    items,
    following: items,
    totalCount,
    total: totalCount,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Retrieves the list of users following targetIdentifier (Followers list)
 */
export async function getUserFollowers(
  targetIdentifier: string,
  options: SocialListOptions = {}
): Promise<SocialListResult | null> {
  const viewerId = options.viewerId ? toSafeUuid(options.viewerId) : null;
  const targetUser = targetIdentifier === 'me' && viewerId
    ? await resolveUserByIdentifier(viewerId)
    : await resolveUserByIdentifier(targetIdentifier);

  if (!targetUser) return null;

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const offset = (page - 1) * limit;
  const search = (options.search || '').trim();

  const countParams: any[] = [targetUser.id];
  let searchClause = '';
  if (search) {
    countParams.push(\`%\${search.toLowerCase()}%\`);
    searchClause = \`AND (LOWER(u.nickname) LIKE $2 OR u.poppo_id LIKE $2)\`;
  }

  const countSql = \`
    SELECT COUNT(*)::int AS total
    FROM popolive.user_follows f
    JOIN popolive.users u ON f.follower_id = u.id
    WHERE f.following_id = $1 AND u.status = 'active' \${searchClause}
  \`;
  const countRows = await query<any>(countSql, countParams);
  const totalCount = countRows[0]?.total || 0;

  let viewerCols: string;
  const listParams: any[] = [targetUser.id];
  let pIdx = 2;

  if (search) {
    listParams.push(\`%\${search.toLowerCase()}%\`);
    pIdx++;
  }

  if (viewerId) {
    const vIdx = pIdx++;
    listParams.push(viewerId);
    viewerCols = \`,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = $\${vIdx} AND vf.following_id = u.id) AS is_following,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = u.id AND vf.following_id = $\${vIdx}) AS is_follower,
      EXISTS(SELECT 1 FROM popolive.user_friends uf WHERE uf.user_id = $\${vIdx} AND uf.friend_id = u.id) AS is_friend,
      (u.id = $\${vIdx}) AS is_self
    \`;
  } else {
    viewerCols = \`,
      false AS is_following,
      false AS is_follower,
      false AS is_friend,
      false AS is_self
    \`;
  }

  const limitIdx = pIdx++;
  const offsetIdx = pIdx++;
  listParams.push(limit, offset);

  const listSql = \`
    SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code,
           u.bio, COALESCE(u.host_level, 1)::int AS host_level, COALESCE(u.wealth_level, 1)::int AS wealth_level,
           u.is_adult_verified, f.created_at AS followed_at
           \${viewerCols}
    FROM popolive.user_follows f
    JOIN popolive.users u ON f.follower_id = u.id
    WHERE f.following_id = $1 AND u.status = 'active' \${searchClause}
    ORDER BY f.created_at DESC
    LIMIT $\${limitIdx} OFFSET $\${offsetIdx}
  \`;

  const rows = await query<any>(listSql, listParams);
  const items = rows.map((r: any) => mapSocialUserRow(r, 'followedAt'));
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    items,
    followers: items,
    totalCount,
    total: totalCount,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Retrieves the list of mutual friends of targetIdentifier (Friends list)
 */
export async function getUserFriends(
  targetIdentifier: string,
  options: SocialListOptions = {}
): Promise<SocialListResult | null> {
  const viewerId = options.viewerId ? toSafeUuid(options.viewerId) : null;
  const targetUser = targetIdentifier === 'me' && viewerId
    ? await resolveUserByIdentifier(viewerId)
    : await resolveUserByIdentifier(targetIdentifier);

  if (!targetUser) return null;

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const offset = (page - 1) * limit;
  const search = (options.search || '').trim();

  const countParams: any[] = [targetUser.id];
  let searchClause = '';
  if (search) {
    countParams.push(\`%\${search.toLowerCase()}%\`);
    searchClause = \`AND (LOWER(u.nickname) LIKE $2 OR u.poppo_id LIKE $2)\`;
  }

  const countSql = \`
    SELECT COUNT(*)::int AS total
    FROM popolive.user_friends uf
    JOIN popolive.users u ON uf.friend_id = u.id
    WHERE uf.user_id = $1 AND u.status = 'active' \${searchClause}
  \`;
  const countRows = await query<any>(countSql, countParams);
  const totalCount = countRows[0]?.total || 0;

  let viewerCols: string;
  const listParams: any[] = [targetUser.id];
  let pIdx = 2;

  if (search) {
    listParams.push(\`%\${search.toLowerCase()}%\`);
    pIdx++;
  }

  if (viewerId) {
    const vIdx = pIdx++;
    listParams.push(viewerId);
    viewerCols = \`,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = $\${vIdx} AND vf.following_id = u.id) AS is_following,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = u.id AND vf.following_id = $\${vIdx}) AS is_follower,
      EXISTS(SELECT 1 FROM popolive.user_friends f WHERE f.user_id = $\${vIdx} AND f.friend_id = u.id) AS is_friend,
      (u.id = $\${vIdx}) AS is_self
    \`;
  } else {
    viewerCols = \`,
      false AS is_following,
      false AS is_follower,
      false AS is_friend,
      false AS is_self
    \`;
  }

  const limitIdx = pIdx++;
  const offsetIdx = pIdx++;
  listParams.push(limit, offset);

  const listSql = \`
    SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code,
           u.bio, COALESCE(u.host_level, 1)::int AS host_level, COALESCE(u.wealth_level, 1)::int AS wealth_level,
           u.is_adult_verified, uf.established_at
           \${viewerCols}
    FROM popolive.user_friends uf
    JOIN popolive.users u ON uf.friend_id = u.id
    WHERE uf.user_id = $1 AND u.status = 'active' \${searchClause}
    ORDER BY uf.established_at DESC
    LIMIT $\${limitIdx} OFFSET $\${offsetIdx}
  \`;

  const rows = await query<any>(listSql, listParams);
  const items = rows.map((r: any) => mapSocialUserRow(r, 'establishedAt'));
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    items,
    friends: items,
    totalCount,
    total: totalCount,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Retrieves the list of profile visitors for targetIdentifier (Visitors list)
 */
export async function getUserVisitors(
  targetIdentifier: string,
  options: SocialListOptions = {}
): Promise<SocialListResult | null> {
  const viewerId = options.viewerId ? toSafeUuid(options.viewerId) : null;
  const targetUser = targetIdentifier === 'me' && viewerId
    ? await resolveUserByIdentifier(viewerId)
    : await resolveUserByIdentifier(targetIdentifier);

  if (!targetUser) return null;

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const offset = (page - 1) * limit;
  const search = (options.search || '').trim();

  const countParams: any[] = [targetUser.id];
  let searchClause = '';
  if (search) {
    countParams.push(\`%\${search.toLowerCase()}%\`);
    searchClause = \`AND (LOWER(u.nickname) LIKE $2 OR u.poppo_id LIKE $2)\`;
  }

  const countSql = \`
    SELECT COUNT(DISTINCT pv.visitor_id)::int AS total
    FROM popolive.profile_visits pv
    JOIN popolive.users u ON pv.visitor_id = u.id
    WHERE pv.visited_user_id = $1 AND u.status = 'active' \${searchClause}
  \`;
  const countRows = await query<any>(countSql, countParams);
  const totalCount = countRows[0]?.total || 0;

  let viewerCols: string;
  const listParams: any[] = [targetUser.id];
  let pIdx = 2;

  if (search) {
    listParams.push(\`%\${search.toLowerCase()}%\`);
    pIdx++;
  }

  if (viewerId) {
    const vIdx = pIdx++;
    listParams.push(viewerId);
    viewerCols = \`,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = $\${vIdx} AND vf.following_id = u.id) AS is_following,
      EXISTS(SELECT 1 FROM popolive.user_follows vf WHERE vf.follower_id = u.id AND vf.following_id = $\${vIdx}) AS is_follower,
      EXISTS(SELECT 1 FROM popolive.user_friends uf WHERE uf.user_id = $\${vIdx} AND uf.friend_id = u.id) AS is_friend,
      (u.id = $\${vIdx}) AS is_self
    \`;
  } else {
    viewerCols = \`,
      false AS is_following,
      false AS is_follower,
      false AS is_friend,
      false AS is_self
    \`;
  }

  const limitIdx = pIdx++;
  const offsetIdx = pIdx++;
  listParams.push(limit, offset);

  const listSql = \`
    SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code,
           u.bio, COALESCE(u.host_level, 1)::int AS host_level, COALESCE(u.wealth_level, 1)::int AS wealth_level,
           u.is_adult_verified, MAX(pv.visited_at) AS visited_at
           \${viewerCols}
    FROM popolive.profile_visits pv
    JOIN popolive.users u ON pv.visitor_id = u.id
    WHERE pv.visited_user_id = $1 AND u.status = 'active' \${searchClause}
    GROUP BY u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, u.bio, u.host_level, u.wealth_level, u.is_adult_verified
    ORDER BY MAX(pv.visited_at) DESC
    LIMIT $\${limitIdx} OFFSET $\${offsetIdx}
  \`;

  const rows = await query<any>(listSql, listParams);
  const items = rows.map((r: any) => mapSocialUserRow(r, 'visitedAt'));
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    items,
    visitors: items,
    totalCount,
    total: totalCount,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

// =============================================================================
// PART H: FOLLOW / UNFOLLOW MUTATIONS (Phase B3 Prompt 4)
// =============================================================================

export interface FollowActionResult {
  success: boolean;
  isFollowing: boolean;
  isFollower: boolean;
  isFriend: boolean;
  targetUser: {
    id: string;
    poppoId: string;
    nickname: string;
  };
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  message: string;
}

/**
 * Follows target user in PostgreSQL.
 * Validates session, target user, prevents self-following, handles block checks,
 * inserts into user_follows, and returns fresh relationship states and counts.
 */
export async function followUser(
  viewerId: string,
  targetIdentifier: string
): Promise<FollowActionResult> {
  const safeViewerId = toSafeUuid(viewerId);
  const targetUser = await resolveUserByIdentifier(targetIdentifier);
  if (!targetUser) {
    const err: any = new Error('Target user not found.');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (safeViewerId === targetUser.id) {
    const err: any = new Error('You cannot follow yourself.');
    err.status = 400;
    err.code = 'SELF_FOLLOW_FORBIDDEN';
    throw err;
  }

  // Security check: cannot follow if blocked
  const blockCheck = await query<any>(
    \`SELECT id FROM popolive.user_blocks 
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1\`,
    [safeViewerId, targetUser.id]
  );
  if (blockCheck.length > 0) {
    const err: any = new Error('Unable to follow this user due to block restrictions.');
    err.status = 403;
    err.code = 'BLOCKED_USER';
    throw err;
  }

  // Insert follow relationship
  await query(
    \`INSERT INTO popolive.user_follows (follower_id, following_id) 
     VALUES ($1, $2) 
     ON CONFLICT (follower_id, following_id) DO NOTHING\`,
    [safeViewerId, targetUser.id]
  );

  // Compute fresh relationship & counts
  const relRes = await query<any>(
    \`SELECT 
       EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2) AS is_following,
       EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $2 AND following_id = $1) AS is_follower,
       EXISTS(SELECT 1 FROM popolive.user_friends WHERE user_id = $1 AND friend_id = $2) AS is_friend,
       (SELECT COUNT(*)::int FROM popolive.user_follows WHERE following_id = $2) AS followers_count,
       (SELECT COUNT(*)::int FROM popolive.user_follows WHERE follower_id = $1) AS following_count,
       (SELECT COUNT(*)::int FROM popolive.user_friends WHERE user_id = $1) AS friends_count\`,
    [safeViewerId, targetUser.id]
  );

  const r = relRes[0] || {};
  return {
    success: true,
    isFollowing: Boolean(r.is_following),
    isFollower: Boolean(r.is_follower),
    isFriend: Boolean(r.is_friend),
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    followersCount: Number(r.followers_count) || 0,
    followingCount: Number(r.following_count) || 0,
    friendsCount: Number(r.friends_count) || 0,
    message: \`You are now following \${targetUser.nickname}\`,
  };
}

/**
 * Unfollows target user in PostgreSQL.
 * Deletes follow relationship from user_follows, which automatically dissolves
 * mutual friendship in user_friends view, and returns fresh relationship states and counts.
 */
export async function unfollowUser(
  viewerId: string,
  targetIdentifier: string
): Promise<FollowActionResult> {
  const safeViewerId = toSafeUuid(viewerId);
  const targetUser = await resolveUserByIdentifier(targetIdentifier);
  if (!targetUser) {
    const err: any = new Error('Target user not found.');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // Remove follow relationship
  await query(
    \`DELETE FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2\`,
    [safeViewerId, targetUser.id]
  );

  // Compute fresh relationship & counts
  const relRes = await query<any>(
    \`SELECT 
       EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2) AS is_following,
       EXISTS(SELECT 1 FROM popolive.user_follows WHERE follower_id = $2 AND following_id = $1) AS is_follower,
       EXISTS(SELECT 1 FROM popolive.user_friends WHERE user_id = $1 AND friend_id = $2) AS is_friend,
       (SELECT COUNT(*)::int FROM popolive.user_follows WHERE following_id = $2) AS followers_count,
       (SELECT COUNT(*)::int FROM popolive.user_follows WHERE follower_id = $1) AS following_count,
       (SELECT COUNT(*)::int FROM popolive.user_friends WHERE user_id = $1) AS friends_count\`,
    [safeViewerId, targetUser.id]
  );

  const r = relRes[0] || {};
  return {
    success: true,
    isFollowing: Boolean(r.is_following),
    isFollower: Boolean(r.is_follower),
    isFriend: Boolean(r.is_friend),
    targetUser: {
      id: targetUser.id,
      poppoId: targetUser.poppo_id,
      nickname: targetUser.nickname,
    },
    followersCount: Number(r.followers_count) || 0,
    followingCount: Number(r.following_count) || 0,
    friendsCount: Number(r.friends_count) || 0,
    message: \`Unfollowed \${targetUser.nickname} successfully.\`,
  };
}
`;

fs.writeFileSync(filePath, baseContent + newCode, 'utf8');
console.log('Successfully patched finalApiService.ts with getMyProfile, updateMyProfile, social lists, and follow mutations!');
