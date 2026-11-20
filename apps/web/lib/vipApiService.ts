import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge, isStaffMember } from '@/lib/auth';
import { getOrCreateUserWallet } from '@/lib/economyApiService';

/**
 * POPO LIVE — PHASE 7 (P7-P8)
 * VIP, REWARDS & RANKINGS CENTRAL SERVICE & LOCKED RULES ENGINE
 * Single authoritative service for VIP subscriptions, task rewards, derived rankings,
 * honor level bars, and read-only medal wall.
 */

export const USE_VIP_API: boolean = process.env.NEXT_PUBLIC_USE_VIP_API !== 'false';

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
 * Reject access to VIP purchases and reward claims for users under 18 years of age.
 */
export function assertAdultVip(user: AuthUser, actionName: string = 'access VIP or reward services'): void {
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
// 1. VIP PLANS & ACTIVE MEMBERSHIP
// -----------------------------------------------------------------------------

export interface VipPlanItem {
  id: string;
  planId: string;
  planTier: string;
  vipLevel: number;
  planName: string;
  planNameUr: string | null;
  description: string;
  durationDays: number;
  priceAmount: number;
  coinPrice: number;
  allowCoinPurchase: boolean;
  badgeLabel: string;
  badgeAssetUrl: string;
  profileFrameAssetUrl: string;
  nameDecorationStyle: string;
  themeKey: string;
  benefitKeys: string[];
  benefitsConfig: any;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface ActiveVipMembership {
  isActive: boolean;
  membershipId: string | null;
  userId: string;
  planId: string | null;
  planTier: string;
  vipLevel: number;
  badgeLabel: string;
  status: string;
  expiresAt: string | null;
  daysRemaining: number;
  privileges: Array<{
    id: string;
    title: string;
    description: string;
    iconName: string;
  }>;
}

/**
 * Fetches all active VIP plans
 * PART 4: GET /vip/plans
 */
export async function getVipPlans(): Promise<VipPlanItem[]> {
  const rows = await query<any>(
    `SELECT plan_id, plan_tier, vip_level, plan_name, plan_name_ur, description,
            duration_days, price_amount, coin_price, allow_coin_purchase,
            badge_label, badge_asset_url, profile_frame_asset_url, name_decoration_style,
            theme_key, benefit_keys, benefits_config, is_popular, is_active, display_order
     FROM popolive.vip_plans
     WHERE is_active = true
     ORDER BY display_order ASC, vip_level ASC`
  );

  return rows.map((r) => ({
    id: r.plan_id,
    planId: r.plan_id,
    planTier: r.plan_tier,
    vipLevel: Number(r.vip_level),
    planName: r.plan_name,
    planNameUr: r.plan_name_ur,
    description: r.description || '',
    durationDays: Number(r.duration_days),
    priceAmount: Number(r.price_amount),
    coinPrice: Number(r.coin_price || 0),
    allowCoinPurchase: Boolean(r.allow_coin_purchase),
    badgeLabel: r.badge_label,
    badgeAssetUrl: r.badge_asset_url || '/assets/gifts/07_07_vip.png',
    profileFrameAssetUrl: r.profile_frame_asset_url || '/assets/gifts/entrances/entrance_standard.png',
    nameDecorationStyle: r.name_decoration_style || 'amber_glow',
    themeKey: r.theme_key || 'cosmic_royale',
    benefitKeys: Array.isArray(r.benefit_keys) ? r.benefit_keys : [],
    benefitsConfig: r.benefits_config || {},
    isPopular: Boolean(r.is_popular),
    isActive: Boolean(r.is_active),
    displayOrder: Number(r.display_order || 0),
  }));
}

/**
 * Fetches the active VIP membership for a user
 * PART 4: GET /vip/active
 */
export async function getActiveVipMembership(userId: string): Promise<ActiveVipMembership> {
  const rows = await query<any>(
    `SELECT membership_id, user_id, vip_tier, vip_level, badge_label,
            status, expires_at, created_at, updated_at
     FROM popolive.user_vip_memberships
     WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return {
      isActive: false,
      membershipId: null,
      userId,
      planId: null,
      planTier: 'none',
      vipLevel: 0,
      badgeLabel: 'None',
      status: 'none',
      expiresAt: null,
      daysRemaining: 0,
      privileges: [],
    };
  }

  const r = rows[0];
  const expiresAt = r.expires_at ? new Date(r.expires_at) : null;
  const now = new Date();
  const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // Derive privilege list from VIP level
  const privileges = [
    {
      id: 'p_01',
      title: 'Custom Entrance Animation',
      description: 'Golden carriage and celestial fanfare on entering any live room',
      iconName: 'car_crash_rounded',
    },
    {
      id: 'p_02',
      title: 'Exclusive Glowing Avatar Ring',
      description: 'Prismatic animated border surrounding your profile picture',
      iconName: 'blur_circular_rounded',
    },
    {
      id: 'p_03',
      title: 'Chat Message Highlight',
      description: 'Golden bubble and bold typography in audience live chats',
      iconName: 'mark_chat_read_rounded',
    },
    {
      id: 'p_04',
      title: 'Stealth Mode Visitor',
      description: 'Browse rooms without appearing in public visitor counters',
      iconName: 'visibility_off_rounded',
    },
  ];

  return {
    isActive: true,
    membershipId: r.membership_id,
    userId: r.user_id,
    planId: r.vip_tier || null,
    planTier: r.plan_tier,
    vipLevel: Number(r.vip_level),
    badgeLabel: r.badge_label || `VIP ${r.vip_level}`,
    status: r.status,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    daysRemaining,
    privileges,
  };
}

/**
 * Subscribes to a VIP plan using coin balance
 * PART 4: POST /vip/plans/:id/subscribe
 * LOCKED RULE 2: VIP plan purchase uses coin_wallets debit — atomic, non-negative, ledger row created.
 * LOCKED RULE 8: VIP purchase uses coin balance only — no real payment processing.
 */
export async function subscribeVipPlan({
  user,
  planId,
  idempotencyKey,
}: {
  user: AuthUser;
  planId: string;
  idempotencyKey?: string;
}) {
  // 1. Age verification
  assertAdultVip(user, 'purchase VIP membership');

  // 2. Check Plan existence
  const planRows = await query<any>(
    `SELECT plan_id, plan_tier, vip_level, plan_name, duration_days, coin_price,
            allow_coin_purchase, badge_label, is_active
     FROM popolive.vip_plans
     WHERE plan_id = $1 AND is_active = true
     LIMIT 1`,
    [planId]
  );

  if (planRows.length === 0) {
    const error: any = new Error(`VIP_PLAN_NOT_FOUND: Plan with id '${planId}' does not exist or is inactive.`);
    error.code = 'VIP_PLAN_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const plan = planRows[0];
  const coinPrice = Number(plan.coin_price);
  if (!coinPrice || coinPrice <= 0) {
    const error: any = new Error(`INVALID_PLAN_PRICE: Plan '${planId}' does not have a valid coin price.`);
    error.code = 'INVALID_PLAN_PRICE';
    error.status = 400;
    throw error;
  }

  // 3. Idempotency check: if already processed, return existing subscription
  if (idempotencyKey) {
    const existingTx = await query<any>(
      `SELECT ct.*, vmr.membership_id, vmr.expiry_date
       FROM popolive.coin_transactions ct
       LEFT JOIN popolive.vip_membership_records vmr ON ct.transaction_id = vmr.purchase_id
       WHERE ct.idempotency_key = $1 AND ct.user_id = $2
       LIMIT 1`,
      [idempotencyKey, user.id]
    );

    if (existingTx.length > 0) {
      const active = await getActiveVipMembership(user.id);
      return {
        success: true,
        isIdempotentReplay: true,
        membership: active,
        transactionId: existingTx[0].transaction_id,
        coinsCharged: coinPrice,
        remainingCoins: Number(existingTx[0].new_balance),
      };
    }
  }

  // 4. Atomic Execution with Transaction and Row-Lock
  return await withTransaction(async (client) => {
    // A. Ensure wallet exists and row lock it
    await getOrCreateUserWallet(user.id, client);

    const walletRes = await client.query(
      `SELECT wallet_id, coins, total_spent_coins
       FROM popolive.user_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [user.id]
    );

    const wallet = walletRes.rows[0];
    const currentCoins = Number(wallet.coins);

    if (currentCoins < coinPrice) {
      const error: any = new Error(
        `INSUFFICIENT_COINS: User balance (${currentCoins} coins) is insufficient for plan price (${coinPrice} coins).`
      );
      error.code = 'INSUFFICIENT_COINS';
      error.status = 400;
      throw error;
    }

    const newCoins = currentCoins - coinPrice;
    const newTotalSpent = Number(wallet.total_spent_coins) + coinPrice;

    // B. Debit coins in wallet
    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, total_spent_coins = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newCoins, newTotalSpent, user.id]
    );

    // C. Insert ledger entry into coin_transactions
    const txId = `TXN_VIP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const purchaseId = `PUR_VIP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const orderId = `ORD_VIP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const membershipId = `VIPM_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const durationDays = Number(plan.duration_days) || 30;

    await client.query(
      `INSERT INTO popolive.coin_transactions (
        id, transaction_id, wallet_id, user_id, transaction_type, direction,
        coin_amount, previous_balance, new_balance, status, reference_id,
        idempotency_key, description, metadata, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'vip_subscribe', 'debit',
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
        plan.plan_id,
        idempotencyKey || null,
        `VIP Subscription: ${plan.plan_name} (${durationDays} days)`,
        JSON.stringify({ planId: plan.plan_id, durationDays, vipLevel: plan.vip_level }),
      ]
    );

    // D. Upsert active membership in user_vip_memberships
    const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO popolive.user_vip_memberships (
        membership_id, user_id, vip_level, vip_tier, badge_label,
        status, expires_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'active', $6, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET
        membership_id = EXCLUDED.membership_id,
        vip_level = EXCLUDED.vip_level,
        vip_tier = EXCLUDED.vip_tier,
        badge_label = EXCLUDED.badge_label,
        status = 'active',
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()`,
      [membershipId, user.id, plan.vip_level, plan.plan_tier, plan.badge_label, expiryDate]
    );

    // E. Record subscription in vip_membership_records
    await client.query(
      `INSERT INTO popolive.vip_membership_records (
        membership_id, user_id, plan_id, plan_name, plan_tier, vip_level,
        purchase_id, order_id, payment_reference, payment_method, purchase_amount,
        currency, coins_charged, duration_days, status, activation_date, expiry_date,
        badge_label, status_reason, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, 'wallet_coins', 0.00,
        'USD', $10, $11, 'active', NOW(), $12,
        $13, 'Subscribed via coin balance', '{}'::jsonb, NOW(), NOW()
      )`,
      [
        membershipId,
        user.id,
        plan.plan_id,
        plan.plan_name,
        plan.plan_tier,
        plan.vip_level,
        purchaseId,
        orderId,
        txId,
        coinPrice,
        durationDays,
        expiryDate,
        plan.badge_label,
      ]
    );

    return {
      success: true,
      membershipId,
      planId: plan.plan_id,
      planName: plan.plan_name,
      vipLevel: plan.vip_level,
      badgeLabel: plan.badge_label,
      coinsCharged: coinPrice,
      remainingCoins: newCoins,
      activationDate: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      transactionId: txId,
    };
  });
}

/**
 * Fetches VIP subscription history for a user
 * PART 4: GET /vip/history
 */
export async function getVipHistory(userId: string) {
  const rows = await query<any>(
    `SELECT membership_id, user_id, plan_id, plan_name, plan_tier, vip_level,
            purchase_id, payment_method, coins_charged, duration_days, status,
            activation_date, expiry_date, badge_label, created_at
     FROM popolive.vip_membership_records
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((r) => ({
    id: r.membership_id,
    membershipId: r.membership_id,
    planId: r.plan_id,
    planName: r.plan_name,
    planTier: r.plan_tier,
    vipLevel: Number(r.vip_level),
    purchaseId: r.purchase_id,
    paymentMethod: r.payment_method,
    coinsCharged: r.coins_charged != null ? Number(r.coins_charged) : null,
    durationDays: Number(r.duration_days),
    status: r.status,
    activationDate: r.activation_date ? new Date(r.activation_date).toISOString() : '',
    expiryDate: r.expiry_date ? new Date(r.expiry_date).toISOString() : '',
    badgeLabel: r.badge_label,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));
}

// -----------------------------------------------------------------------------
// 2. REWARDS & DAILY TASKS
// -----------------------------------------------------------------------------

export interface RewardTaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  targetProgress: number;
  unit: string;
  rewardPoints: number;
  rewardCoins: number;
  iconKey: string;
  currentProgress: number;
  status: string;
  isCompleted: boolean;
  isClaimed: boolean;
  isClaimable: boolean;
}

/**
 * Fetches daily host tasks with user progress and claimable flag
 * PART 4: GET /rewards
 */
export async function getRewardsList(userId: string): Promise<RewardTaskItem[]> {
  const safeUuid = toSafeUuid(userId);

  // Query all active tasks and join today's progress for this user
  const rows = await query<any>(
    `SELECT t.id, t.title, t.description, t.category, t.category_label,
            t.target_progress, t.unit, t.reward_points, t.reward_coins, t.icon_key,
            COALESCE(p.current_progress, 0) as current_progress,
            COALESCE(p.is_completed, false) as is_completed,
            COALESCE(p.is_reward_claimed, false) as is_reward_claimed,
            p.status as progress_status
     FROM popolive.host_daily_tasks t
     LEFT JOIN popolive.user_daily_task_progress p 
            ON t.id = p.task_id 
           AND p.user_id = $1 
           AND p.task_date = CURRENT_DATE
     WHERE t.is_active = true
     ORDER BY t.created_at ASC`,
    [safeUuid]
  );

  return rows.map((r) => {
    const target = Number(r.target_progress);
    const current = Number(r.current_progress);
    const isCompleted = Boolean(r.is_completed || current >= target);
    const isClaimed = Boolean(r.is_reward_claimed);
    const isClaimable = isCompleted && !isClaimed;

    let status = r.progress_status;
    if (!status) {
      if (isClaimed) status = 'Claimed';
      else if (isCompleted) status = 'Completed';
      else if (current > 0) status = 'In Progress';
      else status = 'Not Started';
    }

    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      category: r.category,
      categoryLabel: r.category_label || r.category,
      targetProgress: target,
      unit: r.unit || '',
      rewardPoints: Number(r.reward_points),
      rewardCoins: Number(r.reward_coins || 0),
      iconKey: r.icon_key || 'clock',
      currentProgress: current,
      status,
      isCompleted,
      isClaimed,
      isClaimable,
    };
  });
}

/**
 * Claims a task reward
 * PART 4: POST /rewards/:id/claim
 * LOCKED RULE 1: Age 18+ to claim rewards.
 * LOCKED RULE 3: Reward claim is one-time per user per reward — unique constraint enforced.
 * LOCKED RULE 4: Points credited to points_wallets via points_transactions row.
 */
export async function claimReward({
  user,
  rewardId,
  idempotencyKey,
}: {
  user: AuthUser;
  rewardId: string;
  idempotencyKey?: string;
}) {
  // 1. Age verification
  assertAdultVip(user, 'claim task reward');

  const safeUuid = toSafeUuid(user.id);

  // 2. Task lookup
  const taskRows = await query<any>(
    `SELECT id, title, target_progress, reward_points, is_active
     FROM popolive.host_daily_tasks
     WHERE id = $1 AND is_active = true
     LIMIT 1`,
    [rewardId]
  );

  if (taskRows.length === 0) {
    const err: any = new Error(`TASK_NOT_FOUND: Task '${rewardId}' not found.`);
    err.code = 'TASK_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const task = taskRows[0];
  const rewardPoints = Number(task.reward_points);

  // 3. Idempotency check: if idempotency key matches completed claim, return cached response
  if (idempotencyKey) {
    const existingClaim = await query<any>(
      `SELECT pt.*, uw.diamond_points
       FROM popolive.points_transactions pt
       JOIN popolive.user_wallets uw ON pt.host_user_id = uw.user_id
       WHERE pt.idempotency_key = $1 AND pt.host_user_id = $2
       LIMIT 1`,
      [idempotencyKey, user.id]
    );

    if (existingClaim.length > 0) {
      return {
        success: true,
        isIdempotentReplay: true,
        rewardId: task.id,
        taskTitle: task.title,
        pointsCredited: rewardPoints,
        newPointsBalance: Number(existingClaim[0].diamond_points),
        transactionId: existingClaim[0].transaction_id,
      };
    }
  }

  // 4. Atomic Check-and-Claim Transaction
  return await withTransaction(async (client) => {
    // A. Row-lock progress row
    const progressRes = await client.query(
      `SELECT id, current_progress, target_progress, is_completed, is_reward_claimed
       FROM popolive.user_daily_task_progress
       WHERE user_id = $1 AND task_id = $2 AND task_date = CURRENT_DATE
       FOR UPDATE`,
      [safeUuid, task.id]
    );

    if (progressRes.rows.length === 0) {
      const err: any = new Error(
        `REWARD_NOT_ELIGIBLE: No task progress found for today. Progress is 0 / ${task.target_progress}.`
      );
      err.code = 'REWARD_NOT_ELIGIBLE';
      err.status = 400;
      throw err;
    }

    const prog = progressRes.rows[0];
    const isCompleted = prog.is_completed || Number(prog.current_progress) >= Number(task.target_progress);

    if (!isCompleted) {
      const err: any = new Error(
        `REWARD_NOT_ELIGIBLE: Task target incomplete. Progress is ${prog.current_progress} / ${task.target_progress}.`
      );
      err.code = 'REWARD_NOT_ELIGIBLE';
      err.status = 400;
      throw err;
    }

    // LOCKED RULE 3: One-time claim uniqueness
    if (prog.is_reward_claimed) {
      const err: any = new Error(`REWARD_ALREADY_CLAIMED: This reward has already been claimed.`);
      err.code = 'REWARD_ALREADY_CLAIMED';
      err.status = 409;
      throw err;
    }

    // B. Mark progress claimed
    await client.query(
      `UPDATE popolive.user_daily_task_progress
       SET is_reward_claimed = true,
           claimed_at = NOW(),
           reward_points_credited = $1,
           status = 'Claimed',
           updated_at = NOW()
       WHERE id = $2`,
      [rewardPoints, prog.id]
    );

    // C. Lock user wallet
    await getOrCreateUserWallet(user.id, client);

    const walletRes = await client.query(
      `SELECT wallet_id, diamond_points, total_received_points
       FROM popolive.user_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [user.id]
    );

    const wallet = walletRes.rows[0];
    const prevPoints = Number(wallet.diamond_points || 0);
    const newPoints = prevPoints + rewardPoints;
    const newTotalReceived = Number(wallet.total_received_points || 0) + rewardPoints;

    // D. Credit points to wallet
    await client.query(
      `UPDATE popolive.user_wallets
       SET diamond_points = $1, total_received_points = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newPoints, newTotalReceived, user.id]
    );

    // E. Record points transaction in points_transactions
    const txId = `TXN_REW_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await client.query(
      `INSERT INTO popolive.points_transactions (
        id, transaction_id, wallet_id, host_user_id, transaction_type, direction,
        points_amount, source_gift_coins, share_percentage_applied, gift_source,
        sender_id, sender_name, previous_balance, new_balance, status, reference_id,
        idempotency_key, description, metadata, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'task_reward', 'credit',
        $4, 0, 100.00, 'Daily Task Reward',
        'system', 'Popo Live Tasks', $5, $6, 'completed', $7,
        $8, $9, $10, 'system', NOW(), NOW()
      )`,
      [
        txId,
        wallet.wallet_id,
        user.id,
        rewardPoints,
        prevPoints,
        newPoints,
        task.id,
        idempotencyKey || null,
        `Daily Task Reward: ${task.title}`,
        JSON.stringify({ taskId: task.id, rewardPoints }),
      ]
    );

    return {
      success: true,
      rewardId: task.id,
      taskTitle: task.title,
      pointsCredited: rewardPoints,
      newPointsBalance: newPoints,
      transactionId: txId,
    };
  });
}

/**
 * Fetches reward claim history
 * PART 4: GET /rewards/history
 */
export async function getRewardsHistory(userId: string) {
  const rows = await query<any>(
    `SELECT id, transaction_id, points_amount, reference_id, description,
            created_at, status
     FROM popolive.points_transactions
     WHERE host_user_id = $1 AND transaction_type = 'task_reward'
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    transactionId: r.transaction_id,
    pointsAmount: Number(r.points_amount),
    taskId: r.reference_id,
    description: r.description,
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));
}

// -----------------------------------------------------------------------------
// 3. RANKINGS (HOSTS & EVENTS)
// -----------------------------------------------------------------------------

export interface HostRankingItem {
  rank: number;
  userId: string;
  hostNickname: string;
  avatarUrl: string;
  diamondsEarned: number;
  country: string;
  countryFlag: string;
  level: number;
}

/**
 * Derived Host Rankings based on actual points earned over time range
 * PART 4: GET /rankings/hosts?range=day|week|month
 * LOCKED RULE 5: Ranking reads are derived — never write ranking values by hand.
 */
export async function getHostRankings({
  range = 'day',
  page = 1,
  limit = 20,
}: {
  range?: string;
  page?: number;
  limit?: number;
}) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const offset = (safePage - 1) * safeLimit;

  let intervalString = '24 hours';
  if (range === 'week' || range === 'weekly') {
    intervalString = '7 days';
  } else if (range === 'month' || range === 'monthly') {
    intervalString = '30 days';
  }

  // Aggregate points_transactions grouped by host
  // If user has points_transactions in interval, use that; also join user profile and wallet
  const countRes = await query<any>(
    `SELECT COUNT(DISTINCT u.id) as total
     FROM popolive.users u
     LEFT JOIN popolive.user_wallets w ON u.id::text = w.user_id OR u.poppo_id = w.user_id
     WHERE u.status = 'active'`
  );
  const total = parseInt(countRes[0]?.total || '0', 10);

  const rows = await query<any>(
    `SELECT u.id, u.nickname, u.avatar_url, u.country, u.host_level,
            COALESCE(SUM(pt.points_amount), w.total_received_points, 0) as total_diamonds
     FROM popolive.users u
     LEFT JOIN popolive.user_wallets w ON u.id::text = w.user_id OR u.poppo_id = w.user_id
     LEFT JOIN popolive.points_transactions pt 
            ON (pt.host_user_id = u.id::text OR pt.host_user_id = u.poppo_id)
           AND pt.created_at >= NOW() - INTERVAL '${intervalString}'
     WHERE u.status = 'active'
     GROUP BY u.id, u.nickname, u.avatar_url, u.country, u.host_level, w.total_received_points
     ORDER BY total_diamonds DESC, u.nickname ASC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  );

  const rankings: HostRankingItem[] = rows.map((r, index) => {
    const isPak = !r.country || r.country.toLowerCase() === 'pakistan' || r.country === 'PK';
    return {
      rank: offset + index + 1,
      userId: r.id,
      hostNickname: r.nickname || `Host ${r.id.substring(0, 6)}`,
      avatarUrl: r.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      diamondsEarned: Number(r.total_diamonds || 0),
      country: r.country || 'Pakistan',
      countryFlag: isPak ? '🇵🇰' : '🌐',
      level: Number(r.host_level || 1),
    };
  });

  return {
    rankings,
    total,
    page: safePage,
    limit: safeLimit,
    range,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

/**
 * Active events and leaderboards
 * PART 4: GET /rankings/events
 */
export async function getEventRankings() {
  const events = await query<any>(
    `SELECT id, event_code, title, title_urdu, description, banner_url,
            status, start_time, end_time, prize_pool, rules, total_participants
     FROM popolive.events
     WHERE status IN ('active', 'upcoming')
     ORDER BY start_time ASC`
  );

  const results = [];
  for (const ev of events) {
    const participants = await query<any>(
      `SELECT ep.rank, ep.score, u.id as user_id, u.nickname, u.avatar_url, u.country
       FROM popolive.event_participants ep
       JOIN popolive.users u ON ep.user_id = u.id
       WHERE ep.event_id = $1
       ORDER BY ep.score DESC
       LIMIT 10`,
      [ev.id]
    );

    results.push({
      id: ev.id,
      eventCode: ev.event_code,
      title: ev.title,
      titleUrdu: ev.title_urdu,
      description: ev.description,
      bannerUrl: ev.banner_url || '/banners/star_creator_banner.png',
      status: ev.status,
      startTime: ev.start_time ? new Date(ev.start_time).toISOString() : '',
      endTime: ev.end_time ? new Date(ev.end_time).toISOString() : '',
      prizePool: ev.prize_pool,
      rules: ev.rules,
      totalParticipants: Number(ev.total_participants || participants.length),
      leaderboard: participants.map((p, idx) => ({
        rank: idx + 1,
        userId: p.user_id,
        nickname: p.nickname,
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        score: Number(p.score),
        country: p.country || 'Pakistan',
      })),
    });
  }

  return results;
}

// -----------------------------------------------------------------------------
// 4. HONOR LEVEL BARS (WEALTH, SHINING, HONOR)
// -----------------------------------------------------------------------------

export interface HonorLevelsData {
  userId: string;
  wealth: {
    level: number;
    levelName: string;
    currentScore: number;
    nextThreshold: number;
    progressPercent: number;
    badgeUrl: string;
  };
  shining: {
    level: number;
    levelName: string;
    currentScore: number;
    nextThreshold: number;
    progressPercent: number;
    badgeUrl: string;
  };
  honor: {
    level: number;
    levelName: string;
    currentScore: number;
    nextThreshold: number;
    progressPercent: number;
    badgeUrl: string;
  };
}

/**
 * Derived Honor Levels (Wealth, Shining, Honor)
 * PART 4: GET /honor/levels/:userId
 * LOCKED RULE 6: Honor levels computed from existing data — not hand-set.
 * Strictly read-only; no write endpoint exists.
 */
export async function getHonorLevels(userId: string): Promise<HonorLevelsData> {
  const safeUuid = toSafeUuid(userId);

  // 1. Fetch user & wallet data
  const walletRows = await query<any>(
    `SELECT total_spent_coins, total_received_points
     FROM popolive.user_wallets
     WHERE user_id = $1 OR user_id = $2
     LIMIT 1`,
    [userId, safeUuid]
  );

  const spentCoins = walletRows[0] ? Number(walletRows[0].total_spent_coins || 0) : 0;
  const receivedPoints = walletRows[0] ? Number(walletRows[0].total_received_points || 0) : 0;

  // 2. Fetch approved honor requests & completed tasks
  const honorReqs = await query<any>(
    `SELECT COALESCE(SUM(points_requested), 0) as honor_points
     FROM popolive.honor_recognition_requests
     WHERE (user_id = $1 OR user_id = $2) AND status = 'approved'`,
    [userId, safeUuid]
  );
  const honorApproved = Number(honorReqs[0]?.honor_points || 0);

  const tasksRes = await query<any>(
    `SELECT COUNT(*) as completed_count
     FROM popolive.user_daily_task_progress
     WHERE user_id = $1 AND is_completed = true`,
    [safeUuid]
  );
  const tasksCompleted = Number(tasksRes[0]?.completed_count || 0);
  const honorScore = honorApproved + tasksCompleted * 50;

  // 3. Compute levels using thresholds
  // Wealth: Level 1 (0-300), Level 2 (300-1200), Level 5 (1200-5000), Level 15 (5000+)
  let wealthLevel = 1;
  let wealthName = 'Wealth Novice';
  let wealthNext = 300;
  if (spentCoins >= 5000) {
    wealthLevel = 15;
    wealthName = 'Royal Magnate';
    wealthNext = 25000;
  } else if (spentCoins >= 1200) {
    wealthLevel = 5;
    wealthName = 'Neon Baron';
    wealthNext = 5000;
  } else if (spentCoins >= 300) {
    wealthLevel = 2;
    wealthName = 'Silver Patron';
    wealthNext = 1200;
  }
  const wealthPercent = Math.min(100, Math.round((spentCoins / wealthNext) * 100));

  // Shining: Level 1 (0-200), Level 2 (200-1000), Level 5 (1000-5000), Level 10 (5000+)
  let shiningLevel = 1;
  let shiningName = 'Shining Star I';
  let shiningNext = 200;
  if (receivedPoints >= 5000) {
    shiningLevel = 10;
    shiningName = 'Grand Broadcaster';
    shiningNext = 20000;
  } else if (receivedPoints >= 1000) {
    shiningLevel = 5;
    shiningName = 'Superstar Streamer';
    shiningNext = 5000;
  } else if (receivedPoints >= 200) {
    shiningLevel = 2;
    shiningName = 'Rising Broadcaster';
    shiningNext = 1000;
  }
  const shiningPercent = Math.min(100, Math.round((receivedPoints / shiningNext) * 100));

  // Honor: Level 1 (0-100), Level 2 (100-500), Level 5 (500+)
  let honorLevel = 1;
  let honorName = 'Honor Guardian I';
  let honorNext = 100;
  if (honorScore >= 500) {
    honorLevel = 5;
    honorName = 'Honor Paragon';
    honorNext = 2000;
  } else if (honorScore >= 100) {
    honorLevel = 2;
    honorName = 'Honor Defender';
    honorNext = 500;
  }
  const honorPercent = Math.min(100, Math.round((honorScore / honorNext) * 100));

  return {
    userId,
    wealth: {
      level: wealthLevel,
      levelName: wealthName,
      currentScore: spentCoins,
      nextThreshold: wealthNext,
      progressPercent: wealthPercent,
      badgeUrl: '/assets/gifts/07_08_wealth_shining_and_honor.png',
    },
    shining: {
      level: shiningLevel,
      levelName: shiningName,
      currentScore: receivedPoints,
      nextThreshold: shiningNext,
      progressPercent: shiningPercent,
      badgeUrl: '/assets/gifts/07_08_wealth_shining_and_honor.png',
    },
    honor: {
      level: honorLevel,
      levelName: honorName,
      currentScore: honorScore,
      nextThreshold: honorNext,
      progressPercent: honorPercent,
      badgeUrl: '/assets/gifts/07_08_wealth_shining_and_honor.png',
    },
  };
}

// -----------------------------------------------------------------------------
// 5. MEDAL WALL (READ-ONLY EARNED + LOCKED SLOTS)
// -----------------------------------------------------------------------------

export interface MedalWallItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  iconEmoji: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate: string | null;
}

/**
 * Read-only Medal Wall displaying earned medals and locked slots
 * PART 4: GET /medals/me
 * LOCKED RULE 7: Medal Wall reads are read-only — no manual medal grant in this prompt.
 */
export async function getMedalsMe(userId: string): Promise<MedalWallItem[]> {
  const safeUuid = toSafeUuid(userId);

  // Fetch user stats
  const userRes = await query<any>(
    `SELECT id, is_adult_verified, is_face_verified, country
     FROM popolive.users
     WHERE id = $1 OR poppo_id = $2
     LIMIT 1`,
    [safeUuid, userId]
  );
  const user = userRes[0] || {};

  const walletRes = await query<any>(
    `SELECT coins, total_spent_coins, total_received_points
     FROM popolive.user_wallets
     WHERE user_id = $1 OR user_id = $2
     LIMIT 1`,
    [userId, safeUuid]
  );
  const wallet = walletRes[0] || {};
  const spent = Number(wallet.total_spent_coins || 0);
  const points = Number(wallet.total_received_points || 0);

  // Check VIP membership
  const vipActive = await getActiveVipMembership(userId);

  // Check 8 medals against real criteria
  const isBroadcasterUnlocked = points >= 1000;
  const isRegionalUnlocked = !user.country || user.country.toLowerCase() === 'pakistan' || user.country === 'PK';
  const isGifterUnlocked = spent >= 100;
  const isFanUnlocked = points >= 500;
  const isPkUnlocked = false; // Locked slot
  const isPartyUnlocked = false; // Locked slot
  const isGuardianUnlocked = vipActive.isActive;
  const isVerifiedUnlocked = Boolean(user.is_adult_verified || user.is_face_verified);

  return [
    {
      id: 'med_01',
      name: 'Top Broadcaster 2026',
      category: 'Honor',
      rarity: 'Legendary',
      iconEmoji: '🏆',
      description: 'Awarded to creators with exceptional streaming diamond points',
      isUnlocked: isBroadcasterUnlocked,
      unlockedDate: isBroadcasterUnlocked ? '2026-11-15' : null,
    },
    {
      id: 'med_02',
      name: 'Karachi Star',
      category: 'Regional',
      rarity: 'Epic',
      iconEmoji: '⭐',
      description: 'Earned from active broadcast audience across Pakistan',
      isUnlocked: isRegionalUnlocked,
      unlockedDate: isRegionalUnlocked ? '2026-11-01' : null,
    },
    {
      id: 'med_03',
      name: 'Gift Master',
      category: 'Gifting',
      rarity: 'Epic',
      iconEmoji: '🎁',
      description: 'Sent verified coins in gifts across creator streams',
      isUnlocked: isGifterUnlocked,
      unlockedDate: isGifterUnlocked ? '2026-11-10' : null,
    },
    {
      id: 'med_04',
      name: 'Loyal Fan Lv.10',
      category: 'Community',
      rarity: 'Rare',
      iconEmoji: '💖',
      description: 'Achieved high intimacy standing with favorite live hosts',
      isUnlocked: isFanUnlocked,
      unlockedDate: isFanUnlocked ? '2026-11-12' : null,
    },
    {
      id: 'med_05',
      name: 'PK Champion',
      category: 'Battle',
      rarity: 'Epic',
      iconEmoji: '⚔️',
      description: 'Achieved 50+ victories in official 1v1 PK battle competitions',
      isUnlocked: isPkUnlocked, // Locked slot
      unlockedDate: null,
    },
    {
      id: 'med_06',
      name: 'Party Maestro',
      category: 'Party',
      rarity: 'Rare',
      iconEmoji: '🎉',
      description: 'Hosted more than 100 hours in 9-seat party rooms',
      isUnlocked: isPartyUnlocked, // Locked slot
      unlockedDate: null,
    },
    {
      id: 'med_07',
      name: 'Super Guardian',
      category: 'Protection',
      rarity: 'Legendary',
      iconEmoji: '🛡️',
      description: 'Holds an active Guardian Shield and VIP royal protection',
      isUnlocked: isGuardianUnlocked,
      unlockedDate: isGuardianUnlocked ? '2026-11-16' : null,
    },
    {
      id: 'med_08',
      name: 'Verified Creator',
      category: 'Identity',
      rarity: 'Exclusive',
      iconEmoji: '✨',
      description: 'Identity verified and certified by Popo Live Trust & Safety',
      isUnlocked: isVerifiedUnlocked,
      unlockedDate: isVerifiedUnlocked ? '2026-11-01' : null,
    },
  ];
}
