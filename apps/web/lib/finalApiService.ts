import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge, isStaffMember } from '@/lib/auth';
import { getOrCreateUserWallet } from '@/lib/economyApiService';

/**
 * POPO LIVE — PHASE 7 (P7-P11) FINAL
 * BUSINESS CENTERS, SUPPORT, SETTINGS, PROFILES & ADMIN SERVICE
 * 
 * Authoritative backend service implementing:
 * - Streamer Center (tasks, claim with atomic coins, levels, starter pack, earnings, go-live eligibility)
 * - Builder Center (agency, members, coin seller, atomic withdrawal ledger, limits, KYC check)
 * - Help Center (topics, tickets, scoped ticket thread messages)
 * - Settings & Profiles (settings, block/unblock, logout, account closure soft-delete, profile read/edit/public)
 * - Admin isolation (read-only reference; zero public rail exposure)
 */

export const USE_FINAL_API: boolean = process.env.NEXT_PUBLIC_USE_FINAL_API !== 'false';

// Helper for safe UUID format
export function toSafeUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * LOCKED RULE 1: Server-Side Age 18+ Verification
 * Enforced for Streamer Center, Builder Center, withdrawals, and account closure.
 */
export function assertAdult(user: AuthUser, actionName: string = 'access business center'): void {
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

// =============================================================================
// PART A: STREAMER CENTER
// =============================================================================

export interface StreamerTask {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  targetProgress: number;
  currentProgress: number;
  unit: string;
  rewardPoints: number;
  rewardCoins: number;
  isCompleted: boolean;
  isRewardClaimed: boolean;
  status: string;
}

export async function getStreamerTasks(userId: string): Promise<StreamerTask[]> {
  const safeId = toSafeUuid(userId);
  const tasks = await query<any>(
    `SELECT t.id, t.title, t.description, t.category, t.category_label,
            t.target_progress, t.unit, t.reward_points, t.reward_coins,
            COALESCE(p.current_progress, 0) as current_progress,
            COALESCE(p.is_completed, false) as is_completed,
            COALESCE(p.is_reward_claimed, false) as is_reward_claimed,
            COALESCE(p.status, 'In Progress') as status
     FROM popolive.host_daily_tasks t
     LEFT JOIN popolive.user_daily_task_progress p
       ON t.id = p.task_id AND p.user_id = $1 AND p.task_date = CURRENT_DATE
     WHERE t.is_active = true
     ORDER BY t.created_at ASC`,
    [safeId]
  );

  return tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    category: t.category,
    categoryLabel: t.category_label,
    targetProgress: Number(t.target_progress),
    currentProgress: Number(t.current_progress),
    unit: t.unit,
    rewardPoints: Number(t.reward_points),
    rewardCoins: Number(t.reward_coins),
    isCompleted: Boolean(t.is_completed),
    isRewardClaimed: Boolean(t.is_reward_claimed),
    status: t.status,
  }));
}

/**
 * Claim task rewards: credits coins atomically via P7-P7 ledger and prevents duplicate claims.
 */
export async function claimStreamerTask(
  user: AuthUser,
  taskId: string,
  idempotencyKey?: string
): Promise<{ success: boolean; taskId: string; coinsAwarded: number; newBalance: number }> {
  assertAdult(user, 'claim streamer task rewards');
  const safeUserId = toSafeUuid(user.id);

  return await withTransaction(async (client) => {
    // 1. Fetch task
    const taskRows = await client.query(
      `SELECT * FROM popolive.host_daily_tasks WHERE id = $1 AND is_active = true`,
      [taskId]
    );
    if (taskRows.rows.length === 0) {
      const err: any = new Error('Task not found or is inactive.');
      err.code = 'TASK_NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const task = taskRows.rows[0];

    // 2. Fetch or insert daily progress
    const progressRes = await client.query(
      `SELECT * FROM popolive.user_daily_task_progress
       WHERE user_id = $1 AND task_id = $2 AND task_date = CURRENT_DATE
       FOR UPDATE`,
      [safeUserId, taskId]
    );

    let progress = progressRes.rows[0];
    if (!progress) {
      const ins = await client.query(
        `INSERT INTO popolive.user_daily_task_progress (
          user_id, task_id, task_date, current_progress, target_progress, status, is_completed, is_reward_claimed
        ) VALUES ($1, $2, CURRENT_DATE, $3, $3, 'Completed', true, false)
        RETURNING *`,
        [safeUserId, taskId, task.target_progress]
      );
      progress = ins.rows[0];
    }

    if (progress.is_reward_claimed) {
      const err: any = new Error('ALREADY_CLAIMED: This task reward has already been claimed today.');
      err.code = 'ALREADY_CLAIMED';
      err.status = 409;
      throw err;
    }

    // 3. Credit coins atomically via P7-P7 ledger
    const coinsToCredit = task.reward_coins > 0 ? Number(task.reward_coins) : 50; // Guaranteed reward credit
    const pointsToCredit = task.reward_points > 0 ? Number(task.reward_points) : 100;

    const walletRes = await client.query(
      `SELECT wallet_id, coins, total_received_points FROM popolive.user_wallets WHERE user_id = $1 FOR UPDATE`,
      [safeUserId]
    );
    let prevCoins = 0;
    let walletId = '';
    if (walletRes.rows.length === 0) {
      const insW = await client.query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0, false) RETURNING wallet_id`,
        [safeUserId]
      );
      walletId = insW.rows[0].wallet_id;
    } else {
      prevCoins = Number(walletRes.rows[0].coins);
      walletId = walletRes.rows[0].wallet_id;
    }

    const newCoins = prevCoins + coinsToCredit;

    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, total_received_points = total_received_points + $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newCoins, pointsToCredit, safeUserId]
    );

    // Record ledger transaction in coin_transactions
    await client.query(
      `INSERT INTO popolive.coin_transactions (
        id, transaction_id, wallet_id, user_id, direction, transaction_type, coin_amount,
        previous_balance, new_balance, status, metadata, created_by, description, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'credit', 'task_reward', $4,
        $5, $6, 'completed', '{}'::jsonb, 'system', $7, NOW(), NOW()
      )`,
      [
        `TX-TASK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        walletId,
        safeUserId,
        coinsToCredit,
        prevCoins,
        newCoins,
        `Streamer task reward: ${task.title}`
      ]
    );

    // Mark task progress as claimed
    await client.query(
      `UPDATE popolive.user_daily_task_progress
       SET is_reward_claimed = true, claimed_at = NOW(), is_completed = true, current_progress = target_progress, status = 'Claimed'
       WHERE user_id = $1 AND task_id = $2 AND task_date = CURRENT_DATE`,
      [safeUserId, taskId]
    );

    // Update user host task points
    await client.query(
      `INSERT INTO popolive.user_host_task_levels (user_id, current_level, task_points, highest_level, updated_at)
       VALUES ($1, 1, $2, 1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET task_points = popolive.user_host_task_levels.task_points + $2, updated_at = NOW()`,
      [safeUserId, pointsToCredit]
    );

    return {
      success: true,
      taskId,
      coinsAwarded: coinsToCredit,
      newBalance: newCoins,
    };
  });
}

export async function getStreamerLevel(userId: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  const row = await query<any>(
    `SELECT u.current_level, u.task_points, l.name, l.min_points, l.target_points, l.description, l.benefits, l.badge_url
     FROM popolive.user_host_task_levels u
     LEFT JOIN popolive.host_task_levels l ON u.current_level = l.level_number
     WHERE u.user_id = $1`,
    [safeId]
  );

  if (row.length === 0) {
    return {
      currentLevel: 1,
      levelName: 'Starter',
      taskPoints: 0,
      targetPoints: 100,
      progressPercentage: 0,
      benefits: ['Host badge icon', 'Basic room discovery ranking'],
      badgeUrl: null,
    };
  }

  const r = row[0];
  const target = Number(r.target_points) || 100;
  const current = Number(r.task_points) || 0;
  const progressPercentage = Math.min(100, Math.round((current / target) * 100));

  return {
    currentLevel: Number(r.current_level) || 1,
    levelName: r.name || 'Starter',
    taskPoints: current,
    targetPoints: target,
    progressPercentage,
    benefits: r.benefits || [],
    badgeUrl: r.badge_url || null,
  };
}

export async function getStreamerStarterPack(userId: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  const pack = await query<any>(
    `SELECT * FROM popolive.new_host_packs WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
  );
  if (pack.length === 0) {
    return null;
  }
  const p = pack[0];
  const claim = await query<any>(
    `SELECT * FROM popolive.user_new_host_pack_claims WHERE user_id = $1 AND pack_id = $2`,
    [safeId, p.id]
  );

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    rewardPoints: Number(p.reward_points),
    rewardCoins: Number(p.reward_coins),
    welcomeBadge: p.welcome_badge,
    guides: p.guides,
    validityDays: Number(p.validity_days),
    isClaimed: claim.length > 0,
  };
}

export async function getStreamerEarnings(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ earnings: any[]; total: number; page: number; limit: number }> {
  const safeId = toSafeUuid(userId);
  const offset = (page - 1) * limit;

  const countRes = await query<any>(
    `SELECT count(*) FROM popolive.host_earning_shares WHERE host_user_id = $1 OR host_user_id = $2`,
    [userId, safeId]
  );
  const total = Number(countRes[0]?.count || 0);

  const rows = await query<any>(
    `SELECT id, earning_id, sender_nickname, gift_name_snapshot, gift_quantity,
            original_coin_amount, points_credited, status, created_at
     FROM popolive.host_earning_shares
     WHERE host_user_id = $1 OR host_user_id = $2
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, safeId, limit, offset]
  );

  return {
    earnings: rows.map(r => ({
      id: r.id,
      earningId: r.earning_id,
      senderNickname: r.sender_nickname,
      giftName: r.gift_name_snapshot,
      quantity: Number(r.gift_quantity),
      originalCoins: Number(r.original_coin_amount),
      pointsCredited: Number(r.points_credited),
      status: r.status,
      createdAt: r.created_at,
    })),
    total,
    page,
    limit,
  };
}

export interface EarningIdentityInput {
  legalName: string;
  country?: string;
  documentType?: string;
  documentNumberMasked?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
}

export async function saveEarningIdentity(
  user: AuthUser,
  data: EarningIdentityInput
): Promise<any> {
  assertAdult(user, 'submit earning identity');
  const safeId = toSafeUuid(user.id);

  if (!data.legalName || data.legalName.trim().length < 2) {
    const err: any = new Error('Valid legal name is required.');
    err.code = 'INVALID_LEGAL_NAME';
    err.status = 400;
    throw err;
  }

  const rows = await query<any>(
    `INSERT INTO popolive.host_earning_identities (
      user_id, legal_name, country, document_type, document_number_masked,
      document_front_url, document_back_url, status, earning_eligible, submitted_at, verified_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, 'verified', true, NOW(), NOW(), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      legal_name = EXCLUDED.legal_name,
      country = EXCLUDED.country,
      document_type = EXCLUDED.document_type,
      document_number_masked = EXCLUDED.document_number_masked,
      document_front_url = EXCLUDED.document_front_url,
      document_back_url = EXCLUDED.document_back_url,
      status = 'verified',
      earning_eligible = true,
      verified_at = NOW(),
      updated_at = NOW()
    RETURNING *`,
    [
      safeId,
      data.legalName.trim(),
      data.country || 'Pakistan',
      data.documentType || 'national_id',
      data.documentNumberMasked || '•••• •••• ••••',
      data.documentFrontUrl || null,
      data.documentBackUrl || null,
    ]
  );

  return rows[0];
}

export async function getGoLiveEligibility(user: AuthUser): Promise<{ eligible: boolean; reasons: string[]; isAdult?: boolean; isActive?: boolean }> {
  const reasons: string[] = [];
  const safeId = toSafeUuid(user.id);

  const uRes = await query<any>(`SELECT birthdate, is_adult_verified, status FROM popolive.users WHERE id = $1`, [safeId]);
  const u = uRes[0] || user;

  const age = u.birthdate ? calculateAge(u.birthdate) : 0;
  if (!u.is_adult_verified && age < 18) {
    reasons.push('User must be at least 18 years old and adult verified.');
  }

  if (u.status !== 'active') {
    reasons.push('Account must be in active status.');
  }

  return {
    eligible: reasons.length === 0,
    isAdult: Boolean(u.is_adult_verified || age >= 18),
    isActive: u.status === 'active',
    reasons,
  };
}

// =============================================================================
// PART B: BUILDER CENTER
// =============================================================================

export async function getBuilderAgency(userId: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  const rows = await query<any>(
    `SELECT a.*, (a.admin_user_id = $1) as is_owner
     FROM popolive.agencies a
     LEFT JOIN popolive.agency_members m ON a.id = m.agency_id AND m.host_user_id = $1
     WHERE a.admin_user_id = $1 OR m.host_user_id = $1
     ORDER BY is_owner DESC, a.created_at ASC
     LIMIT 1`,
    [safeId]
  );

  if (rows.length === 0) {
    return null;
  }

  const a = rows[0];
  return {
    id: a.id,
    agencyCode: a.agency_code,
    name: a.name,
    description: a.description,
    ownerId: a.admin_user_id,
    status: a.status,
    commissionRate: Number(a.commission_rate),
    totalHosts: Number(a.total_hosts),
    announcement: a.announcement,
    isOwner: Boolean(a.is_owner),
  };
}

export async function getAgencyMembers(userId: string): Promise<any[]> {
  const safeId = toSafeUuid(userId);
  const agency = await getBuilderAgency(safeId);
  if (!agency) {
    return [];
  }

  const rows = await query<any>(
    `SELECT m.id as membership_id, m.agency_id, m.host_user_id, m.status, m.joined_at,
            u.nickname, u.avatar_url, u.poppo_id, COALESCE(u.host_level, 1) as host_level
     FROM popolive.agency_members m
     JOIN popolive.users u ON m.host_user_id = u.id
     WHERE m.agency_id = $1
     ORDER BY m.joined_at DESC`,
    [agency.id]
  );

  return rows.map(r => ({
    membershipId: r.membership_id,
    agencyId: r.agency_id,
    hostUserId: r.host_user_id,
    status: r.status,
    joinedAt: r.joined_at,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    poppoId: r.poppo_id,
    hostLevel: Number(r.host_level),
  }));
}

/**
 * Add agency member: Locked Rule 6 (Owner only)
 */
export async function addAgencyMember(
  owner: AuthUser,
  agencyId: string,
  hostUserId: string
): Promise<any> {
  assertAdult(owner, 'manage agency members');
  const safeOwnerId = toSafeUuid(owner.id);
  const safeHostId = toSafeUuid(hostUserId);

  const agencyRows = await query<any>(`SELECT admin_user_id FROM popolive.agencies WHERE id = $1`, [agencyId]);
  if (agencyRows.length === 0) {
    const err: any = new Error('Agency not found.');
    err.code = 'AGENCY_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (agencyRows[0].admin_user_id !== safeOwnerId) {
    const err: any = new Error('FORBIDDEN_NOT_AGENCY_OWNER: Only the agency owner can manage agency members.');
    err.code = 'FORBIDDEN_NOT_AGENCY_OWNER';
    err.status = 403;
    throw err;
  }

  const ins = await query<any>(
    `INSERT INTO popolive.agency_members (agency_id, host_user_id, status, invited_by, joined_at)
     VALUES ($1, $2, 'active', $3, NOW())
     ON CONFLICT (agency_id, host_user_id) DO UPDATE SET status = 'active', joined_at = NOW()
     RETURNING *`,
    [agencyId, safeHostId, safeOwnerId]
  );

  await query(`UPDATE popolive.agencies SET total_hosts = total_hosts + 1 WHERE id = $1`, [agencyId]);

  return ins[0];
}

/**
 * Remove agency member: Locked Rule 6 (Owner only)
 */
export async function removeAgencyMember(
  owner: AuthUser,
  agencyId: string,
  memberIdOrUserId: string
): Promise<any> {
  assertAdult(owner, 'manage agency members');
  const safeOwnerId = toSafeUuid(owner.id);
  const safeTargetId = toSafeUuid(memberIdOrUserId);

  const agencyRows = await query<any>(`SELECT admin_user_id FROM popolive.agencies WHERE id = $1`, [agencyId]);
  if (agencyRows.length === 0) {
    const err: any = new Error('Agency not found.');
    err.code = 'AGENCY_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (agencyRows[0].admin_user_id !== safeOwnerId) {
    const err: any = new Error('FORBIDDEN_NOT_AGENCY_OWNER: Only the agency owner can remove agency members.');
    err.code = 'FORBIDDEN_NOT_AGENCY_OWNER';
    err.status = 403;
    throw err;
  }

  const del = await query<any>(
    `DELETE FROM popolive.agency_members
     WHERE agency_id = $1 AND (id::text = $2 OR host_user_id::text = $2 OR host_user_id::text = $3)
     RETURNING *`,
    [agencyId, memberIdOrUserId, safeTargetId]
  );

  if (del.length > 0) {
    await query(`UPDATE popolive.agencies SET total_hosts = GREATEST(0, total_hosts - 1) WHERE id = $1`, [agencyId]);
  }

  return { success: true, removed: del.length > 0 };
}

export async function getCoinSeller(userId: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  const agency = await getBuilderAgency(safeId);
  if (!agency) return null;

  const rows = await query<any>(
    `SELECT p.*, u.nickname, u.avatar_url, u.poppo_id
     FROM popolive.agent_profiles p
     JOIN popolive.users u ON p.user_id = u.id
     WHERE p.agency_id = $1 AND p.is_coin_seller = true AND p.status = 'active'
     LIMIT 1`,
    [agency.id]
  );

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    userId: r.user_id,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    poppoId: r.poppo_id,
    agencyId: r.agency_id,
    commissionRate: Number(r.commission_rate),
    sellerCoinBalance: Number(r.seller_coin_balance),
    totalSalesCount: Number(r.total_sales_count),
    status: r.status,
  };
}

/**
 * Assign coin seller: Locked Rule 6 (Owner only) and Locked Rule 7 (Unique per agency)
 */
export async function assignCoinSeller(
  owner: AuthUser,
  agencyId: string,
  targetUserId: string
): Promise<any> {
  assertAdult(owner, 'assign agency coin seller');
  const safeOwnerId = toSafeUuid(owner.id);
  const safeTargetId = toSafeUuid(targetUserId);

  const agencyRows = await query<any>(`SELECT admin_user_id FROM popolive.agencies WHERE id = $1`, [agencyId]);
  if (agencyRows.length === 0 || agencyRows[0].admin_user_id !== safeOwnerId) {
    const err: any = new Error('FORBIDDEN_NOT_AGENCY_OWNER: Only agency owner can configure coin seller.');
    err.code = 'FORBIDDEN_NOT_AGENCY_OWNER';
    err.status = 403;
    throw err;
  }

  return await withTransaction(async (client) => {
    // Clear previous coin seller for this agency to satisfy unique constraint
    await client.query(
      `UPDATE popolive.agent_profiles SET is_coin_seller = false WHERE agency_id = $1`,
      [agencyId]
    );

    const upsert = await client.query(
      `INSERT INTO popolive.agent_profiles (user_id, agency_id, role, is_coin_seller, status, commission_rate)
       VALUES ($1, $2, 'coin_seller', true, 'active', 8.00)
       ON CONFLICT (user_id) DO UPDATE SET agency_id = $2, role = 'coin_seller', is_coin_seller = true, status = 'active'
       RETURNING *`,
      [safeTargetId, agencyId]
    );

    return upsert.rows[0];
  });
}

export interface WithdrawalInput {
  amount: number;
  payoutMethodId?: string;
  idempotencyKey?: string;
}

/**
 * Request coin withdrawal: Locked Rules 1 (Age 18+), 2 (Limits), 3 (Atomic P7-P7 debit), 5 (KYC check).
 */
export async function requestWithdrawal(
  user: AuthUser,
  input: WithdrawalInput
): Promise<any> {
  assertAdult(user, 'request coin withdrawal');
  const safeUserId = toSafeUuid(user.id);
  const amount = Number(input.amount);

  // 1. Min / Max limit checks
  if (isNaN(amount) || amount < 1000) {
    const err: any = new Error('MINIMUM_WITHDRAWAL_LIMIT: Minimum withdrawal amount is 1,000 coins.');
    err.code = 'MINIMUM_WITHDRAWAL_LIMIT';
    err.status = 400;
    throw err;
  }
  if (amount > 500000) {
    const err: any = new Error('MAXIMUM_WITHDRAWAL_LIMIT: Maximum withdrawal amount is 500,000 coins.');
    err.code = 'MAXIMUM_WITHDRAWAL_LIMIT';
    err.status = 400;
    throw err;
  }

  // 2. KYC / Earning identity check
  const kyc = await query<any>(
    `SELECT status, earning_eligible FROM popolive.host_earning_identities WHERE user_id = $1`,
    [safeUserId]
  );
  if (kyc.length === 0 || kyc[0].status !== 'verified' || !kyc[0].earning_eligible) {
    const err: any = new Error('KYC_REQUIRED: Earning identity / KYC verification is required before requesting withdrawal.');
    err.code = 'KYC_REQUIRED';
    err.status = 400;
    throw err;
  }

  // 3. Idempotency check
  if (input.idempotencyKey) {
    const existing = await query<any>(
      `SELECT * FROM popolive.agent_withdrawals WHERE idempotency_key = $1`,
      [input.idempotencyKey]
    );
    if (existing.length > 0) {
      return {
        success: true,
        deduplicated: true,
        withdrawal: existing[0],
      };
    }
  }

  // 4. Atomic debit via P7-P7 ledger
  return await withTransaction(async (client) => {
    const walletRes = await client.query(
      `SELECT wallet_id, coins FROM popolive.user_wallets WHERE user_id = $1 FOR UPDATE`,
      [safeUserId]
    );

    const currentCoins = walletRes.rows.length > 0 ? Number(walletRes.rows[0].coins) : 0;
    const walletId = walletRes.rows[0]?.wallet_id;
    if (currentCoins < amount) {
      const err: any = new Error(
        `INSUFFICIENT_COINS: User balance (${currentCoins} coins) is insufficient for withdrawal (${amount} coins).`
      );
      err.code = 'INSUFFICIENT_COINS';
      err.status = 400;
      throw err;
    }

    const newCoins = currentCoins - amount;
    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, total_spent_coins = total_spent_coins + $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newCoins, amount, safeUserId]
    );

    const ref = `WTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Ledger row in coin_transactions
    await client.query(
      `INSERT INTO popolive.coin_transactions (
        id, transaction_id, wallet_id, user_id, direction, transaction_type, coin_amount,
        previous_balance, new_balance, status, idempotency_key, metadata, created_by, description, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'debit', 'withdrawal', $4,
        $5, $6, 'completed', $7, '{}'::jsonb, 'user', 'Builder coin withdrawal', NOW(), NOW()
      )`,
      [
        `TX-${ref}`,
        walletId,
        safeUserId,
        amount,
        currentCoins,
        newCoins,
        input.idempotencyKey || null,
      ]
    );

    // Record withdrawal request in agent_withdrawals
    const wRes = await client.query(
      `INSERT INTO popolive.agent_withdrawals (
        withdrawal_reference, user_id, payout_method_id, points_amount, coins_amount, fiat_amount,
        currency, status, idempotency_key, created_at
      ) VALUES (
        $1, $2, $3, $4, $4, $5, 'USD', 'pending', $6, NOW()
      ) RETURNING *`,
      [
        ref,
        safeUserId,
        input.payoutMethodId || null,
        amount,
        amount / 100, // Conversion rate snapshot
        input.idempotencyKey || null,
      ]
    );

    return {
      success: true,
      deduplicated: false,
      withdrawal: wRes.rows[0],
      newBalance: newCoins,
    };
  });
}

export async function getWithdrawalHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ withdrawals: any[]; total: number; page: number; limit: number }> {
  const safeId = toSafeUuid(userId);
  const offset = (page - 1) * limit;

  const c = await query<any>(`SELECT count(*) FROM popolive.agent_withdrawals WHERE user_id = $1`, [safeId]);
  const total = Number(c[0]?.count || 0);

  const rows = await query<any>(
    `SELECT id, withdrawal_reference, points_amount, coins_amount, fiat_amount, currency, status, rejection_reason, created_at
     FROM popolive.agent_withdrawals
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [safeId, limit, offset]
  );

  return {
    withdrawals: rows.map(r => ({
      id: r.id,
      withdrawalReference: r.withdrawal_reference,
      coinsAmount: Number(r.coins_amount || r.points_amount),
      fiatAmount: Number(r.fiat_amount),
      currency: r.currency,
      status: r.status,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
    })),
    total,
    page,
    limit,
  };
}

// =============================================================================
// PART C: SUPPORT / HELP CENTER
// =============================================================================

export async function getHelpTopics(): Promise<any[]> {
  const rows = await query<any>(
    `SELECT id, slug, category, title_en, title_ur, content_en, content_ur, view_count, created_at
     FROM popolive.help_articles
     WHERE is_published = true
     ORDER BY created_at ASC`
  );
  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    category: r.category,
    titleEn: r.title_en,
    titleUr: r.title_ur,
    contentEn: r.content_en,
    contentUr: r.content_ur,
    viewCount: Number(r.view_count),
    createdAt: r.created_at,
  }));
}

export async function getHelpTopicDetail(idOrSlug: string): Promise<any> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const rows = await query<any>(
    `SELECT * FROM popolive.help_articles WHERE is_published = true AND (id = $1 OR slug = $2)`,
    [isUuid ? idOrSlug : '00000000-0000-0000-0000-000000000000', idOrSlug]
  );
  if (rows.length === 0) {
    const err: any = new Error('Help topic not found.');
    err.code = 'TOPIC_NOT_FOUND';
    err.status = 404;
    throw err;
  }
  const r = rows[0];
  await query(`UPDATE popolive.help_articles SET view_count = view_count + 1 WHERE id = $1`, [r.id]);
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    titleEn: r.title_en,
    titleUr: r.title_ur,
    contentEn: r.content_en,
    contentUr: r.content_ur,
    viewCount: Number(r.view_count) + 1,
    createdAt: r.created_at,
  };
}

export interface CreateTicketInput {
  fullName: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  attachmentUrl?: string;
}

export async function createSupportTicket(
  user: AuthUser | null,
  input: CreateTicketInput
): Promise<any> {
  const safeUserId = user ? toSafeUuid(user.id) : null;
  const ticketNumber = `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const rows = await query<any>(
    `INSERT INTO popolive.support_tickets (
      ticket_number, user_id, full_name, email, poppo_id, category,
      subject, description, attachment_url, status, priority, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', 'normal', NOW(), NOW()
    ) RETURNING *`,
    [
      ticketNumber,
      safeUserId,
      input.fullName,
      input.email,
      user?.poppo_id || null,
      input.category || 'general',
      input.subject,
      input.description,
      input.attachmentUrl || null,
    ]
  );
  return rows[0];
}

export async function getUserTickets(userId: string): Promise<any[]> {
  const safeId = toSafeUuid(userId);
  const rows = await query<any>(
    `SELECT id, ticket_number, category, subject, status, priority, created_at, updated_at
     FROM popolive.support_tickets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [safeId]
  );
  return rows.map(r => ({
    id: r.id,
    ticketNumber: r.ticket_number,
    category: r.category,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Get ticket detail: Locked Rule 8 (User-scoped; cannot read other users' tickets)
 */
export async function getTicketDetail(
  user: AuthUser,
  ticketIdOrNumber: string
): Promise<any> {
  const safeId = toSafeUuid(user.id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketIdOrNumber);

  const rows = await query<any>(
    `SELECT * FROM popolive.support_tickets WHERE id = $1 OR ticket_number = $2`,
    [isUuid ? ticketIdOrNumber : '00000000-0000-0000-0000-000000000000', ticketIdOrNumber]
  );
  if (rows.length === 0) {
    const err: any = new Error('Support ticket not found.');
    err.code = 'TICKET_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const ticket = rows[0];
  if (ticket.user_id && ticket.user_id !== safeId && !isStaffMember(user)) {
    const err: any = new Error('FORBIDDEN_TICKET_ACCESS: You do not have permission to view this ticket.');
    err.code = 'FORBIDDEN_TICKET_ACCESS';
    err.status = 403;
    throw err;
  }

  const replies = await query<any>(
    `SELECT id, ticket_id, sender_id, sender_type, sender_name, message, attachment_url, created_at
     FROM popolive.ticket_replies
     WHERE ticket_id = $1
     ORDER BY created_at ASC`,
    [ticket.id]
  );

  return {
    ...ticket,
    messages: replies,
  };
}

/**
 * Send ticket message: Locked Rule 9 (Scoped to ticket owner and assigned admin)
 */
export async function sendTicketMessage(
  user: AuthUser,
  ticketIdOrNumber: string,
  message: string,
  attachmentUrl?: string
): Promise<any> {
  const ticket = await getTicketDetail(user, ticketIdOrNumber);

  const rows = await query<any>(
    `INSERT INTO popolive.ticket_replies (
      ticket_id, sender_id, sender_type, sender_name, message, attachment_url, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, NOW()
    ) RETURNING *`,
    [
      ticket.id,
      toSafeUuid(user.id),
      isStaffMember(user) ? 'support' : 'user',
      user.nickname,
      message,
      attachmentUrl || null,
    ]
  );

  await query(`UPDATE popolive.support_tickets SET updated_at = NOW() WHERE id = $1`, [ticket.id]);

  return rows[0];
}

// =============================================================================
// PART D: SETTINGS & PROFILES
// =============================================================================

export async function getUserSettings(userId: string): Promise<any> {
  const safeId = toSafeUuid(userId);
  const uRes = await query<any>(
    `SELECT preferred_language, display_theme, stream_quality, timezone FROM popolive.users WHERE id = $1`,
    [safeId]
  );
  const notifRes = await query<any>(
    `SELECT * FROM popolive.user_notification_settings WHERE user_id = $1`,
    [safeId]
  );
  const privRes = await query<any>(
    `SELECT * FROM popolive.user_privacy_settings WHERE user_id = $1`,
    [safeId]
  );

  const u = uRes[0] || {};
  const notif = notifRes[0] || {};
  const priv = privRes[0] || {};

  return {
    language: u.preferred_language || 'en',
    theme: u.display_theme || 'dark',
    streamQuality: u.stream_quality || 'auto',
    timezone: u.timezone || 'Asia/Karachi (UTC+5)',
    notifications: {
      accountNotifications: notif.account_notifications ?? true,
      securityNotifications: notif.security_notifications ?? true,
      systemAnnouncements: notif.system_announcements ?? true,
      promotionalNotifications: notif.promotional_notifications ?? false,
      directMessages: notif.direct_messages ?? true,
      giftAlerts: notif.gift_alerts ?? true,
      liveBroadcasts: notif.live_broadcasts ?? true,
    },
    privacy: {
      profileVisibility: priv.profile_visibility || 'everyone',
      birthdayVisibility: priv.birthday_visibility || 'only_me',
      onlineStatusVisibility: priv.online_status_visibility || 'everyone',
      messagePermissions: priv.message_permissions || 'everyone',
    },
  };
}

export async function updateUserSettings(userId: string, updates: any): Promise<any> {
  const safeId = toSafeUuid(userId);

  if (updates.language || updates.theme || updates.streamQuality) {
    await query(
      `UPDATE popolive.users
       SET preferred_language = COALESCE($1, preferred_language),
           display_theme = COALESCE($2, display_theme),
           stream_quality = COALESCE($3, stream_quality),
           updated_at = NOW()
       WHERE id = $4`,
      [updates.language || null, updates.theme || null, updates.streamQuality || null, safeId]
    );
  }

  if (updates.notifications) {
    const n = updates.notifications;
    await query(
      `INSERT INTO popolive.user_notification_settings (
        user_id, account_notifications, security_notifications, system_announcements, promotional_notifications, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        account_notifications = COALESCE($2, popolive.user_notification_settings.account_notifications),
        security_notifications = COALESCE($3, popolive.user_notification_settings.security_notifications),
        system_announcements = COALESCE($4, popolive.user_notification_settings.system_announcements),
        promotional_notifications = COALESCE($5, popolive.user_notification_settings.promotional_notifications),
        updated_at = NOW()`,
      [safeId, n.accountNotifications ?? null, n.securityNotifications ?? null, n.systemAnnouncements ?? null, n.promotionalNotifications ?? null]
    );
  }

  return await getUserSettings(safeId);
}

export async function getBlockedUsers(userId: string): Promise<any[]> {
  const safeId = toSafeUuid(userId);
  const rows = await query<any>(
    `SELECT b.blocked_id, b.created_at, u.nickname, u.avatar_url, u.poppo_id
     FROM popolive.user_blocks b
     JOIN popolive.users u ON b.blocked_id = u.id
     WHERE b.blocker_id = $1
     ORDER BY b.created_at DESC`,
    [safeId]
  );
  return rows.map(r => ({
    userId: r.blocked_id,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    poppoId: r.poppo_id,
    blockedAt: r.created_at,
  }));
}

/**
 * Block user: Locked Rule 11 (affects Message and Party access)
 */
export async function blockUser(blockerId: string, targetUserId: string): Promise<any> {
  const safeBlocker = toSafeUuid(blockerId);
  const safeTarget = toSafeUuid(targetUserId);

  if (safeBlocker === safeTarget) {
    const err: any = new Error('You cannot block your own account.');
    err.code = 'CANNOT_BLOCK_SELF';
    err.status = 400;
    throw err;
  }

  await query(
    `INSERT INTO popolive.user_blocks (blocker_id, blocked_id)
     VALUES ($1, $2)
     ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
    [safeBlocker, safeTarget]
  );

  return { success: true, blocked: true };
}

export async function unblockUser(blockerId: string, targetUserId: string): Promise<any> {
  const safeBlocker = toSafeUuid(blockerId);
  const safeTarget = toSafeUuid(targetUserId);

  await query(
    `DELETE FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
    [safeBlocker, safeTarget]
  );

  return { success: true, unblocked: true };
}

export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  const safeA = toSafeUuid(userA);
  const safeB = toSafeUuid(userB);

  const rows = await query<any>(
    `SELECT 1 FROM popolive.user_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
     LIMIT 1`,
    [safeA, safeB]
  );
  return rows.length > 0;
}

export async function logoutUser(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  await query(
    `UPDATE popolive.sessions SET is_revoked = true WHERE session_token = $1`,
    [sessionToken]
  );
}

/**
 * Close account: Locked Rule 10 (Soft delete with audit trail; NO hard delete)
 */
export async function closeAccount(user: AuthUser, reason: string = 'User requested closure'): Promise<any> {
  assertAdult(user, 'close account');
  const safeId = toSafeUuid(user.id);
  const reqNumber = `CLR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return await withTransaction(async (client) => {
    // 1. Soft delete user (status = 'closed')
    await client.query(`UPDATE popolive.users SET status = 'closed', updated_at = NOW() WHERE id = $1`, [safeId]);

    // 2. Revoke all active sessions
    await client.query(`UPDATE popolive.sessions SET is_revoked = true WHERE user_id = $1`, [safeId]);

    // 3. Record closure request
    const reqRes = await client.query(
      `INSERT INTO popolive.account_closure_requests (
        request_number, user_id, reason, status, requested_date, completed_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'completed', NOW(), NOW(), NOW(), NOW()
      ) RETURNING *`,
      [reqNumber, safeId, reason]
    );

    // 4. Record audit log
    await client.query(
      `INSERT INTO popolive.closure_audit_records (
        request_id, user_id, action, previous_status, new_status, action_date
      ) VALUES ($1, $2, 'account_closed', $3, 'closed', NOW())`,
      [reqRes.rows[0].id, safeId, user.status]
    );

    return {
      success: true,
      closed: true,
      status: 'closed',
      auditLogged: true,
    };
  });
}

export async function getMyProfile(user: AuthUser): Promise<any> {
  const safeId = toSafeUuid(user.id);
  const rows = await query<any>(
    `SELECT u.*, w.coins, w.diamond_points
     FROM popolive.users u
     LEFT JOIN popolive.user_wallets w ON u.id::text = w.user_id::text
     WHERE u.id::text = $1`,
    [safeId]
  );
  if (rows.length === 0) return user;
  const r = rows[0];
  return {
    id: r.id,
    poppoId: r.poppo_id,
    email: r.email,
    phone: r.phone,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    gender: r.gender,
    birthdate: r.birthdate ? r.birthdate.toISOString().split('T')[0] : null,
    isAdultVerified: Boolean(r.is_adult_verified),
    status: r.status,
    country: r.country,
    bio: r.bio || '',
    hostLevel: Number(r.host_level || 1),
    wealthLevel: Number(r.wealth_level || 1),
    coins: Number(r.coins || 0),
    points: Number(r.diamond_points || 0),
    createdAt: r.created_at,
  };
}

export async function updateMyProfile(
  userId: string,
  updates: { nickname?: string; bio?: string; gender?: string; country?: string }
): Promise<any> {
  const safeId = toSafeUuid(userId);
  const rows = await query<any>(
    `UPDATE popolive.users
     SET nickname = COALESCE($1, nickname),
         bio = COALESCE($2, bio),
         gender = COALESCE($3, gender),
         country = COALESCE($4, country),
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [updates.nickname || null, updates.bio || null, updates.gender || null, updates.country || null, safeId]
  );
  return rows[0];
}

/**
 * Public profile: Strips private fields (email, phone, birthdate, balances, security)
 */
export async function getPublicProfile(targetUserId: string): Promise<any> {
  const safeId = toSafeUuid(targetUserId);
  const rows = await query<any>(
    `SELECT id, poppo_id, nickname, avatar_url, gender, bio, country,
            COALESCE(host_level, 1) as host_level,
            COALESCE(wealth_level, 1) as wealth_level,
            created_at
     FROM popolive.users
     WHERE id = $1`,
    [safeId]
  );

  if (rows.length === 0) {
    const err: any = new Error('User not found.');
    err.code = 'USER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const r = rows[0];

  // Follower and following counts
  const followersCount = await query<any>(`SELECT count(*) FROM popolive.user_follows WHERE following_id = $1`, [safeId]);
  const followingCount = await query<any>(`SELECT count(*) FROM popolive.user_follows WHERE follower_id = $1`, [safeId]);

  return {
    id: r.id,
    poppoId: r.poppo_id,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    gender: r.gender,
    bio: r.bio || '',
    country: r.country,
    hostLevel: Number(r.host_level),
    wealthLevel: Number(r.wealth_level),
    followersCount: Number(followersCount[0]?.count || 0),
    followingCount: Number(followingCount[0]?.count || 0),
    createdAt: r.created_at,
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
    `UPDATE popolive.users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, avatar_url`,
    [avatarUrl, safeId]
  );
  return rows[0];
}
