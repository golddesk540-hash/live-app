import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge, checkRateLimit, isStaffMember } from '@/lib/auth';
import { getOrCreateUserWallet } from '@/lib/economyApiService';
import { getHonorLevels as getP7P8HonorLevels, getMedalsMe as getP7P8MedalsMe, HonorLevelsData } from '@/lib/vipApiService';

/**
 * POPO LIVE — PHASE 7 (P7-P10)
 * COMMUNITY MODULE CENTRAL SERVICE & LOCKED RULES ENGINE
 * 
 * Single authoritative service for:
 * - Fan Club management (header, join, leave, members, badges)
 * - Guardian contracts (active guardian list, become-guardian atomic buy with P7-P7 ledger, benefits)
 * - Referral Invitations (unique invite code, share payload, invited people list)
 * - Honor Level & Level views (strictly read-only, reusing P7-P8 derived values)
 * - Achievement Poster (preview payload only, no server-side image generation)
 * - Watch History (read-only from live_room_history, paginated with replay availability)
 */

export const USE_COMMUNITY_API: boolean = process.env.NEXT_PUBLIC_USE_COMMUNITY_API === 'true';

// Helper to convert arbitrary user id strings to a UUID if needed
export function toSafeUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * LOCKED RULE 1: Server-Side Age 18+ Verification
 * Reject access to fan club join, guardian contract purchase, and invite features for underage users.
 */
export function assertAdultCommunity(user: AuthUser, actionName: string = 'access community features'): void {
  if (user.is_adult_verified) return;

  if (user.birthdate) {
    const age = calculateAge(user.birthdate);
    if (age < 18) {
      const error: any = new Error(
        `AGE_RESTRICTION_18_PLUS: You must be at least 18 years old to ${actionName}. Current age: ${age}.`
      );
      error.code = 'AGE_RESTRICTION_18_PLUS';
      error.status = 403;
      throw error;
    }
  } else if (user.is_adult_verified === false) {
    const error: any = new Error(
      `AGE_RESTRICTION_18_PLUS: User age verification required. Underage accounts cannot ${actionName}.`
    );
    error.code = 'AGE_RESTRICTION_18_PLUS';
    error.status = 403;
    throw error;
  }
}

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

export interface FanClubDetail {
  id: string;
  clubId: string;
  hostId: string;
  hostNickname?: string;
  hostAvatarUrl?: string;
  name: string;
  description: string;
  badgeLabel: string;
  clubLevel: number;
  memberCount: number;
  coverImageUrl: string | null;
  accentTone: string;
  isFeatured: boolean;
  createdAt: string;
  isJoined?: boolean;
}

export interface FanClubMemberItem {
  id: string;
  clubId: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

export interface GuardianItem {
  id: string;
  hostId: string;
  guardianUserId: string;
  guardianNickname: string;
  guardianAvatar: string;
  tier: string;
  coinPrice: number;
  status: string;
  activatedAt: string;
  expiresAt: string;
}

export interface GuardianBenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tierRequirement: string;
}

export interface InviteCodeInfo {
  userId: string;
  inviteCode: string;
  shareUrl: string;
  totalInvitedCount: number;
  totalCoinsEarned: number;
  bonusPerInviteCoins: number;
}

export interface InvitedPersonItem {
  invitationId: string;
  inviteeId: string;
  nickname: string;
  avatarUrl: string;
  codeUsed: string;
  bonusCoins: number;
  bonusPaid: boolean;
  registeredAt: string;
}

export interface WatchHistoryItem {
  id: string;
  roomId: string;
  userId: string;
  hostId: string;
  hostNickname: string;
  title: string;
  coverUrl: string;
  watchedAt: string;
  durationSeconds: number;
  replayUrl: string;
  isReplayAvailable: boolean;
}

export interface AchievementPosterPayload {
  userId: string;
  nickname: string;
  poppoId: string;
  avatarUrl: string;
  country: string;
  countryFlag: string;
  generatedDate: string;
  honorSummary: {
    wealthLevel: number;
    wealthName: string;
    shiningLevel: number;
    shiningName: string;
    honorLevel: number;
    honorName: string;
  };
  highlightMedals: Array<{
    id: string;
    name: string;
    category: string;
    iconEmoji: string;
    isUnlocked: boolean;
  }>;
  stats: {
    totalRoomsWatched: number;
    totalDiamondsEarned: number;
    fanClubsJoinedCount: number;
  };
  qrCodePlaceholder: string;
  shareableDeepLink: string;
}

// -----------------------------------------------------------------------------
// 1. FAN CLUB MODULE
// -----------------------------------------------------------------------------

/**
 * Returns fan club header and overview by ID or hostId
 */
export async function getFanClubDetail(clubIdOrHostId: string, currentUserId?: string): Promise<FanClubDetail | null> {
  const safeUuid = toSafeUuid(clubIdOrHostId);

  const rows = await query<any>(
    `SELECT fc.*, u.nickname AS host_nickname, u.avatar_url AS host_avatar_url
     FROM popolive.fan_clubs fc
     LEFT JOIN popolive.users u ON fc.host_id = u.id
     WHERE fc.id = $1 OR fc.host_id::text = $1 OR fc.host_id = $2
     LIMIT 1`,
    [clubIdOrHostId, safeUuid]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  let isJoined = false;
  if (currentUserId) {
    const memberCheck = await query<any>(
      `SELECT id FROM popolive.fan_club_members WHERE club_id = $1 AND (user_id::text = $2 OR user_id = $3) LIMIT 1`,
      [r.id, currentUserId, toSafeUuid(currentUserId)]
    );
    isJoined = memberCheck.length > 0;
  }

  return {
    id: r.id,
    clubId: r.id,
    hostId: r.host_id,
    hostNickname: r.host_nickname || 'Popo Broadcaster',
    hostAvatarUrl: r.host_avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    name: r.name,
    description: r.description || '',
    badgeLabel: r.badge_label,
    clubLevel: Number(r.club_level || 1),
    memberCount: Number(r.member_count || 0),
    coverImageUrl: r.cover_image_url,
    accentTone: r.accent_tone || 'gold',
    isFeatured: Boolean(r.is_featured),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    isJoined,
  };
}

/**
 * Joins a fan club.
 * LOCKED RULE 1: Age 18+ enforcement.
 * LOCKED RULE 2: Fan Club membership is one per user per club (unique constraint).
 */
export async function joinFanClub(user: AuthUser, clubId: string): Promise<{
  success: boolean;
  memberId: string;
  clubId: string;
  badgeLabel: string;
  joinedAt: string;
}> {
  assertAdultCommunity(user, 'join a broadcaster fan club');

  const safeUserId = toSafeUuid(user.id);

  // 1. Check if club exists
  const clubRows = await query<any>(`SELECT id, badge_label, member_count FROM popolive.fan_clubs WHERE id = $1 LIMIT 1`, [clubId]);
  if (clubRows.length === 0) {
    const error: any = new Error(`FAN_CLUB_NOT_FOUND: Fan club "${clubId}" does not exist.`);
    error.code = 'FAN_CLUB_NOT_FOUND';
    error.status = 404;
    throw error;
  }
  const club = clubRows[0];

  // 2. Check duplicate join (Rule 2: unique constraint)
  const existing = await query<any>(
    `SELECT id FROM popolive.fan_club_members WHERE club_id = $1 AND user_id = $2 LIMIT 1`,
    [clubId, safeUserId]
  );
  if (existing.length > 0) {
    const error: any = new Error('ALREADY_JOINED: You are already an active member of this fan club.');
    error.code = 'ALREADY_JOINED';
    error.status = 409;
    throw error;
  }

  return withTransaction(async (client) => {
    const memberId = crypto.randomUUID();
    const joinedAt = new Date();

    await client.query(
      `INSERT INTO popolive.fan_club_members (id, club_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, 'member', $4)`,
      [memberId, clubId, safeUserId, joinedAt]
    );

    await client.query(
      `UPDATE popolive.fan_clubs SET member_count = member_count + 1, updated_at = NOW() WHERE id = $1`,
      [clubId]
    );

    return {
      success: true,
      memberId,
      clubId,
      badgeLabel: club.badge_label,
      joinedAt: joinedAt.toISOString(),
    };
  });
}

/**
 * Leaves a fan club.
 */
export async function leaveFanClub(user: AuthUser, clubId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const safeUserId = toSafeUuid(user.id);

  return withTransaction(async (client) => {
    const delRes = await client.query(
      `DELETE FROM popolive.fan_club_members WHERE club_id = $1 AND user_id = $2 RETURNING id`,
      [clubId, safeUserId]
    );

    if (delRes.rows.length === 0) {
      const error: any = new Error('NOT_A_MEMBER: You are not a member of this fan club.');
      error.code = 'NOT_A_MEMBER';
      error.status = 404;
      throw error;
    }

    await client.query(
      `UPDATE popolive.fan_clubs SET member_count = GREATEST(0, member_count - 1), updated_at = NOW() WHERE id = $1`,
      [clubId]
    );

    return {
      success: true,
      message: 'Successfully left the fan club.',
    };
  });
}

/**
 * Fetches members of a fan club
 */
export async function getFanClubMembers(clubId: string, limit: number = 20, offset: number = 0): Promise<FanClubMemberItem[]> {
  const rows = await query<any>(
    `SELECT fcm.id, fcm.club_id, fcm.user_id, fcm.role, fcm.joined_at,
            u.nickname, u.avatar_url
     FROM popolive.fan_club_members fcm
     LEFT JOIN popolive.users u ON fcm.user_id = u.id
     WHERE fcm.club_id = $1
     ORDER BY fcm.joined_at DESC
     LIMIT $2 OFFSET $3`,
    [clubId, Math.min(100, Math.max(1, limit)), Math.max(0, offset)]
  );

  return rows.map((r) => ({
    id: r.id,
    clubId: r.club_id,
    userId: r.user_id,
    nickname: r.nickname || `User ${r.user_id.substring(0, 6)}`,
    avatarUrl: r.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    role: r.role || 'member',
    joinedAt: r.joined_at ? new Date(r.joined_at).toISOString() : '',
  }));
}

/**
 * Fetches user's primary fan club badge for profile display
 */
export async function getUserFanClubBadge(userId: string): Promise<{
  hasFanClub: boolean;
  clubId?: string;
  clubName?: string;
  badgeLabel?: string;
  role?: string;
} | null> {
  const safeUserId = toSafeUuid(userId);

  const rows = await query<any>(
    `SELECT fcm.club_id, fcm.role, fc.name AS club_name, fc.badge_label
     FROM popolive.fan_club_members fcm
     JOIN popolive.fan_clubs fc ON fcm.club_id = fc.id
     WHERE fcm.user_id = $1 OR fcm.user_id::text = $2
     ORDER BY fc.club_level DESC, fcm.joined_at ASC
     LIMIT 1`,
    [safeUserId, userId]
  );

  if (rows.length === 0) {
    return { hasFanClub: false };
  }

  const r = rows[0];
  return {
    hasFanClub: true,
    clubId: r.club_id,
    clubName: r.club_name,
    badgeLabel: r.badge_label,
    role: r.role,
  };
}

// -----------------------------------------------------------------------------
// 2. GUARDIAN MODULE
// -----------------------------------------------------------------------------

export const GUARDIAN_TIER_CONFIG: Record<string, { name: string; coinPrice: number; durationDays: number }> = {
  guardian_angel: { name: 'Guardian Angel', coinPrice: 500, durationDays: 30 },
  gold_guardian: { name: 'Gold Guardian', coinPrice: 1000, durationDays: 30 },
  knight_protector: { name: 'Knight Protector', coinPrice: 500, durationDays: 30 },
  silver_guardian: { name: 'Silver Guardian', coinPrice: 500, durationDays: 30 },
  bronze_guardian: { name: 'Bronze Guardian', coinPrice: 250, durationDays: 30 },
};

/**
 * Fetches active guardians for a broadcaster / host
 * LOCKED RULE 4: Reject expired guardian records (status = 'active' AND expires_at > NOW())
 */
export async function getActiveGuardians(hostId: string): Promise<GuardianItem[]> {
  const safeHostId = toSafeUuid(hostId);

  const rows = await query<any>(
    `SELECT g.*, u.nickname AS guardian_nickname, u.avatar_url AS guardian_avatar
     FROM popolive.guardians g
     LEFT JOIN popolive.users u ON g.guardian_user_id = u.id::text OR g.guardian_user_id = u.poppo_id
     WHERE (g.host_id = $1 OR g.host_id = $2)
       AND g.status = 'active'
       AND g.expires_at > NOW()
     ORDER BY g.coin_price DESC, g.activated_at DESC`,
    [hostId, safeHostId]
  );

  return rows.map((r) => ({
    id: r.id,
    hostId: r.host_id,
    guardianUserId: r.guardian_user_id,
    guardianNickname: r.guardian_nickname || `Guardian ${r.guardian_user_id.substring(0, 6)}`,
    guardianAvatar: r.guardian_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    tier: r.guardian_tier,
    coinPrice: Number(r.coin_price),
    status: r.status,
    activatedAt: r.activated_at ? new Date(r.activated_at).toISOString() : '',
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : '',
  }));
}

/**
 * Atomically purchases a Guardian contract.
 * LOCKED RULE 1: Age 18+ enforcement.
 * LOCKED RULE 3: Debits coin_wallets atomically with P7-P7 ledger transaction.
 * LOCKED RULE 4: Guardian record created with active status and expiry.
 */
export async function becomeGuardianAtomic({
  user,
  hostId,
  tier = 'guardian_angel',
  idempotencyKey,
}: {
  user: AuthUser;
  hostId: string;
  tier?: string;
  idempotencyKey?: string | null;
}): Promise<{
  success: boolean;
  deduplicated?: boolean;
  guardian: GuardianItem;
  newBalance: number;
  transactionId: string;
}> {
  assertAdultCommunity(user, 'become a broadcaster guardian');

  const cleanHostId = (hostId || '').trim();
  if (!cleanHostId) {
    const error: any = new Error('HOST_ID_REQUIRED: Host user ID is required.');
    error.code = 'HOST_ID_REQUIRED';
    error.status = 400;
    throw error;
  }

  const idempKey = (idempotencyKey || '').trim() || null;

  // 1. Idempotency check before transaction
  if (idempKey) {
    const existing = await query<any>(
      `SELECT g.*, cw.coins
       FROM popolive.guardians g
       JOIN popolive.user_wallets cw ON g.guardian_user_id = cw.user_id
       WHERE g.idempotency_key = $1
       LIMIT 1`,
      [idempKey]
    );

    if (existing.length > 0) {
      const g = existing[0];
      return {
        success: true,
        deduplicated: true,
        guardian: {
          id: g.id,
          hostId: g.host_id,
          guardianUserId: g.guardian_user_id,
          guardianNickname: user.nickname,
          guardianAvatar: user.avatar_url,
          tier: g.guardian_tier,
          coinPrice: Number(g.coin_price),
          status: g.status,
          activatedAt: new Date(g.activated_at).toISOString(),
          expiresAt: new Date(g.expires_at).toISOString(),
        },
        newBalance: Number(g.coins),
        transactionId: g.coin_tx_id || '',
      };
    }
  }

  const tierConfig = GUARDIAN_TIER_CONFIG[tier.toLowerCase()] || GUARDIAN_TIER_CONFIG.guardian_angel;
  const coinPrice = tierConfig.coinPrice;
  const durationDays = tierConfig.durationDays;

  // 2. Atomic Transaction: Check & Lock Wallet -> Debit Coins -> Insert Ledger -> Insert Guardian
  return withTransaction(async (client) => {
    const walletRes = await client.query(
      `SELECT wallet_id, user_id, coins, total_spent_coins, is_frozen
       FROM popolive.user_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [user.id]
    );

    let wallet = walletRes.rows[0];
    if (!wallet) {
      const initRes = await client.query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0, false)
         RETURNING wallet_id, user_id, coins, total_spent_coins, is_frozen`,
        [user.id]
      );
      wallet = initRes.rows[0];
    }

    if (wallet.is_frozen) {
      const error: any = new Error('WALLET_FROZEN: Your wallet is frozen.');
      error.code = 'WALLET_FROZEN';
      error.status = 403;
      throw error;
    }

    const currentCoins = Number(wallet.coins) || 0;
    if (currentCoins < coinPrice) {
      const error: any = new Error(
        `INSUFFICIENT_COINS: User balance (${currentCoins} coins) is insufficient for guardian contract (${coinPrice} coins).`
      );
      error.code = 'INSUFFICIENT_COINS';
      error.status = 400;
      throw error;
    }

    const newCoins = currentCoins - coinPrice;
    const newTotalSpent = Number(wallet.total_spent_coins) + coinPrice;

    // A. Debit coins in wallet
    await client.query(
      `UPDATE popolive.user_wallets SET coins = $1, total_spent_coins = $2, updated_at = NOW() WHERE user_id = $3`,
      [newCoins, newTotalSpent, user.id]
    );

    // B. Write ledger in coin_transactions (Locked Rule 3: Reusing P7-P7 flow)
    const txId = `TXN_GUARD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO popolive.coin_transactions (
        id, transaction_id, wallet_id, user_id, transaction_type, direction,
        coin_amount, previous_balance, new_balance, status, reference_id,
        idempotency_key, description, metadata, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'feature_spend', 'debit',
        $4, $5, $6, 'completed', $7,
        $8, $9, $10, 'system', NOW(), NOW()
      )`,
      [
        txId,
        wallet.wallet_id,
        user.id,
        coinPrice,
        currentCoins,
        newCoins,
        cleanHostId,
        idempKey,
        `Guardian contract (${tierConfig.name}) for host: ${cleanHostId}`,
        JSON.stringify({ hostId: cleanHostId, tier: tierConfig.name, durationDays }),
      ]
    );

    // C. Create guardian contract
    const guardianId = crypto.randomUUID();
    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO popolive.guardians (
        id, host_id, guardian_user_id, guardian_tier, coin_price, coin_tx_id,
        idempotency_key, status, activated_at, expires_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, 'active', $8, $9, NOW(), NOW()
      )`,
      [
        guardianId,
        cleanHostId,
        user.id,
        tierConfig.name,
        coinPrice,
        txId,
        idempKey,
        activatedAt,
        expiresAt,
      ]
    );

    return {
      success: true,
      deduplicated: false,
      guardian: {
        id: guardianId,
        hostId: cleanHostId,
        guardianUserId: user.id,
        guardianNickname: user.nickname,
        guardianAvatar: user.avatar_url,
        tier: tierConfig.name,
        coinPrice,
        status: 'active',
        activatedAt: activatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      newBalance: newCoins,
      transactionId: txId,
    };
  });
}

/**
 * Returns guardian benefits catalog
 */
export async function getGuardianBenefits(): Promise<GuardianBenefitItem[]> {
  return [
    {
      id: 'benefit_shield_halo',
      title: 'Guardian Shield & Golden Halo',
      description: 'Exclusive glowing shield avatar ring and entry broadcast animation in live rooms.',
      icon: 'shield_halo',
      tierRequirement: 'Bronze Guardian+',
    },
    {
      id: 'benefit_reserved_seat',
      title: 'Priority Seat Access',
      description: 'Reserved VIP seating in host party rooms and audio lounges.',
      icon: 'priority_seat',
      tierRequirement: 'Silver Guardian+',
    },
    {
      id: 'benefit_chat_prominence',
      title: 'Exclusive Chat Highlight',
      description: 'Distinctive golden chat bubble and special guardian icon next to nickname.',
      icon: 'chat_highlight',
      tierRequirement: 'Gold Guardian+',
    },
    {
      id: 'benefit_fan_multiplier',
      title: '1.5x Daily Fan Point Boost',
      description: 'Accelerates fan club level-ups and monthly contributor rankings.',
      icon: 'point_multiplier',
      tierRequirement: 'Guardian Angel',
    },
  ];
}

// -----------------------------------------------------------------------------
// 3. REFERRAL INVITATIONS MODULE
// -----------------------------------------------------------------------------

/**
 * Fetches caller's unique invite code and statistics
 * LOCKED RULE 5: Invite code is unique per user.
 */
export async function getUserInviteCode(user: AuthUser): Promise<InviteCodeInfo> {
  assertAdultCommunity(user, 'access referral invite codes');

  // 1. Check or create unique invite code
  let inviteCode = `POPO-${user.poppo_id || user.id.substring(0, 6).toUpperCase()}`;

  const existingCode = await query<any>(
    `SELECT invite_code FROM popolive.user_invite_codes WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );

  if (existingCode.length > 0) {
    inviteCode = existingCode[0].invite_code;
  } else {
    await query(
      `INSERT INTO popolive.user_invite_codes (user_id, invite_code, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, inviteCode]
    );
  }

  // 2. Compute invitation stats from invitations table
  const inviteStats = await query<any>(
    `SELECT COUNT(*)::int AS total_count, COALESCE(SUM(bonus_coins), 0)::int AS total_coins
     FROM popolive.invitations
     WHERE inviter_id = $1`,
    [user.id]
  );

  const totalInvitedCount = Number(inviteStats[0]?.total_count || 0);
  const totalCoinsEarned = Number(inviteStats[0]?.total_coins || 0);

  return {
    userId: user.id,
    inviteCode,
    shareUrl: `https://popolive.com/download?ref=${encodeURIComponent(inviteCode)}`,
    totalInvitedCount,
    totalCoinsEarned,
    bonusPerInviteCoins: 100,
  };
}

/**
 * Generates share text & deep link payload for invite sharing
 */
export async function getInviteSharePayload(user: AuthUser): Promise<{
  success: boolean;
  inviteCode: string;
  shareText: string;
  shareUrl: string;
  qrCodeUrl: string;
}> {
  const codeInfo = await getUserInviteCode(user);

  return {
    success: true,
    inviteCode: codeInfo.inviteCode,
    shareText: `Join me on POPO LIVE! Live streaming, PK battles & awesome communities. Use my invite code [${codeInfo.inviteCode}] to receive 100 welcome bonus coins!`,
    shareUrl: codeInfo.shareUrl,
    qrCodeUrl: `/api/community/invite/qr/${encodeURIComponent(codeInfo.inviteCode)}`,
  };
}

/**
 * Returns list of people invited by the caller
 */
export async function getInvitedPeople(userId: string): Promise<InvitedPersonItem[]> {
  const rows = await query<any>(
    `SELECT inv.id AS invitation_id, inv.invitee_id, inv.code_used, inv.bonus_coins,
            inv.bonus_paid, inv.created_at,
            u.nickname, u.avatar_url
     FROM popolive.invitations inv
     LEFT JOIN popolive.users u ON inv.invitee_id = u.id::text OR inv.invitee_id = u.poppo_id
     WHERE inv.inviter_id = $1
     ORDER BY inv.created_at DESC`,
    [userId]
  );

  return rows.map((r) => ({
    invitationId: r.invitation_id,
    inviteeId: r.invitee_id,
    nickname: r.nickname || `Supporter ${r.invitee_id.substring(0, 6)}`,
    avatarUrl: r.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    codeUsed: r.code_used,
    bonusCoins: Number(r.bonus_coins || 100),
    bonusPaid: Boolean(r.bonus_paid),
    registeredAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));
}

/**
 * Records an invitation registration.
 * LOCKED RULE 6: Invitation records one row per invited user (unique on inviter_id, invitee_id).
 */
export async function recordInvitation({
  inviterId,
  inviteeId,
  codeUsed,
}: {
  inviterId: string;
  inviteeId: string;
  codeUsed: string;
}): Promise<{ success: boolean; invitationId: string }> {
  const invId = crypto.randomUUID();

  try {
    await query(
      `INSERT INTO popolive.invitations (id, inviter_id, invitee_id, code_used, bonus_coins, bonus_paid, created_at)
       VALUES ($1, $2, $3, $4, 100, true, NOW())`,
      [invId, inviterId, inviteeId, codeUsed]
    );

    return { success: true, invitationId: invId };
  } catch (err: any) {
    if (err.code === '23505' || err.message?.includes('uq_inviter_invitee')) {
      const error: any = new Error('DUPLICATE_INVITATION: This user has already been recorded as invited.');
      error.code = 'DUPLICATE_INVITATION';
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 4. HONOR LEVEL & LEVEL EXTENSIONS (READ-ONLY)
// -----------------------------------------------------------------------------

/**
 * Returns derived Honor Level data from P7-P8
 * LOCKED RULE 7: Strictly read-only — no write endpoints. Must match P7-P8 derived values.
 */
export async function getCommunityHonor(userId: string): Promise<HonorLevelsData> {
  return getP7P8HonorLevels(userId);
}

/**
 * Reuses honor data for Level screen
 * LOCKED RULE 7: Reuses P7-P8 honor data.
 */
export async function getCommunityLevel(userId: string): Promise<HonorLevelsData> {
  return getP7P8HonorLevels(userId);
}

// -----------------------------------------------------------------------------
// 5. ACHIEVEMENT POSTER (PREVIEW ONLY)
// -----------------------------------------------------------------------------

/**
 * Returns achievement poster payload for card preview
 * LOCKED RULE 8: Poster is preview-only — no image generation server-side in this prompt.
 */
export async function getAchievementPosterPayload(user: AuthUser): Promise<AchievementPosterPayload> {
  const honor = await getP7P8HonorLevels(user.id);
  const medalsMe = await getP7P8MedalsMe(user.id);

  // Watch count from live_room_history
  const watchCountRes = await query<any>(
    `SELECT COUNT(*)::int AS cnt FROM popolive.live_room_history WHERE user_id = $1`,
    [user.id]
  );
  const totalRoomsWatched = Number(watchCountRes[0]?.cnt || 0);

  // Fan club count from fan_club_members
  const fanCountRes = await query<any>(
    `SELECT COUNT(*)::int AS cnt FROM popolive.fan_club_members WHERE user_id = $1`,
    [toSafeUuid(user.id)]
  );
  const fanClubsJoinedCount = Number(fanCountRes[0]?.cnt || 0);

  // Wallet points
  const wallet = await getOrCreateUserWallet(user.id);

  const isPak = !user.country || user.country.toLowerCase() === 'pakistan' || user.country === 'PK';

  return {
    userId: user.id,
    nickname: user.nickname,
    poppoId: user.poppo_id,
    avatarUrl: user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    country: user.country || 'Pakistan',
    countryFlag: isPak ? '🇵🇰' : '🌐',
    generatedDate: new Date().toISOString(),
    honorSummary: {
      wealthLevel: honor.wealth.level,
      wealthName: honor.wealth.levelName,
      shiningLevel: honor.shining.level,
      shiningName: honor.shining.levelName,
      honorLevel: honor.honor.level,
      honorName: honor.honor.levelName,
    },
    highlightMedals: medalsMe.slice(0, 3).map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      iconEmoji: m.iconEmoji,
      isUnlocked: m.isUnlocked,
    })),
    stats: {
      totalRoomsWatched,
      totalDiamondsEarned: wallet.diamondPoints,
      fanClubsJoinedCount,
    },
    qrCodePlaceholder: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://popolive.com/user/${user.poppo_id}`,
    shareableDeepLink: `https://popolive.com/profile/${user.poppo_id}?from=poster`,
  };
}

// -----------------------------------------------------------------------------
// 6. WATCH HISTORY MODULE (READ-ONLY)
// -----------------------------------------------------------------------------

/**
 * Fetches user's watch history.
 * LOCKED RULE 9: Watch History is read-only from live_room_history — no new writes in this prompt.
 */
export async function getWatchHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ history: WatchHistoryItem[]; total: number; page: number; limit: number; totalPages: number }> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const countRes = await query<any>(
    `SELECT COUNT(*)::int AS total FROM popolive.live_room_history WHERE user_id = $1`,
    [userId]
  );
  const total = Number(countRes[0]?.total || 0);

  const rows = await query<any>(
    `SELECT id, room_id, user_id, host_id, host_nickname, title, cover_url,
            watched_at, duration_seconds, replay_url, is_replay_available
     FROM popolive.live_room_history
     WHERE user_id = $1
     ORDER BY watched_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, safeLimit, offset]
  );

  const history: WatchHistoryItem[] = rows.map((r) => ({
    id: r.id,
    roomId: r.room_id,
    userId: r.user_id,
    hostId: r.host_id,
    hostNickname: r.host_nickname,
    title: r.title,
    coverUrl: r.cover_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    watchedAt: r.watched_at ? new Date(r.watched_at).toISOString() : '',
    durationSeconds: Number(r.duration_seconds || 0),
    replayUrl: r.replay_url || '',
    isReplayAvailable: Boolean(r.is_replay_available),
  }));

  return {
    history,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}
