import { query } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';
import {
  generateTxId,
  getFinanceRules,
  getWalletSummary,
  isAuthorizedFinanceAdmin,
} from '@/lib/wallet';
import type { WalletActorContext } from '@/lib/walletAuth';

// =============================================================================
// Popo Live Phase 7 Module 7.5 — Host Gift Share into Points Engine
// Single authoritative backend calculator & ledger:
// - 70% of eligible gift coins -> Host Points (non-cash earning points)
// - 30% of eligible gift coins -> Platform Share
// - Strictly separate from Coins & no withdrawal/cash conversion invented
// =============================================================================

export const DEMO_PREVIEW_HOST_IDS = new Set([
  '00000000-0000-0000-0000-000000088201', // Sara Live
  '00000000-0000-0000-0000-000000088202', // Ayesha
  'user_wallet_demo_701', // Canonical demo user
]);

export const DEFAULT_PREVIEW_HOST_ID = '00000000-0000-0000-0000-000000088201';

export type EarningShareStatus = 'credited' | 'reversed' | 'failed';
export type EarningSourceType = 'live_room' | 'pk_battle' | 'direct_gift';

export interface HostEarningShareRecord {
  id: string;
  earningId: string;
  giftTransactionId: string;
  hostUserId: string;
  hostNickname: string;
  senderUserId: string;
  senderNickname: string;
  giftId: string;
  giftName: string;
  giftQuantity: number;
  sourceType: EarningSourceType;
  liveRoomId: string | null;
  pkBattleId: string | null;
  originalCoinAmount: number;
  hostSharePercentage: number;
  pointsCredited: number;
  platformSharePercentage: number;
  platformShareAmount: number;
  pointsTxId: string | null;
  status: EarningShareStatus;
  reversalReference: string | null;
  reversalReason: string | null;
  reversedBy: string | null;
  reversedAt: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface HostEarningsDashboardSummary {
  hostUserId: string;
  hostNickname: string;
  hostPoppoId: string | null;
  hostAvatarUrl: string | null;
  walletId: string;
  currentPointsBalance: number;
  totalReceivedPoints: number;
  totalEarnedPointsFromGifts: number;
  todayEarnedPoints: number;
  weeklyEarnedPoints: number;
  monthlyEarnedPoints: number;
  totalGiftCoinsReceived: number;
  totalPlatformShareRecorded: number;
  totalReceivedGiftsCount: number;
  totalGiftUnitsReceived: number;
  reversedTransactionsCount: number;
  reversedPointsTotal: number;
  hostSharePercentage: number;
  platformSharePercentage: number;
  pointsAreNonCash: true;
  coinsAndPointsSeparate: true;
  disclaimer: string;
  dailySeries: Array<{
    date: string;
    label: string;
    pointsEarned: number;
    coinsReceived: number;
    platformShare: number;
    giftsCount: number;
  }>;
  topGiftsSeries: Array<{
    giftId: string;
    giftName: string;
    totalCoins: number;
    pointsEarned: number;
    platformShare: number;
    giftsCount: number;
    shareOfEarnedPercent: number;
  }>;
  latestBreakdown: HostEarningShareRecord | null;
  recentEarnings: HostEarningShareRecord[];
  generatedAt: string;
}

export class HostEarningsError extends Error {
  statusCode: number;
  errorCode: string;
  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export function mapHostEarningRow(row: any): HostEarningShareRecord {
  return {
    id: row.id,
    earningId: row.earning_id,
    giftTransactionId: row.gift_transaction_id,
    hostUserId: row.host_user_id,
    hostNickname: row.host_nickname || 'Host',
    senderUserId: row.sender_user_id,
    senderNickname: row.sender_nickname || 'Supporter',
    giftId: row.gift_id,
    giftName: row.gift_name_snapshot,
    giftQuantity: parseInt(String(row.gift_quantity ?? '1'), 10),
    sourceType: (row.source_type || 'live_room') as EarningSourceType,
    liveRoomId: row.live_room_id || null,
    pkBattleId: row.pk_battle_id || null,
    originalCoinAmount: parseInt(String(row.original_coin_amount ?? '0'), 10),
    hostSharePercentage: Number(row.host_share_percentage ?? 70),
    pointsCredited: parseInt(String(row.points_credited ?? '0'), 10),
    platformSharePercentage: Number(row.platform_share_percentage ?? 30),
    platformShareAmount: parseInt(String(row.platform_share_amount ?? '0'), 10),
    pointsTxId: row.points_tx_id || null,
    status: (row.status || 'credited') as EarningShareStatus,
    reversalReference: row.reversal_reference || null,
    reversalReason: row.reversal_reason || null,
    reversedBy: row.reversed_by || null,
    reversedAt: row.reversed_at ? new Date(row.reversed_at).toISOString() : null,
    metadata: typeof row.metadata === 'object' && row.metadata ? row.metadata : {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Privacy & RBAC Guard (Section 13):
 * - Authorized Finance Admin / Super Admin may inspect any host's earnings & platform share.
 * - Authenticated users/ordinary admins may ONLY inspect their own host earnings.
 * - Anonymous callers may ONLY access explicit preview-demo seeded host showcases when `?preview=demo`.
 */
export function canAccessHostEarnings(
  actor: WalletActorContext,
  targetHostId: string,
  isPreviewDemo: boolean = false
): boolean {
  if (isAuthorizedFinanceAdmin(actor.actorRole)) {
    return true;
  }

  if (actor.user) {
    return actor.user.id === targetHostId || actor.user.poppo_id === targetHostId;
  }

  if (isPreviewDemo && DEMO_PREVIEW_HOST_IDS.has(targetHostId)) {
    return true;
  }

  const claimed = actor.actorId;
  if (claimed && claimed !== 'anonymous' && claimed === targetHostId) {
    return true;
  }

  return false;
}

export async function calculateHostAndPlatformShare(totalCoins: number, dbClient?: any) {
  if (!Number.isFinite(totalCoins) || totalCoins <= 0) {
    const rules = await getFinanceRules(dbClient);
    const hostPct = rules.hostGiftSharePercent;
    const platPct = Number((100 - hostPct).toFixed(2));
    return {
      originalCoinAmount: 0,
      hostSharePercentage: hostPct,
      pointsCredited: 0,
      platformSharePercentage: platPct,
      platformShareAmount: 0,
    };
  }

  const rules = await getFinanceRules(dbClient);
  const hostSharePercentage = rules.hostGiftSharePercent;
  const platformSharePercentage = Number((100 - hostSharePercentage).toFixed(2));
  const pointsCredited = Math.floor((totalCoins * hostSharePercentage) / 100);
  const platformShareAmount = Math.max(0, totalCoins - pointsCredited);

  return {
    originalCoinAmount: totalCoins,
    hostSharePercentage,
    pointsCredited,
    platformSharePercentage,
    platformShareAmount,
  };
}

export async function emitEarningsRealtimeEvent(
  dbClient: any,
  hostUserId: string,
  eventType:
    | 'earnings:gift_received'
    | 'earnings:points_credited'
    | 'earnings:balance_updated'
    | 'earnings:transaction_reversed'
    | 'earnings:history_updated',
  payload: Record<string, any>
): Promise<void> {
  const exec = dbClient
    ? (sql: string, params?: any[]) => dbClient.query(sql, params)
    : query;

  await exec(
    `INSERT INTO popolive.earnings_realtime_events (host_user_id, event_type, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [
      hostUserId,
      eventType,
      JSON.stringify({
        ...payload,
        hostUserId,
        emittedAt: new Date().toISOString(),
      }),
    ]
  );

  await redisDel(`earnings:dash:${hostUserId}`).catch(() => {});
}

export async function recordHostEarningShareInTx(
  client: any,
  params: {
    giftTransactionId: string;
    hostUserId: string;
    hostNickname: string;
    senderUserId: string;
    senderNickname: string;
    giftId: string;
    giftName: string;
    giftQuantity: number;
    sourceType: EarningSourceType;
    liveRoomId?: string | null;
    pkBattleId?: string | null;
    originalCoinAmount: number;
    hostSharePercentage: number;
    pointsCredited: number;
    platformShareAmount: number;
    pointsTxId: string | null;
    updatedHostPointsBalance: number;
    updatedTotalReceivedPoints: number;
    pkHostSide?: string | null;
    throwOnDuplicate?: boolean;
  }
): Promise<HostEarningShareRecord | null> {
  if (params.originalCoinAmount <= 0 || params.pointsCredited < 0) {
    throw new HostEarningsError(400, 'INVALID_EARNING_AMOUNT', 'Earning share requires positive coin amount.');
  }

  if (params.pointsCredited + params.platformShareAmount !== params.originalCoinAmount) {
    throw new HostEarningsError(
      400,
      'SHARE_SUM_MISMATCH',
      'Host points share plus platform share must equal original gift coin amount.'
    );
  }

  const earningId = generateTxId('ERN');
  const platformPct = Number((100 - params.hostSharePercentage).toFixed(2));

  const insertRes = await client.query(
    `INSERT INTO popolive.host_earning_shares (
       earning_id, gift_transaction_id, host_user_id, host_nickname,
       sender_user_id, sender_nickname, gift_id, gift_name_snapshot, gift_quantity,
       source_type, live_room_id, pk_battle_id,
       original_coin_amount, host_share_percentage, points_credited,
       platform_share_percentage, platform_share_amount, points_tx_id,
       status, metadata
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'credited',$19::jsonb
     )
     ON CONFLICT (gift_transaction_id) DO NOTHING
     RETURNING *`,
    [
      earningId,
      params.giftTransactionId,
      params.hostUserId,
      params.hostNickname,
      params.senderUserId,
      params.senderNickname,
      params.giftId,
      params.giftName,
      params.giftQuantity,
      params.sourceType,
      params.liveRoomId || null,
      params.pkBattleId || null,
      params.originalCoinAmount,
      params.hostSharePercentage,
      params.pointsCredited,
      platformPct,
      params.platformShareAmount,
      params.pointsTxId,
      JSON.stringify({
        pkHostSide: params.pkHostSide || null,
        pointsAreNonCash: true,
      }),
    ]
  );

  if (insertRes.rows.length === 0) {
    if (params.throwOnDuplicate) {
      throw new HostEarningsError(
        409,
        'DUPLICATE_EARNING_SHARE',
        'Host share for this gift transaction has already been credited.'
      );
    }
    return null;
  }

  const record = mapHostEarningRow(insertRes.rows[0]);

  await emitEarningsRealtimeEvent(client, params.hostUserId, 'earnings:gift_received', {
    earningId: record.earningId,
    giftTransactionId: record.giftTransactionId,
    giftId: record.giftId,
    giftName: record.giftName,
    giftQuantity: record.giftQuantity,
    senderNickname: record.senderNickname,
    originalCoinAmount: record.originalCoinAmount,
  });

  await emitEarningsRealtimeEvent(client, params.hostUserId, 'earnings:points_credited', {
    earningId: record.earningId,
    giftTransactionId: record.giftTransactionId,
    pointsCredited: record.pointsCredited,
    platformShareAmount: record.platformShareAmount,
    hostSharePercentage: record.hostSharePercentage,
  });

  await emitEarningsRealtimeEvent(client, params.hostUserId, 'earnings:balance_updated', {
    points: params.updatedHostPointsBalance,
    totalReceivedPoints: params.updatedTotalReceivedPoints,
    deltaPoints: record.pointsCredited,
  });

  await emitEarningsRealtimeEvent(client, params.hostUserId, 'earnings:history_updated', {
    action: 'credited',
    record,
  });

  return record;
}

export async function reverseHostEarningShareInTx(
  client: any,
  params: {
    giftTransactionId: string;
    reversalReference: string;
    reason: string;
    actorId: string;
    updatedHostPointsBalance: number;
    updatedTotalReceivedPoints: number;
  }
): Promise<HostEarningShareRecord | null> {
  const shareRes = await client.query(
    `SELECT * FROM popolive.host_earning_shares
     WHERE gift_transaction_id = $1
     FOR UPDATE`,
    [params.giftTransactionId]
  );
  if (shareRes.rows.length === 0) {
    return null;
  }

  const existing = shareRes.rows[0];
  if (existing.status === 'reversed') {
    return mapHostEarningRow(existing);
  }

  const updRes = await client.query(
    `UPDATE popolive.host_earning_shares
     SET status = 'reversed',
         reversal_reference = $1,
         reversal_reason = $2,
         reversed_by = $3,
         reversed_at = NOW(),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [params.reversalReference, params.reason, params.actorId, existing.id]
  );

  const reversedRecord = mapHostEarningRow(updRes.rows[0]);

  await emitEarningsRealtimeEvent(client, reversedRecord.hostUserId, 'earnings:transaction_reversed', {
    earningId: reversedRecord.earningId,
    giftTransactionId: reversedRecord.giftTransactionId,
    reversalReference: reversedRecord.reversalReference,
    pointsDeducted: reversedRecord.pointsCredited,
    reason: reversedRecord.reversalReason,
  });

  await emitEarningsRealtimeEvent(client, reversedRecord.hostUserId, 'earnings:balance_updated', {
    points: params.updatedHostPointsBalance,
    totalReceivedPoints: params.updatedTotalReceivedPoints,
    deltaPoints: -reversedRecord.pointsCredited,
  });

  await emitEarningsRealtimeEvent(client, reversedRecord.hostUserId, 'earnings:history_updated', {
    action: 'reversed',
    record: reversedRecord,
  });

  return reversedRecord;
}

export async function getHostEarningsDashboard(
  hostUserId: string,
  options: { fresh?: boolean } = {}
): Promise<HostEarningsDashboardSummary> {
  const cacheKey = `earnings:dash:${hostUserId}`;
  if (!options.fresh) {
    const rawCached = await redisGet(cacheKey).catch(() => null);
    if (rawCached) {
      try {
        const cached = JSON.parse(rawCached) as HostEarningsDashboardSummary;
        if (cached && cached.hostUserId === hostUserId) {
          return cached;
        }
      } catch {}
    }
  }

  const [wallet, rules, userRows] = await Promise.all([
    getWalletSummary(hostUserId, Boolean(options.fresh)),
    getFinanceRules(),
    query(
      `SELECT id, poppo_id, nickname, avatar_url
       FROM popolive.users
       WHERE id::text = $1 OR poppo_id = $1
       LIMIT 1`,
      [hostUserId]
    ).catch(() => []),
  ]);

  const user = userRows[0] || null;
  const hostNickname =
    user?.nickname ||
    (hostUserId === '00000000-0000-0000-0000-000000088201'
      ? 'Sara Live'
      : hostUserId === '00000000-0000-0000-0000-000000088202'
      ? 'Ayesha'
      : 'Host Creator');

  const hostSharePct = rules.hostGiftSharePercent;
  const platformSharePct = Number((100 - hostSharePct).toFixed(2));

  const aggRows = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'credited' THEN points_credited ELSE 0 END), 0)::bigint AS total_earned_points,
       COALESCE(SUM(CASE WHEN status = 'credited' AND created_at >= (DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') THEN points_credited ELSE 0 END), 0)::bigint AS today_earned_points,
       COALESCE(SUM(CASE WHEN status = 'credited' AND created_at >= NOW() - INTERVAL '7 days' THEN points_credited ELSE 0 END), 0)::bigint AS weekly_earned_points,
       COALESCE(SUM(CASE WHEN status = 'credited' AND created_at >= NOW() - INTERVAL '30 days' THEN points_credited ELSE 0 END), 0)::bigint AS monthly_earned_points,
       COALESCE(SUM(CASE WHEN status = 'credited' THEN original_coin_amount ELSE 0 END), 0)::bigint AS total_coins_received,
       COALESCE(SUM(CASE WHEN status = 'credited' THEN platform_share_amount ELSE 0 END), 0)::bigint AS total_platform_share,
       COUNT(*) FILTER (WHERE status = 'credited')::int AS total_gifts_count,
       COALESCE(SUM(CASE WHEN status = 'credited' THEN gift_quantity ELSE 0 END), 0)::int AS total_gift_units,
       COUNT(*) FILTER (WHERE status = 'reversed')::int AS reversed_count,
       COALESCE(SUM(CASE WHEN status = 'reversed' THEN points_credited ELSE 0 END), 0)::bigint AS reversed_points
     FROM popolive.host_earning_shares
     WHERE host_user_id = $1`,
    [hostUserId]
  );

  const agg = aggRows[0] || {};
  const totalEarnedPointsFromGifts = parseInt(String(agg.total_earned_points ?? '0'), 10);

  // Build 7-day zero-filled UTC daily series cleanly
  const dailyRows = await query(
    `SELECT
       TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day_key,
       COALESCE(SUM(points_credited), 0)::bigint AS points_earned,
       COALESCE(SUM(original_coin_amount), 0)::bigint AS coins_received,
       COALESCE(SUM(platform_share_amount), 0)::bigint AS platform_share,
       COUNT(*)::int AS gifts_count
     FROM popolive.host_earning_shares
     WHERE host_user_id = $1
       AND status = 'credited'
       AND created_at >= (DATE_TRUNC('day', (NOW() AT TIME ZONE 'UTC') - INTERVAL '6 days') AT TIME ZONE 'UTC')
     GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
     ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') ASC`,
    [hostUserId]
  );

  const dailyMap = new Map<string, any>();
  for (const r of dailyRows) {
    dailyMap.set(r.day_key, r);
  }

  const dailySeries: HostEarningsDashboardSummary['dailySeries'] = [];
  const nowUtc = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() - i));
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const found = dailyMap.get(dateKey);
    dailySeries.push({
      date: dateKey,
      label,
      pointsEarned: found ? parseInt(String(found.points_earned), 10) : 0,
      coinsReceived: found ? parseInt(String(found.coins_received), 10) : 0,
      platformShare: found ? parseInt(String(found.platform_share), 10) : 0,
      giftsCount: found ? parseInt(String(found.gifts_count), 10) : 0,
    });
  }

  const topGiftRows = await query(
    `SELECT
       gift_id,
       MAX(gift_name_snapshot) AS gift_name,
       COALESCE(SUM(original_coin_amount), 0)::bigint AS total_coins,
       COALESCE(SUM(points_credited), 0)::bigint AS points_earned,
       COALESCE(SUM(platform_share_amount), 0)::bigint AS platform_share,
       COUNT(*)::int AS gifts_count
     FROM popolive.host_earning_shares
     WHERE host_user_id = $1 AND status = 'credited'
     GROUP BY gift_id
     ORDER BY points_earned DESC, gifts_count DESC
     LIMIT 5`,
    [hostUserId]
  );

  const topGiftsSeries = topGiftRows.map((r: any) => {
    const pts = parseInt(String(r.points_earned ?? '0'), 10);
    return {
      giftId: r.gift_id,
      giftName: r.gift_name,
      totalCoins: parseInt(String(r.total_coins ?? '0'), 10),
      pointsEarned: pts,
      platformShare: parseInt(String(r.platform_share ?? '0'), 10),
      giftsCount: parseInt(String(r.gifts_count ?? '0'), 10),
      shareOfEarnedPercent:
        totalEarnedPointsFromGifts > 0
          ? Number(((pts / totalEarnedPointsFromGifts) * 100).toFixed(1))
          : 0,
    };
  });

  const recentRows = await query(
    `SELECT * FROM popolive.host_earning_shares
     WHERE host_user_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [hostUserId]
  );
  const recentEarnings = recentRows.map(mapHostEarningRow);
  const latestBreakdown = recentEarnings.find((r: HostEarningShareRecord) => r.status === 'credited') || recentEarnings[0] || null;

  const summary: HostEarningsDashboardSummary = {
    hostUserId,
    hostNickname,
    hostPoppoId: user?.poppo_id || (hostUserId.endsWith('88201') ? '88201' : hostUserId.endsWith('88202') ? '88202' : null),
    hostAvatarUrl:
      user?.avatar_url ||
      (hostUserId.endsWith('88201')
        ? '/assets/following/zara_live@2x.png'
        : hostUserId.endsWith('88202')
        ? '/assets/following/alina@2x.png'
        : '/assets/chat/avatar_sana.png'),
    walletId: wallet.walletId,
    currentPointsBalance: wallet.points,
    totalReceivedPoints: wallet.totalReceivedPoints,
    totalEarnedPointsFromGifts,
    todayEarnedPoints: parseInt(String(agg.today_earned_points ?? '0'), 10),
    weeklyEarnedPoints: parseInt(String(agg.weekly_earned_points ?? '0'), 10),
    monthlyEarnedPoints: parseInt(String(agg.monthly_earned_points ?? '0'), 10),
    totalGiftCoinsReceived: parseInt(String(agg.total_coins_received ?? '0'), 10),
    totalPlatformShareRecorded: parseInt(String(agg.total_platform_share ?? '0'), 10),
    totalReceivedGiftsCount: parseInt(String(agg.total_gifts_count ?? '0'), 10),
    totalGiftUnitsReceived: parseInt(String(agg.total_gift_units ?? '0'), 10),
    reversedTransactionsCount: parseInt(String(agg.reversed_count ?? '0'), 10),
    reversedPointsTotal: parseInt(String(agg.reversed_points ?? '0'), 10),
    hostSharePercentage: hostSharePct,
    platformSharePercentage: platformSharePct,
    pointsAreNonCash: true,
    coinsAndPointsSeparate: true,
    disclaimer:
      'Points reflect the approved 70% host share from eligible virtual gifts (30% platform share). Points and coins are separate; points are not withdrawable cash.',
    dailySeries,
    topGiftsSeries,
    latestBreakdown,
    recentEarnings,
    generatedAt: new Date().toISOString(),
  };

  await redisSetWithTtl(cacheKey, JSON.stringify(summary), 25).catch(() => {});
  return summary;
}

export async function getHostEarningsHistory(
  hostUserId: string,
  options: {
    page?: number;
    limit?: number;
    status?: string;
    sourceType?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = ['host_user_id = $1'];
  const params: any[] = [hostUserId];

  if (options.status && ['credited', 'reversed', 'failed'].includes(options.status)) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }

  if (options.sourceType && ['live_room', 'pk_battle', 'direct_gift'].includes(options.sourceType)) {
    params.push(options.sourceType);
    conditions.push(`source_type = $${params.length}`);
  }

  if (options.fromDate) {
    const d = new Date(options.fromDate);
    if (!Number.isNaN(d.getTime())) {
      params.push(d.toISOString());
      conditions.push(`created_at >= $${params.length}::timestamptz`);
    }
  }

  if (options.toDate) {
    const d = new Date(options.toDate);
    if (!Number.isNaN(d.getTime())) {
      // Include full end day if YYYY-MM-DD supplied
      if (/^\d{4}-\d{2}-\d{2}$/.test(options.toDate.trim())) {
        d.setUTCHours(23, 59, 59, 999);
      }
      params.push(d.toISOString());
      conditions.push(`created_at <= $${params.length}::timestamptz`);
    }
  }

  if (options.search && options.search.trim()) {
    params.push(`%${options.search.trim()}%`);
    conditions.push(
      `(earning_id ILIKE $${params.length} OR gift_transaction_id ILIKE $${params.length} OR gift_name_snapshot ILIKE $${params.length} OR sender_nickname ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.join(' AND ');
  const countRows = await query(
    `SELECT COUNT(*)::int AS total FROM popolive.host_earning_shares WHERE ${whereClause}`,
    params
  );
  const total = countRows[0]?.total ?? 0;

  const rows = await query(
    `SELECT * FROM popolive.host_earning_shares
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items: rows.map(mapHostEarningRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function queryAdminHostEarnings(filters: {
  hostUserId?: string;
  senderUserId?: string;
  giftId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(200, Math.max(1, filters.limit || 40));
  const offset = (page - 1) * limit;

  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters.hostUserId?.trim()) {
    params.push(`%${filters.hostUserId.trim()}%`);
    conditions.push(`(host_user_id ILIKE $${params.length} OR host_nickname ILIKE $${params.length})`);
  }
  if (filters.senderUserId?.trim()) {
    params.push(`%${filters.senderUserId.trim()}%`);
    conditions.push(`(sender_user_id ILIKE $${params.length} OR sender_nickname ILIKE $${params.length})`);
  }
  if (filters.giftId?.trim() && filters.giftId !== 'all') {
    params.push(filters.giftId.trim());
    conditions.push(`gift_id = $${params.length}`);
  }
  if (filters.status && ['credited', 'reversed', 'failed'].includes(filters.status)) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.fromDate) {
    const d = new Date(filters.fromDate);
    if (!Number.isNaN(d.getTime())) {
      params.push(d.toISOString());
      conditions.push(`created_at >= $${params.length}::timestamptz`);
    }
  }
  if (filters.toDate) {
    const d = new Date(filters.toDate);
    if (!Number.isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.toDate.trim())) {
        d.setUTCHours(23, 59, 59, 999);
      }
      params.push(d.toISOString());
      conditions.push(`created_at <= $${params.length}::timestamptz`);
    }
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(earning_id ILIKE $${params.length} OR gift_transaction_id ILIKE $${params.length} OR host_nickname ILIKE $${params.length} OR sender_nickname ILIKE $${params.length} OR gift_name_snapshot ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.join(' AND ');

  const [summaryRows, countRows, rows] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'credited' THEN original_coin_amount ELSE 0 END), 0)::bigint AS total_coins_processed,
         COALESCE(SUM(CASE WHEN status = 'credited' THEN points_credited ELSE 0 END), 0)::bigint AS total_host_points_credited,
         COALESCE(SUM(CASE WHEN status = 'credited' THEN platform_share_amount ELSE 0 END), 0)::bigint AS total_platform_share,
         COUNT(*) FILTER (WHERE status = 'credited')::int AS credited_count,
         COUNT(*) FILTER (WHERE status = 'reversed')::int AS reversed_count
       FROM popolive.host_earning_shares
       WHERE ${whereClause}`,
      params
    ),
    query(`SELECT COUNT(*)::int AS total FROM popolive.host_earning_shares WHERE ${whereClause}`, params),
    query(
      `SELECT * FROM popolive.host_earning_shares
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
  ]);

  const s = summaryRows[0] || {};
  const total = countRows[0]?.total ?? 0;

  return {
    summary: {
      totalCoinsProcessed: parseInt(String(s.total_coins_processed ?? '0'), 10),
      totalHostPointsCredited: parseInt(String(s.total_host_points_credited ?? '0'), 10),
      totalPlatformShare: parseInt(String(s.total_platform_share ?? '0'), 10),
      creditedCount: parseInt(String(s.credited_count ?? '0'), 10),
      reversedCount: parseInt(String(s.reversed_count ?? '0'), 10),
    },
    records: rows.map(mapHostEarningRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function escapeCsvCell(value: any): string {
  const str = String(value ?? '');
  // Prevent CSV spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportAdminHostEarningsCsv(filters: {
  hostUserId?: string;
  senderUserId?: string;
  giftId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}): Promise<string> {
  const result = await queryAdminHostEarnings({ ...filters, page: 1, limit: 2000 });
  const headers = [
    'Earning ID',
    'Gift Transaction ID',
    'Host User ID',
    'Host Nickname',
    'Sender User ID',
    'Sender Nickname',
    'Gift ID',
    'Gift Name',
    'Quantity',
    'Source Type',
    'Original Coins',
    'Host Share %',
    'Host Points Credited',
    'Platform Share %',
    'Platform Share Coins',
    'Status',
    'Reversal Reference',
    'Created At (UTC)',
  ];

  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const r of result.records) {
    lines.push(
      [
        r.earningId,
        r.giftTransactionId,
        r.hostUserId,
        r.hostNickname,
        r.senderUserId,
        r.senderNickname,
        r.giftId,
        r.giftName,
        r.giftQuantity,
        r.sourceType,
        r.originalCoinAmount,
        r.hostSharePercentage,
        r.pointsCredited,
        r.platformSharePercentage,
        r.platformShareAmount,
        r.status,
        r.reversalReference || '',
        r.createdAt,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return lines.join('\r\n');
}
