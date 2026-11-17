import { query, withTransaction } from '@/lib/db';
import { AuthUser, validateSessionToken } from '@/lib/auth';
import { dispatchPushNotification } from '@/lib/pushNotifications';
import { NextRequest } from 'next/server';

export interface HostDailyTaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  rewardPoints: number;
  rewardCoins: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Claimed';
  isCompleted: boolean;
  isRewardClaimed: boolean;
  iconKey: string;
}

export interface HostTaskLevelData {
  currentLevel: number;
  currentLevelName: string;
  levelName?: string;
  taskPoints: number;
  minPoints: number;
  targetPoints: number;
  progressRatio: number;
  nextLevel: number | null;
  nextLevelName: string | null;
  pointsToNext?: number;
  benefits: string[];
  allTiers: Array<{
    levelNumber: number;
    name: string;
    minPoints: number;
    targetPoints: number;
    description: string;
    benefits: string[];
  }>;
  allLevels?: any[];
}

export interface NewHostPackData {
  id: string;
  packId?: string;
  title: string;
  description: string;
  rewardPoints: number;
  rewardCoins: number;
  welcomeBadge: string;
  badgeName?: string;
  guides: Array<{
    id: string;
    title: string;
    subtitle: string;
  }>;
  isEligible: boolean;
  isClaimed: boolean;
  claimedAt?: string;
}

export interface HostEarningIdentityData {
  userId: string;
  legalName: string;
  country: string;
  documentType: string;
  documentNumberMasked: string;
  status: 'not_started' | 'incomplete' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  earningEligible: boolean;
  verifiedAt?: string;
}

/**
 * Resolves requesting user from cookies, Bearer header, or test headers
 */
export async function resolveHostActor(req: NextRequest): Promise<AuthUser | null> {
  const cookieToken = req.cookies.get('poppo_session')?.value || req.cookies.get('session_token')?.value;
  if (cookieToken) {
    const user = await validateSessionToken(cookieToken);
    if (user) return user;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = await validateSessionToken(token);
    if (user) return user;
  }

  const testViewerId = req.headers.get('x-viewer-id') || req.headers.get('x-user-id');
  if (testViewerId) {
    const rows = await query('SELECT * FROM popolive.users WHERE id = $1', [testViewerId]);
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        poppo_id: r.poppo_id,
        email: r.email,
        phone: r.phone,
        nickname: r.nickname,
        avatar_url: r.avatar_url,
        gender: r.gender,
        birthdate: r.birthdate ? r.birthdate.toISOString().split('T')[0] : null,
        is_adult_verified: r.is_adult_verified,
        status: r.status,
        created_at: r.created_at ? r.created_at.toISOString() : '',
        country: r.country || 'Pakistan',
        country_code: r.country_code || 'PK',
        is_profile_completed: Boolean(r.is_profile_completed),
        bio: r.bio || '',
        host_level: Number(r.host_level) || 1,
        wealth_level: Number(r.wealth_level) || 1,
        role: r.role || 'user',
        is_staff: Boolean(r.is_staff),
        is_face_verified: Boolean(r.is_face_verified),
        live_cover_url: r.live_cover_url || null,
        go_live_eligible: Boolean(r.go_live_eligible),
      };
    }
  }

  return null;
}

/**
 * Verifies if user has legitimate host role and permissions
 */
export async function verifyHostEligibility(userId: string): Promise<{
  eligible: boolean;
  role: string;
  wealthLevel: number;
  isSuspended: boolean;
  reason?: string;
}> {
  const userRows = await query('SELECT role, wealth_level, status, go_live_eligible FROM popolive.users WHERE id = $1', [userId]);
  if (userRows.length === 0) {
    return { eligible: false, role: 'none', wealthLevel: 0, isSuspended: false, reason: 'USER_NOT_FOUND' };
  }

  const u = userRows[0];
  const isSuspended = u.status === 'suspended' || u.status === 'banned';

  if (isSuspended) {
    return { eligible: false, role: u.role, wealthLevel: u.wealth_level || 0, isSuspended: true, reason: 'ACCOUNT_SUSPENDED' };
  }

  // Host role or staff or Wealth Level >= 5 or go_live_eligible
  const isHostRole = u.role === 'host' || u.role === 'admin' || u.role === 'staff';
  const hasWealthGate = (u.wealth_level || 0) >= 5 || u.go_live_eligible === true;

  if (!isHostRole && !hasWealthGate) {
    return {
      eligible: false,
      role: u.role,
      wealthLevel: u.wealth_level || 0,
      isSuspended: false,
      reason: 'HOST_ROLE_OR_WEALTH_5_REQUIRED',
    };
  }

  return {
    eligible: true,
    role: u.role,
    wealthLevel: u.wealth_level || 0,
    isSuspended: false,
  };
}

/**
 * Get Daily Tasks for Host
 */
export async function getHostDailyTasks(userId: string): Promise<{
  tasks: HostDailyTaskItem[];
  completedCount: number;
  totalCount: number;
  completionRatio: number;
  dateLabel: string;
}> {
  // Ensure tasks exist in user_daily_task_progress for today
  await query(`
    INSERT INTO popolive.user_daily_task_progress (user_id, task_id, task_date, current_progress, target_progress, status)
    SELECT $1, t.id, CURRENT_DATE, 0, t.target_progress, 'Not Started'
    FROM popolive.host_daily_tasks t
    WHERE t.is_active = true
    ON CONFLICT (user_id, task_id, task_date) DO NOTHING
  `, [userId]);

  const rows = await query(`
    SELECT 
      t.id,
      t.title,
      t.description,
      t.category,
      t.category_label,
      COALESCE(p.current_progress, 0) as current_progress,
      t.target_progress,
      t.unit,
      t.reward_points,
      t.reward_coins,
      t.icon_key,
      COALESCE(p.status, 'Not Started') as status,
      COALESCE(p.is_completed, false) as is_completed,
      COALESCE(p.is_reward_claimed, false) as is_reward_claimed
    FROM popolive.host_daily_tasks t
    LEFT JOIN popolive.user_daily_task_progress p 
      ON t.id = p.task_id AND p.user_id = $1 AND p.task_date = CURRENT_DATE
    WHERE t.is_active = true
    ORDER BY t.created_at ASC
  `, [userId]);

  const tasks: HostDailyTaskItem[] = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    category: r.category,
    categoryLabel: r.category_label,
    currentProgress: parseInt(r.current_progress || '0', 10),
    targetProgress: parseInt(r.target_progress || '1', 10),
    unit: r.unit,
    rewardPoints: parseInt(r.reward_points || '0', 10),
    rewardCoins: parseInt(r.reward_coins || '0', 10),
    status: r.status as any,
    isCompleted: !!r.is_completed,
    isRewardClaimed: !!r.is_reward_claimed,
    iconKey: r.icon_key || 'clock',
  }));

  const completedCount = tasks.filter((t) => t.isCompleted || t.status === 'Completed' || t.status === 'Claimed').length;
  const totalCount = tasks.length;
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;

  return {
    tasks,
    completedCount,
    totalCount,
    completionRatio,
    dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

/**
 * Update Host Task Progress
 */
export async function updateHostTaskProgress(params: {
  userId: string;
  taskId: string;
  increment?: number;
  absoluteProgress?: number;
}): Promise<HostDailyTaskItem> {
  const { userId, taskId, increment, absoluteProgress } = params;

  return await withTransaction(async (client) => {
    // Check task exists
    const taskRes = await client.query('SELECT target_progress, reward_points FROM popolive.host_daily_tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) throw new Error('TASK_NOT_FOUND');
    const targetProgress = parseInt(taskRes.rows[0].target_progress, 10);

    // Get current progress or insert
    const progRes = await client.query(
      `SELECT current_progress, status, is_completed, is_reward_claimed
       FROM popolive.user_daily_task_progress
       WHERE user_id = $1 AND task_id = $2 AND task_date = CURRENT_DATE`,
      [userId, taskId]
    );

    let curProg = 0;
    let isClaimed = false;
    if (progRes.rows.length > 0) {
      curProg = parseInt(progRes.rows[0].current_progress || '0', 10);
      isClaimed = !!progRes.rows[0].is_reward_claimed;
    }

    let newProg = curProg;
    if (absoluteProgress !== undefined) {
      newProg = Math.max(0, absoluteProgress);
    } else if (increment !== undefined) {
      newProg = Math.max(0, curProg + increment);
    }

    const isCompleted = newProg >= targetProgress;
    let status = isClaimed ? 'Claimed' : (isCompleted ? 'Completed' : (newProg > 0 ? 'In Progress' : 'Not Started'));

    const updateRes = await client.query(
      `INSERT INTO popolive.user_daily_task_progress (
        user_id, task_id, task_date, current_progress, target_progress, status, is_completed, completed_at
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, CASE WHEN $6 THEN CURRENT_TIMESTAMP ELSE NULL END)
      ON CONFLICT (user_id, task_id, task_date) DO UPDATE SET
        current_progress = EXCLUDED.current_progress,
        status = CASE WHEN popolive.user_daily_task_progress.is_reward_claimed THEN 'Claimed' ELSE EXCLUDED.status END,
        is_completed = EXCLUDED.is_completed,
        completed_at = CASE WHEN EXCLUDED.is_completed AND popolive.user_daily_task_progress.completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE popolive.user_daily_task_progress.completed_at END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [userId, taskId, newProg, targetProgress, status, isCompleted]
    );

    const r = updateRes.rows[0];

    // Log real-time event
    await client.query(
      `INSERT INTO popolive.host_task_realtime_events (user_id, event_type, payload)
       VALUES ($1, 'task_progress', $2::jsonb)`,
      [userId, JSON.stringify({ taskId, currentProgress: newProg, isCompleted, status: r.status })]
    );

    // If completed and not already notified, dispatch push notification
    if (isCompleted && !progRes.rows[0]?.is_completed) {
      dispatchPushNotification({
        userId,
        payload: {
          type: 'system_notice',
          title: 'Daily Task Completed!',
          body: `You completed "${taskId.replace(/_/g, ' ')}"! Claim your diamond points reward now.`,
          data: { taskId, action: 'task_completed' },
        },
      }).catch(() => null);
    }

    return {
      id: taskId,
      title: taskId,
      description: '',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming',
      currentProgress: newProg,
      targetProgress,
      unit: '',
      rewardPoints: parseInt(taskRes.rows[0].reward_points, 10),
      rewardCoins: 0,
      status: r.status,
      isCompleted,
      isRewardClaimed: !!r.is_reward_claimed,
      iconKey: 'clock',
    };
  });
}

/**
 * Claim Task Reward (Credits points to wallet & task level)
 */
export async function claimHostTaskReward(params: {
  userId: string;
  taskId: string;
}): Promise<{
  success: boolean;
  taskId: string;
  rewardPoints: number;
  newDiamondPoints: number;
  currentTaskLevel: number;
  taskPointsTotal: number;
  transactionId: string;
}> {
  const { userId, taskId } = params;

  return await withTransaction(async (client) => {
    // 1. Check task & reward
    const taskRes = await client.query(
      'SELECT title, reward_points FROM popolive.host_daily_tasks WHERE id = $1',
      [taskId]
    );
    if (taskRes.rows.length === 0) throw new Error('TASK_NOT_FOUND');
    const rewardPoints = parseInt(taskRes.rows[0].reward_points, 10);

    // 2. Check user progress
    const progRes = await client.query(
      `SELECT id, is_completed, is_reward_claimed, status
       FROM popolive.user_daily_task_progress
       WHERE user_id = $1 AND task_id = $2 AND task_date = CURRENT_DATE
       FOR UPDATE`,
      [userId, taskId]
    );

    if (progRes.rows.length === 0 || !progRes.rows[0].is_completed) {
      throw new Error('TASK_NOT_COMPLETED');
    }

    if (progRes.rows[0].is_reward_claimed) {
      throw new Error('REWARD_ALREADY_CLAIMED');
    }

    // 3. Mark claimed
    await client.query(
      `UPDATE popolive.user_daily_task_progress
       SET is_reward_claimed = true, status = 'Claimed', claimed_at = CURRENT_TIMESTAMP, reward_points_credited = $1
       WHERE user_id = $2 AND task_id = $3 AND task_date = CURRENT_DATE`,
      [rewardPoints, userId, taskId]
    );

    // 4. Update wallet diamond_points
    // Ensure wallet exists
    await client.query(
      `INSERT INTO popolive.user_wallets (user_id, diamond_points, coins, total_spent_coins, total_received_points)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const walletRes = await client.query(
      `UPDATE popolive.user_wallets
       SET diamond_points = diamond_points + $1, total_received_points = total_received_points + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING wallet_id, diamond_points`,
      [rewardPoints, userId]
    );
    const newDiamondPoints = parseInt(walletRes.rows[0]?.diamond_points || '0', 10);
    const walletId = walletRes.rows[0]?.wallet_id;

    // 5. Insert points_transaction audit record
    const txId = `tx_task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await client.query(
      `INSERT INTO popolive.points_transactions (
        transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
        previous_balance, new_balance, status, reference_id, description
      ) VALUES ($1, $2, $3, 'task_reward', 'credit', $4, $5, $6, 'completed', $7, $8)`,
      [
        txId,
        walletId,
        userId,
        rewardPoints,
        newDiamondPoints - rewardPoints,
        newDiamondPoints,
        taskId,
        `Daily task reward credited: ${taskRes.rows[0].title}`,
      ]
    );

    // 6. Update user_host_task_levels points & evaluate level advancement
    await client.query(
      `INSERT INTO popolive.user_host_task_levels (user_id, current_level, task_points, highest_level)
       VALUES ($1, 1, $2, 1)
       ON CONFLICT (user_id) DO UPDATE SET
         task_points = popolive.user_host_task_levels.task_points + $2,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, rewardPoints]
    );

    // Fetch updated task points and calculate level
    const lvlRecordRes = await client.query(
      'SELECT task_points, current_level FROM popolive.user_host_task_levels WHERE user_id = $1',
      [userId]
    );
    const totalTaskPts = parseInt(lvlRecordRes.rows[0]?.task_points || '0', 10);

    const matchLvlRes = await client.query(
      'SELECT level_number FROM popolive.host_task_levels WHERE $1 >= min_points ORDER BY level_number DESC LIMIT 1',
      [totalTaskPts]
    );
    const calculatedLevel = matchLvlRes.rows.length > 0 ? matchLvlRes.rows[0].level_number : 1;

    await client.query(
      'UPDATE popolive.user_host_task_levels SET current_level = $1 WHERE user_id = $2',
      [calculatedLevel, userId]
    );

    // 7. Log real-time event
    await client.query(
      `INSERT INTO popolive.host_task_realtime_events (user_id, event_type, payload)
       VALUES ($1, 'reward_claimed', $2::jsonb)`,
      [userId, JSON.stringify({ taskId, rewardPoints, newDiamondPoints, currentLevel: calculatedLevel })]
    );

    return {
      success: true,
      taskId,
      rewardPoints,
      newDiamondPoints,
      currentTaskLevel: calculatedLevel,
      taskPointsTotal: totalTaskPts,
      transactionId: txId,
    };
  });
}

/**
 * Get Host Task Level Status
 */
export async function getHostTaskLevel(userId: string): Promise<HostTaskLevelData> {
  // Query all level tiers
  const tiersRes = await query('SELECT * FROM popolive.host_task_levels ORDER BY level_number ASC');
  const allTiers = tiersRes.map((r: any) => ({
    levelNumber: r.level_number,
    name: r.name,
    minPoints: r.min_points,
    targetPoints: r.target_points,
    description: r.description || '',
    benefits: Array.isArray(r.benefits) ? r.benefits : [],
  }));

  // Query user record
  const userLvlRes = await query(
    'SELECT current_level, task_points FROM popolive.user_host_task_levels WHERE user_id = $1',
    [userId]
  );

  const currentLevel = userLvlRes[0]?.current_level || 1;
  const taskPoints = parseInt(userLvlRes[0]?.task_points || '0', 10);

  const activeTier = allTiers.find((t) => t.levelNumber === currentLevel) || allTiers[0];
  const nextTier = allTiers.find((t) => t.levelNumber === currentLevel + 1) || null;

  const targetPoints = activeTier.targetPoints;
  const minPoints = activeTier.minPoints;
  const progressRatio = targetPoints > minPoints ? Math.min(1.0, Math.max(0.0, (taskPoints - minPoints) / (targetPoints - minPoints))) : 1.0;

  return {
    currentLevel: activeTier.levelNumber,
    currentLevelName: activeTier.name,
    levelName: activeTier.name,
    taskPoints,
    minPoints,
    targetPoints,
    progressRatio,
    nextLevel: nextTier?.levelNumber || null,
    nextLevelName: nextTier?.name || null,
    pointsToNext: nextTier ? Math.max(0, nextTier.minPoints - taskPoints) : 0,
    benefits: activeTier.benefits,
    allTiers,
    allLevels: allTiers,
  };
}

/**
 * Get New Host Starter Pack
 */
export async function getNewHostPack(userId: string): Promise<NewHostPackData> {
  const packRes = await query('SELECT * FROM popolive.new_host_packs WHERE is_active = true LIMIT 1');
  if (packRes.length === 0) throw new Error('PACK_NOT_FOUND');
  const p = packRes[0];

  const claimRes = await query(
    'SELECT status, claimed_at FROM popolive.user_new_host_pack_claims WHERE user_id = $1 AND pack_id = $2',
    [userId, p.id]
  );

  const isClaimed = claimRes.length > 0 && claimRes[0].status === 'claimed';
  const claimedAt = claimRes[0]?.claimed_at ? claimRes[0].claimed_at.toISOString() : undefined;

  let guides = [];
  if (Array.isArray(p.guides)) {
    guides = p.guides;
  } else if (typeof p.guides === 'string') {
    try { guides = JSON.parse(p.guides); } catch (_) {}
  }

  return {
    id: p.id,
    packId: p.id,
    title: p.title,
    description: p.description || '',
    rewardPoints: p.reward_points || 200,
    rewardCoins: p.reward_coins || 50,
    welcomeBadge: p.welcome_badge || 'Rising Star Host',
    badgeName: p.welcome_badge || 'Rising Star Host',
    guides,
    isEligible: true,
    isClaimed,
    claimedAt,
  };
}

/**
 * Claim New Host Starter Pack
 */
export async function claimNewHostPack(userId: string): Promise<{
  success: boolean;
  rewardPoints: number;
  rewardCoins: number;
  welcomeBadge: string;
}> {
  return await withTransaction(async (client) => {
    const packRes = await client.query('SELECT * FROM popolive.new_host_packs WHERE is_active = true LIMIT 1');
    if (packRes.rows.length === 0) throw new Error('PACK_NOT_FOUND');
    const p = packRes.rows[0];

    // Check already claimed
    const claimRes = await client.query(
      'SELECT id FROM popolive.user_new_host_pack_claims WHERE user_id = $1 AND pack_id = $2',
      [userId, p.id]
    );

    if (claimRes.rows.length > 0) {
      throw new Error('PACK_ALREADY_CLAIMED');
    }

    const rewardPoints = p.reward_points || 200;
    const rewardCoins = p.reward_coins || 50;

    // Record claim
    await client.query(
      `INSERT INTO popolive.user_new_host_pack_claims (user_id, pack_id, status, reward_points_credited)
       VALUES ($1, $2, 'claimed', $3)`,
      [userId, p.id, rewardPoints]
    );

    // Update wallet diamond_points and coins
    await client.query(
      `INSERT INTO popolive.user_wallets (user_id, diamond_points, coins, total_spent_coins, total_received_points)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    await client.query(
      `UPDATE popolive.user_wallets
       SET diamond_points = diamond_points + $1, coins = coins + $2, total_received_points = total_received_points + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [rewardPoints, rewardCoins, userId]
    );

    // Update task levels points
    await client.query(
      `INSERT INTO popolive.user_host_task_levels (user_id, current_level, task_points, highest_level)
       VALUES ($1, 1, $2, 1)
       ON CONFLICT (user_id) DO UPDATE SET
         task_points = popolive.user_host_task_levels.task_points + $2,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, rewardPoints]
    );

    // Log real-time event
    await client.query(
      `INSERT INTO popolive.host_task_realtime_events (user_id, event_type, payload)
       VALUES ($1, 'pack_claimed', $2::jsonb)`,
      [userId, JSON.stringify({ packId: p.id, rewardPoints, rewardCoins })]
    );

    // Dispatch notification
    dispatchPushNotification({
      userId,
      payload: {
        type: 'system_notice',
        title: 'New Host Pack Claimed!',
        body: `Congratulations! ${rewardPoints} Diamond Points and ${rewardCoins} Coins have been added to your wallet.`,
        data: { action: 'pack_claimed' },
      },
    }).catch(() => null);

    return {
      success: true,
      rewardPoints,
      rewardCoins,
      welcomeBadge: p.welcome_badge || 'Rising Star',
    };
  });
}

/**
 * Get Host Earning Identity (KYC info)
 */
export async function getHostEarningIdentity(userId: string): Promise<HostEarningIdentityData> {
  const rows = await query('SELECT * FROM popolive.host_earning_identities WHERE user_id = $1', [userId]);
  if (rows.length === 0) {
    return {
      userId,
      legalName: 'Not Provided',
      country: 'Pakistan',
      documentType: 'national_id',
      documentNumberMasked: '•••• •••• ••••',
      status: 'not_started',
      earningEligible: false,
    };
  }

  const r = rows[0];
  return {
    userId,
    legalName: r.legal_name,
    country: r.country,
    documentType: r.document_type,
    documentNumberMasked: r.document_number_masked,
    status: r.status,
    earningEligible: !!r.earning_eligible,
    verifiedAt: r.verified_at ? r.verified_at.toISOString() : undefined,
  };
}

/**
 * Submit or update Host Earning Identity
 */
export async function submitHostEarningIdentity(params: {
  userId: string;
  legalName: string;
  country: string;
  documentType: string;
  documentNumber: string;
}): Promise<HostEarningIdentityData> {
  const { userId, legalName, country, documentType, documentNumber } = params;

  if (!legalName || !legalName.trim()) throw new Error('LEGAL_NAME_REQUIRED');
  if (!documentNumber || documentNumber.length < 5) throw new Error('VALID_DOCUMENT_NUMBER_REQUIRED');

  const cleanNum = documentNumber.replace(/\s+/g, '');
  const masked = `•••• •••• ••${cleanNum.slice(-4)}`;

  const res = await query(
    `INSERT INTO popolive.host_earning_identities (
      user_id, legal_name, country, document_type, document_number_masked, status, earning_eligible, submitted_at
    ) VALUES ($1, $2, $3, $4, $5, 'submitted', false, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      legal_name = EXCLUDED.legal_name,
      country = EXCLUDED.country,
      document_type = EXCLUDED.document_type,
      document_number_masked = EXCLUDED.document_number_masked,
      status = 'submitted',
      submitted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [userId, legalName.trim(), country || 'Pakistan', documentType, masked]
  );

  const r = res[0];
  return {
    userId,
    legalName: r.legal_name,
    country: r.country,
    documentType: r.document_type,
    documentNumberMasked: r.document_number_masked,
    status: r.status,
    earningEligible: !!r.earning_eligible,
  };
}
