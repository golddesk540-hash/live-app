import { query, withTransaction } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import {
  DEFAULT_DEMO_WALLET_USER_ID,
  calculateHostShare,
  emitWalletRealtimeEvent,
  ensureWalletLocked,
  generateTxId,
  getFinanceRules,
  getWalletSummary,
  isAuthorizedFinanceAdmin,
  logWalletAudit,
  mapWalletRow,
  processAtomicGiftTransfer,
} from '@/lib/wallet';
import {
  GiftCatalogItem,
  GiftCategoryRecord,
  bumpCacheVersion,
  getGiftCatalog,
  getGiftCategories,
} from '@/lib/giftCatalog';
import { FALLBACK_GIFT_IMAGE_URL, FALLBACK_GIFT_THUMBNAIL_URL } from '@/lib/giftAssets';

// =============================================================================
// Popo Live Phase 7 Module 7.3 — Real-Time Gift Sending Engine
// Connects Module 7.1 Wallet + Module 7.2 Gift Catalog + Live Rooms + PK Battles
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PK_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const DEFAULT_LIVE_ROOM_NUMBER = '880219';

const FORBIDDEN_OVERRIDE_KEYS = [
  'coinPriceOverride',
  'coinPrice',
  'unitPrice',
  'unitCoinPrice',
  'totalCoins',
  'totalCoinAmount',
  'totalCoinOverride',
  'hostPoints',
  'hostPointsCredited',
  'pointsCredited',
  'sharePercentage',
  'hostSharePercentage',
  'platformShare',
  'platformShareAmount',
  'platformSharePercentage',
  'senderBalance',
  'availableCoins',
  'coinAmountOverride',
];

const memoryRateWindows = new Map<string, { count: number; expiresAt: number }>();

export interface GiftRoomHostOption {
  hostId: string;
  nickname: string;
  avatarUrl: string;
  side: 'host_a' | 'host_b' | 'live_host';
  score: number;
  roomNumber: string | null;
  badge: string;
}

export interface ResolvedRoomStage {
  mode: 'pk_battle' | 'live_room';
  roomScope: string;
  liveRoomId: string | null;
  roomNumber: string | null;
  roomTitle: string;
  roomStatus: string;
  isLive: boolean;
  pkBattleId: string | null;
  pkStatus: string | null;
  pkRemainingSeconds: number;
  pkDurationSeconds: number;
  pkHostAScore: number;
  pkHostBScore: number;
  hosts: GiftRoomHostOption[];
}

export interface GiftQuantityRules {
  minQuantity: number;
  maxQuantity: number;
  rateLimitPer10s: number;
  hostSharePercent: number;
}

export interface GiftSendingContext extends ResolvedRoomStage {
  quantityRules: GiftQuantityRules;
  categories: GiftCategoryRecord[];
  gifts: GiftCatalogItem[];
  senderWallet: {
    userId: string;
    availableCoins: number;
    totalSpentCoins: number;
    isFrozen: boolean;
    balanceVisible: boolean;
  };
}

export interface GiftPreviewQuote {
  valid: boolean;
  giftId: string;
  giftName: string;
  giftNameUr: string;
  thumbnailUrl: string;
  imageUrl: string;
  animationUrl: string | null;
  assetType: string;
  recipientHostId: string;
  recipientNickname: string;
  recipientAvatarUrl: string;
  pkHostSide: 'host_a' | 'host_b' | null;
  unitCoinPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  allowedQuantities: number[];
  totalCoinAmount: number;
  currentCoinBalance: number;
  remainingCoinBalance: number;
  insufficientBalance: boolean;
  shortfallCoins: number;
  hostPointsToCredit: number;
  platformShareCoins: number;
  sharePercentage: number;
}

export interface GiftTransactionRecord {
  id: string;
  giftTransactionId: string;
  senderUserId: string;
  senderNickname: string;
  recipientHostId: string;
  recipientNickname: string;
  liveRoomId: string | null;
  pkBattleId: string | null;
  pkHostSide: string | null;
  giftId: string;
  giftNameSnapshot: string;
  giftPriceSnapshot: number;
  quantity: number;
  totalCoinAmount: number;
  hostPointsCredited: number;
  platformShare: number;
  sharePercentage: number;
  status: 'processing' | 'completed' | 'failed' | 'reversed';
  failureCode: string | null;
  failureReason: string | null;
  coinTxId: string | null;
  pointsTxId: string | null;
  idempotencyKey: string | null;
  reversalReason: string | null;
  reversedBy: string | null;
  reversedAt: string | null;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  imageUrl?: string;
}

export interface SendGiftResult {
  success: boolean;
  deduplicated?: boolean;
  statusCode: number;
  errorCode?: string;
  message?: string;
  transaction?: GiftTransactionRecord;
  updatedSenderWallet?: {
    userId: string;
    availableCoins: number;
    totalSpentCoins: number;
    hostPointsBalance?: number;
  };
  updatedHostStats?: {
    hostId: string;
    nickname: string;
    pointsCredited: number;
    newHostPointsBalance: number;
    pkHostAScore?: number;
    pkHostBScore?: number;
    roomCoinsEarned?: number;
  };
  topUpRecommended?: boolean;
  topUpUrl?: string;
  shortfallCoins?: number;
}

export class GiftSendValidationError extends Error {
  statusCode: number;
  errorCode: string;
  details?: Record<string, any>;

  constructor(statusCode: number, errorCode: string, message: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

function mapGiftTxRow(row: any): GiftTransactionRecord {
  return {
    id: row.id,
    giftTransactionId: row.gift_transaction_id,
    senderUserId: row.sender_user_id,
    senderNickname: row.sender_nickname || 'Supporter',
    recipientHostId: row.recipient_host_id,
    recipientNickname: row.recipient_nickname || 'Host',
    liveRoomId: row.live_room_id || null,
    pkBattleId: row.pk_battle_id || null,
    pkHostSide: row.pk_host_side || null,
    giftId: row.gift_id,
    giftNameSnapshot: row.gift_name_snapshot,
    giftPriceSnapshot: parseInt(String(row.gift_price_snapshot ?? '0'), 10),
    quantity: parseInt(String(row.quantity ?? '1'), 10),
    totalCoinAmount: parseInt(String(row.total_coin_amount ?? '0'), 10),
    hostPointsCredited: parseInt(String(row.host_points_credited ?? '0'), 10),
    platformShare: parseInt(String(row.platform_share ?? '0'), 10),
    sharePercentage: Number(row.share_percentage ?? 70),
    status: row.status,
    failureCode: row.failure_code || null,
    failureReason: row.failure_reason || null,
    coinTxId: row.coin_tx_id || null,
    pointsTxId: row.points_tx_id || null,
    idempotencyKey: row.idempotency_key || null,
    reversalReason: row.reversal_reason || null,
    reversedBy: row.reversed_by || null,
    reversedAt: row.reversed_at ? new Date(row.reversed_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    thumbnailUrl: row.thumbnail_url || undefined,
    imageUrl: row.image_url || undefined,
  };
}

export function assertNoClientFinancialOverrides(body: Record<string, any> | null | undefined): string | null {
  if (!body || typeof body !== 'object') return null;
  for (const key of FORBIDDEN_OVERRIDE_KEYS) {
    if (body[key] !== undefined && body[key] !== null) {
      return key;
    }
  }
  return null;
}

export async function getGiftQuantityRules(): Promise<GiftQuantityRules> {
  const rules = await getFinanceRules();
  const rows = await query<{ rule_key: string; rule_value: string }>(
    `SELECT rule_key, rule_value FROM popolive.finance_rules
     WHERE rule_key IN ('min_gift_quantity', 'max_gift_quantity', 'gift_rate_limit_per_10s')`
  );
  const map: Record<string, number> = {};
  for (const r of rows) {
    map[r.rule_key] = Math.max(1, Math.floor(Number(r.rule_value)));
  }
  return {
    minQuantity: map.min_gift_quantity ?? 1,
    maxQuantity: map.max_gift_quantity ?? 99,
    rateLimitPer10s: map.gift_rate_limit_per_10s ?? 30,
    hostSharePercent: rules.hostGiftSharePercent ?? 70,
  };
}

export async function checkGiftRateLimit(senderUserId: string, limitPer10s: number): Promise<{ allowed: boolean; count: number }> {
  const safeLimit = Math.max(1, limitPer10s);
  const key = `gift_sending:rate:${senderUserId}`;
  const redis = await getRedisClient();

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 10);
      }
      return { allowed: count <= safeLimit, count };
    } catch {
      // Fall through to memory fallback if Redis hiccups
    }
  }

  const now = Date.now();
  const entry = memoryRateWindows.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryRateWindows.set(key, { count: 1, expiresAt: now + 10_000 });
    return { allowed: 1 <= safeLimit, count: 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= safeLimit, count: entry.count };
}

export async function resolveRoomStage(options: {
  roomId?: string | null;
  liveRoomId?: string | null;
  pkBattleId?: string | null;
  requireActiveForSend?: boolean;
}): Promise<ResolvedRoomStage> {
  const rawRoom = (options.liveRoomId || options.roomId || '').trim() || null;
  const rawPk = (options.pkBattleId || '').trim() || null;

  if (rawPk) {
    if (!UUID_REGEX.test(rawPk)) {
      throw new GiftSendValidationError(404, 'PK_BATTLE_NOT_FOUND', 'PK battle does not exist.');
    }
    const battles = await query<any>(
      `SELECT id, status, host_a_id, host_a_room, host_a_nickname, host_a_avatar,
              host_b_id, host_b_room, host_b_nickname, host_b_avatar,
              host_a_score, host_b_score, remaining_seconds, duration_seconds
       FROM popolive.pk_battles
       WHERE id = $1
       LIMIT 1`,
      [rawPk]
    );
    if (battles.length === 0) {
      throw new GiftSendValidationError(404, 'PK_BATTLE_NOT_FOUND', 'PK battle does not exist.');
    }
    const b = battles[0];
    if (options.requireActiveForSend && b.status !== 'active') {
      throw new GiftSendValidationError(
        400,
        'BATTLE_ENDED',
        `Cannot send gifts to a ${b.status} PK battle.`
      );
    }

    return {
      mode: 'pk_battle',
      roomScope: `pk:${b.id}`,
      liveRoomId: rawRoom || b.host_a_room || null,
      roomNumber: rawRoom || b.host_a_room || null,
      roomTitle: `${b.host_a_nickname} VS ${b.host_b_nickname}`,
      roomStatus: b.status,
      isLive: b.status === 'active',
      pkBattleId: b.id,
      pkStatus: b.status,
      pkRemainingSeconds: parseInt(String(b.remaining_seconds ?? '0'), 10),
      pkDurationSeconds: parseInt(String(b.duration_seconds ?? '300'), 10),
      pkHostAScore: parseInt(String(b.host_a_score ?? '0'), 10),
      pkHostBScore: parseInt(String(b.host_b_score ?? '0'), 10),
      hosts: [
        {
          hostId: b.host_a_id,
          nickname: b.host_a_nickname || 'Host A',
          avatarUrl: b.host_a_avatar || '/assets/following/host1@2x.png',
          side: 'host_a',
          score: parseInt(String(b.host_a_score ?? '0'), 10),
          roomNumber: b.host_a_room || null,
          badge: 'Host A',
        },
        {
          hostId: b.host_b_id,
          nickname: b.host_b_nickname || 'Host B',
          avatarUrl: b.host_b_avatar || '/assets/following/host2@2x.png',
          side: 'host_b',
          score: parseInt(String(b.host_b_score ?? '0'), 10),
          roomNumber: b.host_b_room || null,
          badge: 'Host B',
        },
      ],
    };
  }

  if (rawRoom) {
    const rooms = await query<any>(
      `SELECT lr.id, lr.room_number, lr.host_id, lr.title, lr.cover_url, lr.status,
              lr.is_live, lr.is_pk, lr.current_pk_id, lr.coins_earned,
              u.nickname AS host_nickname, u.avatar_url AS host_avatar_url
       FROM popolive.live_rooms lr
       LEFT JOIN popolive.users u ON u.id = lr.host_id
       WHERE lr.room_number = $1 OR lr.id::text = $1
       LIMIT 1`,
      [rawRoom]
    );
    if (rooms.length === 0) {
      throw new GiftSendValidationError(404, 'ROOM_NOT_FOUND', 'Live room does not exist.');
    }
    const r = rooms[0];
    if (options.requireActiveForSend && (r.status !== 'live' || !r.is_live)) {
      throw new GiftSendValidationError(
        400,
        'ROOM_ENDED',
        'Cannot send gifts because this live room has ended or is offline.'
      );
    }

    if (r.is_pk && r.current_pk_id) {
      const battleRows = await query<any>(
        `SELECT id, status, host_a_id, host_a_room, host_a_nickname, host_a_avatar,
                host_b_id, host_b_room, host_b_nickname, host_b_avatar,
                host_a_score, host_b_score, remaining_seconds, duration_seconds
         FROM popolive.pk_battles WHERE id = $1 LIMIT 1`,
        [r.current_pk_id]
      );
      if (battleRows.length > 0 && battleRows[0].status === 'active') {
        const b = battleRows[0];
        return {
          mode: 'pk_battle',
          roomScope: `pk:${b.id}`,
          liveRoomId: r.room_number,
          roomNumber: r.room_number,
          roomTitle: r.title || `${b.host_a_nickname} VS ${b.host_b_nickname}`,
          roomStatus: r.status,
          isLive: Boolean(r.is_live),
          pkBattleId: b.id,
          pkStatus: b.status,
          pkRemainingSeconds: parseInt(String(b.remaining_seconds ?? '0'), 10),
          pkDurationSeconds: parseInt(String(b.duration_seconds ?? '300'), 10),
          pkHostAScore: parseInt(String(b.host_a_score ?? '0'), 10),
          pkHostBScore: parseInt(String(b.host_b_score ?? '0'), 10),
          hosts: [
            {
              hostId: b.host_a_id,
              nickname: b.host_a_nickname || 'Host A',
              avatarUrl: b.host_a_avatar || '/assets/following/host1@2x.png',
              side: 'host_a',
              score: parseInt(String(b.host_a_score ?? '0'), 10),
              roomNumber: b.host_a_room || r.room_number,
              badge: 'Host A',
            },
            {
              hostId: b.host_b_id,
              nickname: b.host_b_nickname || 'Host B',
              avatarUrl: b.host_b_avatar || '/assets/following/host2@2x.png',
              side: 'host_b',
              score: parseInt(String(b.host_b_score ?? '0'), 10),
              roomNumber: b.host_b_room || null,
              badge: 'Host B',
            },
          ],
        };
      }
    }

    const hostId = String(r.host_id);
    return {
      mode: 'live_room',
      roomScope: `room:${r.room_number}`,
      liveRoomId: r.room_number,
      roomNumber: r.room_number,
      roomTitle: r.title || 'Live Broadcast',
      roomStatus: r.status,
      isLive: Boolean(r.is_live),
      pkBattleId: null,
      pkStatus: null,
      pkRemainingSeconds: 0,
      pkDurationSeconds: 0,
      pkHostAScore: 0,
      pkHostBScore: 0,
      hosts: [
        {
          hostId,
          nickname: r.host_nickname || 'Live Host',
          avatarUrl: r.host_avatar_url || r.cover_url || '/assets/studio/host_zara_avatar.png',
          side: 'live_host',
          score: parseInt(String(r.coins_earned ?? '0'), 10),
          roomNumber: r.room_number,
          badge: 'Live Host',
        },
      ],
    };
  }

  if (options.requireActiveForSend) {
    throw new GiftSendValidationError(
      400,
      'ROOM_OR_BATTLE_REQUIRED',
      'An active liveRoomId or pkBattleId is required to send gifts.'
    );
  }

  try {
    return await resolveRoomStage({ pkBattleId: DEFAULT_PK_BATTLE_ID, requireActiveForSend: false });
  } catch {
    return resolveRoomStage({ roomId: DEFAULT_LIVE_ROOM_NUMBER, requireActiveForSend: false });
  }
}

async function loadAuthoritativeGift(giftId: string): Promise<GiftCatalogItem> {
  const cleanId = (giftId || '').trim();
  if (!cleanId) {
    throw new GiftSendValidationError(400, 'GIFT_ID_REQUIRED', 'giftId is required.');
  }
  const rows = await query<any>(
    `SELECT g.*, c.name AS category_name, c.name_ur AS category_name_ur, c.is_active AS category_is_active
     FROM popolive.gift_catalog g
     JOIN popolive.gift_categories c ON c.category_id = g.category_id
     WHERE g.gift_id = $1 OR g.id::text = $1
     LIMIT 1`,
    [cleanId]
  );
  if (rows.length === 0) {
    throw new GiftSendValidationError(404, 'GIFT_NOT_FOUND', 'Virtual gift does not exist.');
  }
  const r = rows[0];
  const isAvailable = Boolean(r.is_active) && Boolean(r.category_is_active);
  if (!isAvailable) {
    throw new GiftSendValidationError(
      400,
      'GIFT_UNAVAILABLE',
      'This virtual gift or its category is currently disabled.'
    );
  }
  return {
    id: r.id,
    giftId: r.gift_id,
    name: r.name,
    nameUr: r.name_ur,
    description: r.description,
    descriptionUr: r.description_ur,
    coinPrice: parseInt(String(r.coin_price ?? '0'), 10),
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryNameUr: r.category_name_ur,
    thumbnailUrl: r.thumbnail_url || FALLBACK_GIFT_THUMBNAIL_URL,
    imageUrl: r.image_url || FALLBACK_GIFT_IMAGE_URL,
    animationUrl: r.animation_url || null,
    assetType: r.asset_type || 'png',
    giftType: r.gift_type || 'standard',
    usageCount: parseInt(String(r.usage_count ?? '0'), 10),
    isPopular: Boolean(r.is_popular),
    isNew: Boolean(r.is_new),
    isFeatured: Boolean(r.is_featured),
    displayOrder: parseInt(String(r.display_order ?? '100'), 10),
    isActive: true,
    maxQuantity: parseInt(String(r.max_quantity ?? '99'), 10),
    allowedQuantities:
      Array.isArray(r.allowed_quantities) && r.allowed_quantities.length > 0
        ? r.allowed_quantities.map((n: any) => parseInt(String(n), 10)).filter((n: number) => n > 0)
        : [1, 5, 10, 66, 99],
    fallbackImageUrl: FALLBACK_GIFT_IMAGE_URL,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

function validateAndComputeQuantity(
  rawQty: unknown,
  gift: GiftCatalogItem,
  rules: GiftQuantityRules
): { quantity: number; minQuantity: number; maxQuantity: number; allowedQuantities: number[] } {
  const num = Number(rawQty);
  const minQty = Math.max(1, rules.minQuantity);
  const maxQty = Math.max(minQty, Math.min(rules.maxQuantity, gift.maxQuantity || rules.maxQuantity));
  const allowed = (gift.allowedQuantities || [1, 5, 10, 66, 99]).filter((q) => q >= minQty && q <= maxQty);

  if (!Number.isInteger(num) || num < minQty || num > maxQty) {
    throw new GiftSendValidationError(
      400,
      'INVALID_QUANTITY',
      `Gift quantity must be an integer between ${minQty} and ${maxQty} for ${gift.name}.`,
      { minQuantity: minQty, maxQuantity: maxQty }
    );
  }
  return {
    quantity: num,
    minQuantity: minQty,
    maxQuantity: maxQty,
    allowedQuantities: allowed.length > 0 ? allowed : [1],
  };
}

function resolveRecipientFromStage(stage: ResolvedRoomStage, recipientHostId: string): GiftRoomHostOption {
  const cleanRecipient = (recipientHostId || '').trim();
  if (!cleanRecipient) {
    throw new GiftSendValidationError(400, 'RECIPIENT_REQUIRED', 'recipientHostId is required.');
  }
  const match = stage.hosts.find((h) => h.hostId === cleanRecipient);
  if (!match) {
    throw new GiftSendValidationError(
      403,
      'INVALID_RECIPIENT',
      'Selected recipient is not an approved host in this active live room or PK battle.'
    );
  }
  return match;
}

async function resolveNickname(userId: string, fallback: string = 'Supporter'): Promise<string> {
  if (userId === DEFAULT_DEMO_WALLET_USER_ID) return 'Supporter 701';
  if (UUID_REGEX.test(userId)) {
    const rows = await query<{ nickname: string }>('SELECT nickname FROM popolive.users WHERE id = $1 LIMIT 1', [
      userId,
    ]);
    if (rows[0]?.nickname) return rows[0].nickname;
  }
  return fallback;
}

async function recordFailedGiftTransaction(params: {
  senderUserId: string;
  senderNickname: string;
  recipientHostId: string;
  recipientNickname: string;
  stage: ResolvedRoomStage;
  recipientSide: string | null;
  gift: GiftCatalogItem;
  quantity: number;
  totalCoins: number;
  sharePercentage: number;
  failureCode: string;
  failureReason: string;
  coinTxId?: string | null;
}): Promise<GiftTransactionRecord> {
  const gftTxId = generateTxId('GFT');
  const rows = await query<any>(
    `INSERT INTO popolive.gift_transactions (
       gift_transaction_id, sender_user_id, sender_nickname,
       recipient_host_id, recipient_nickname, live_room_id, pk_battle_id, pk_host_side,
       gift_id, gift_name_snapshot, gift_price_snapshot, quantity, total_coin_amount,
       host_points_credited, platform_share, share_percentage,
       status, failure_code, failure_reason, coin_tx_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,0,$14,'failed',$15,$16,$17)
     RETURNING *`,
    [
      gftTxId,
      params.senderUserId,
      params.senderNickname,
      params.recipientHostId,
      params.recipientNickname,
      params.stage.liveRoomId,
      params.stage.pkBattleId,
      params.recipientSide,
      params.gift.giftId,
      params.gift.name,
      params.gift.coinPrice,
      params.quantity,
      params.totalCoins,
      params.sharePercentage,
      params.failureCode,
      params.failureReason,
      params.coinTxId || null,
    ]
  );

  await query(
    `INSERT INTO popolive.gift_realtime_events (room_scope, sender_user_id, recipient_host_id, event_type, payload)
     VALUES ($1, $2, $3, 'gift:transaction_failed', $4::jsonb)`,
    [
      params.stage.roomScope,
      params.senderUserId,
      params.recipientHostId,
      JSON.stringify({
        giftTransactionId: gftTxId,
        senderUserId: params.senderUserId,
        giftId: params.gift.giftId,
        giftName: params.gift.name,
        quantity: params.quantity,
        totalCoinAmount: params.totalCoins,
        failureCode: params.failureCode,
        failureReason: params.failureReason,
        topUpRecommended: params.failureCode === 'INSUFFICIENT_COINS',
        emittedAt: new Date().toISOString(),
      }),
    ]
  );

  return mapGiftTxRow(rows[0]);
}

export async function getGiftSendingContext(options: {
  senderUserId: string;
  roomId?: string | null;
  liveRoomId?: string | null;
  pkBattleId?: string | null;
  categoryId?: string | null;
  search?: string | null;
  canReadPrivateBalance: boolean;
}): Promise<GiftSendingContext> {
  const [stage, quantityRules, categories, catalogRes] = await Promise.all([
    resolveRoomStage({
      roomId: options.roomId,
      liveRoomId: options.liveRoomId,
      pkBattleId: options.pkBattleId,
      requireActiveForSend: false,
    }),
    getGiftQuantityRules(),
    getGiftCategories({ includeInactive: false }),
    getGiftCatalog({
      categoryId: options.categoryId || 'all',
      search: options.search || '',
      limit: 60,
      includeInactive: false,
    }),
  ]);

  let availableCoins = 0;
  let totalSpentCoins = 0;
  let isFrozen = false;

  if (options.canReadPrivateBalance) {
    const walletSummary = await getWalletSummary(options.senderUserId, true);
    availableCoins = walletSummary.coins;
    totalSpentCoins = walletSummary.totalSpentCoins;
    isFrozen = walletSummary.isFrozen;
  }

  return {
    ...stage,
    quantityRules,
    categories,
    gifts: catalogRes.gifts,
    senderWallet: {
      userId: options.senderUserId,
      availableCoins,
      totalSpentCoins,
      isFrozen,
      balanceVisible: options.canReadPrivateBalance,
    },
  };
}

export async function previewGiftSend(params: {
  senderUserId: string;
  giftId: string;
  quantity: number;
  recipientHostId: string;
  roomId?: string | null;
  liveRoomId?: string | null;
  pkBattleId?: string | null;
}): Promise<GiftPreviewQuote> {
  const [stage, gift, rules, walletSummary] = await Promise.all([
    resolveRoomStage({
      roomId: params.roomId,
      liveRoomId: params.liveRoomId,
      pkBattleId: params.pkBattleId,
      requireActiveForSend: true,
    }),
    loadAuthoritativeGift(params.giftId),
    getGiftQuantityRules(),
    getWalletSummary(params.senderUserId, true),
  ]);

  if (params.senderUserId === params.recipientHostId) {
    throw new GiftSendValidationError(400, 'SELF_GIFT_FORBIDDEN', 'Hosts cannot send gifts to themselves.');
  }

  const hostOption = resolveRecipientFromStage(stage, params.recipientHostId);
  const qtyMeta = validateAndComputeQuantity(params.quantity, gift, rules);
  const totalCoinAmount = gift.coinPrice * qtyMeta.quantity;
  const currentCoinBalance = walletSummary.coins;
  const remainingCoinBalance = currentCoinBalance - totalCoinAmount;
  const insufficientBalance = remainingCoinBalance < 0;
  const shortfallCoins = insufficientBalance ? Math.abs(remainingCoinBalance) : 0;
  const shareCalc = await calculateHostShare(totalCoinAmount);
  const hostPointsToCredit = shareCalc.pointsEarned;
  const platformShareCoins = totalCoinAmount - hostPointsToCredit;

  return {
    valid: !insufficientBalance && !walletSummary.isFrozen,
    giftId: gift.giftId,
    giftName: gift.name,
    giftNameUr: gift.nameUr,
    thumbnailUrl: gift.thumbnailUrl,
    imageUrl: gift.imageUrl,
    animationUrl: gift.animationUrl,
    assetType: gift.assetType,
    recipientHostId: hostOption.hostId,
    recipientNickname: hostOption.nickname,
    recipientAvatarUrl: hostOption.avatarUrl,
    pkHostSide: hostOption.side === 'host_a' || hostOption.side === 'host_b' ? hostOption.side : null,
    unitCoinPrice: gift.coinPrice,
    quantity: qtyMeta.quantity,
    minQuantity: qtyMeta.minQuantity,
    maxQuantity: qtyMeta.maxQuantity,
    allowedQuantities: qtyMeta.allowedQuantities,
    totalCoinAmount,
    currentCoinBalance,
    remainingCoinBalance: Math.max(0, remainingCoinBalance),
    insufficientBalance,
    shortfallCoins,
    hostPointsToCredit,
    platformShareCoins,
    sharePercentage: shareCalc.sharePercent,
  };
}

export async function sendRealTimeGift(params: {
  senderUserId: string;
  senderNickname?: string | null;
  recipientHostId: string;
  giftId: string;
  quantity: number;
  roomId?: string | null;
  liveRoomId?: string | null;
  pkBattleId?: string | null;
  idempotencyKey?: string | null;
  ipAddress?: string;
}): Promise<SendGiftResult> {
  const cleanKey = params.idempotencyKey?.trim() || null;

  // 1. Pre-check idempotency on completed/reversed transactions
  if (cleanKey) {
    const existing = await query<any>(
      `SELECT gt.*, g.thumbnail_url, g.image_url
       FROM popolive.gift_transactions gt
       LEFT JOIN popolive.gift_catalog g ON g.gift_id = gt.gift_id
       WHERE gt.idempotency_key = $1 AND gt.status IN ('completed', 'reversed')
       LIMIT 1`,
      [cleanKey]
    );
    if (existing.length > 0) {
      const row = existing[0];
      if (row.sender_user_id !== params.senderUserId) {
        return {
          success: false,
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key belongs to another user.',
        };
      }
      const mapped = mapGiftTxRow(row);
      const senderSummary = await getWalletSummary(params.senderUserId, true);
      const hostSummary = await getWalletSummary(row.recipient_host_id, true);
      return {
        success: true,
        deduplicated: true,
        statusCode: 200,
        transaction: mapped,
        updatedSenderWallet: {
          userId: params.senderUserId,
          availableCoins: senderSummary.coins,
          totalSpentCoins: senderSummary.totalSpentCoins,
          hostPointsBalance: senderSummary.points,
        },
        updatedHostStats: {
          hostId: row.recipient_host_id,
          nickname: row.recipient_nickname,
          pointsCredited: 0,
          newHostPointsBalance: hostSummary.points,
        },
      };
    }
  }

  // 2. Enforce rate limit
  const rules = await getGiftQuantityRules();
  const rate = await checkGiftRateLimit(params.senderUserId, rules.rateLimitPer10s);
  if (!rate.allowed) {
    return {
      success: false,
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      message: `Too many gift requests (${rate.count}/${rules.rateLimitPer10s} per 10s). Please pause briefly.`,
    };
  }

  // 3. Authoritative server-side validations
  let stage: ResolvedRoomStage;
  let gift: GiftCatalogItem;
  let hostOption: GiftRoomHostOption;
  let qtyMeta: { quantity: number; minQuantity: number; maxQuantity: number; allowedQuantities: number[] };

  try {
    stage = await resolveRoomStage({
      roomId: params.roomId,
      liveRoomId: params.liveRoomId,
      pkBattleId: params.pkBattleId,
      requireActiveForSend: true,
    });
    if (params.senderUserId === params.recipientHostId) {
      throw new GiftSendValidationError(400, 'SELF_GIFT_FORBIDDEN', 'Hosts cannot send gifts to themselves.');
    }
    hostOption = resolveRecipientFromStage(stage, params.recipientHostId);
    gift = await loadAuthoritativeGift(params.giftId);
    qtyMeta = validateAndComputeQuantity(params.quantity, gift, rules);
  } catch (err: any) {
    if (err instanceof GiftSendValidationError) {
      return {
        success: false,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
      };
    }
    throw err;
  }

  const totalCoins = gift.coinPrice * qtyMeta.quantity;
  if (!Number.isSafeInteger(totalCoins) || totalCoins <= 0) {
    return {
      success: false,
      statusCode: 400,
      errorCode: 'INVALID_COIN_AMOUNT',
      message: 'Calculated coin total is out of safe bounds.',
    };
  }

  const resolvedSenderName =
    (params.senderNickname && params.senderNickname.trim()) ||
    (await resolveNickname(params.senderUserId, 'Supporter'));
  const pkSide = hostOption.side === 'host_a' || hostOption.side === 'host_b' ? hostOption.side : null;
  const gftTxId = generateTxId('GFT');
  const referenceId = stage.pkBattleId
    ? `pk:${stage.pkBattleId}:${gftTxId}`
    : `room:${stage.liveRoomId}:${gftTxId}`;

  let committedTx: GiftTransactionRecord | null = null;
  let updatedPkHostAScore: number | undefined;
  let updatedPkHostBScore: number | undefined;
  let updatedRoomCoinsEarned: number | undefined;

  // 4. Execute Single Atomic Transaction
  let transferRes: Awaited<ReturnType<typeof processAtomicGiftTransfer>>;
  try {
    transferRes = await processAtomicGiftTransfer({
      senderId: params.senderUserId,
      senderName: resolvedSenderName,
      hostUserId: hostOption.hostId,
      giftCoins: totalCoins,
      giftName: `${gift.name}${qtyMeta.quantity > 1 ? ` x${qtyMeta.quantity}` : ''}`,
      isPkBattle: Boolean(stage.pkBattleId),
      referenceId,
      idempotencyKey: cleanKey ? `wlt_${cleanKey}` : undefined,
      onSuccessInTransaction: async (ctx) => {
        const client = ctx.client;
        const pointsEarned = ctx.hostPointsEarned;
        const platformShare = totalCoins - pointsEarned;
        const coinTxId = ctx.coinTxRow.transaction_id;
        const ptsTxId = ctx.ptsTxRow.transaction_id;

        if (stage.pkBattleId) {
          const bLock = await client.query(
            `SELECT status, host_a_id, host_b_id, host_a_score, host_b_score
             FROM popolive.pk_battles WHERE id = $1 FOR UPDATE`,
            [stage.pkBattleId]
          );
          if (bLock.rows.length === 0 || bLock.rows[0].status !== 'active') {
            throw new GiftSendValidationError(400, 'BATTLE_ENDED', 'PK battle ended before gift completed.');
          }
          const bRow = bLock.rows[0];
          const prevA = parseInt(String(bRow.host_a_score ?? '0'), 10);
          const prevB = parseInt(String(bRow.host_b_score ?? '0'), 10);
          updatedPkHostAScore = pkSide === 'host_a' ? prevA + totalCoins : prevA;
          updatedPkHostBScore = pkSide === 'host_b' ? prevB + totalCoins : prevB;
          const leadingId =
            updatedPkHostAScore > updatedPkHostBScore
              ? bRow.host_a_id
              : updatedPkHostBScore > updatedPkHostAScore
              ? bRow.host_b_id
              : null;

          await client.query(
            `UPDATE popolive.pk_battles
             SET host_a_score = $1, host_b_score = $2, leading_host_id = $3, last_synced_at = NOW()
             WHERE id = $4`,
            [updatedPkHostAScore, updatedPkHostBScore, leadingId, stage.pkBattleId]
          );

          await client.query(
            `INSERT INTO popolive.pk_score_events (
               battle_id, host_side, target_host_id, sender_id, sender_name, points, gift_name, idempotency_key
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              stage.pkBattleId,
              pkSide === 'host_b' ? 'host_b' : 'host_a',
              hostOption.hostId,
              params.senderUserId,
              resolvedSenderName,
              totalCoins,
              `${gift.name}${qtyMeta.quantity > 1 ? ` x${qtyMeta.quantity}` : ''}`,
              `pk_score_${gftTxId}`,
            ]
          );
        }

        if (stage.liveRoomId) {
          const rLock = await client.query(
            `SELECT id, status, is_live FROM popolive.live_rooms
             WHERE room_number = $1 OR id::text = $1 FOR UPDATE`,
            [stage.liveRoomId]
          );
          if (rLock.rows.length > 0) {
            if (!stage.pkBattleId && (rLock.rows[0].status !== 'live' || !rLock.rows[0].is_live)) {
              throw new GiftSendValidationError(400, 'ROOM_ENDED', 'Live room ended before gift completed.');
            }
            const updatedRoom = await client.query(
              `UPDATE popolive.live_rooms
               SET coins_earned = COALESCE(coins_earned, 0) + $1,
                   points_received = COALESCE(points_received, 0) + $2,
                   updated_at = NOW()
               WHERE id = $3
               RETURNING coins_earned`,
              [totalCoins, pointsEarned, rLock.rows[0].id]
            );
            updatedRoomCoinsEarned = parseInt(String(updatedRoom.rows[0]?.coins_earned ?? '0'), 10);
          }
        }

        await client.query(
          `UPDATE popolive.gift_catalog
           SET usage_count = usage_count + $1, updated_at = NOW()
           WHERE gift_id = $2`,
          [qtyMeta.quantity, gift.giftId]
        );

        const gftInsert = await client.query(
          `INSERT INTO popolive.gift_transactions (
             gift_transaction_id, sender_user_id, sender_nickname,
             recipient_host_id, recipient_nickname, live_room_id, pk_battle_id, pk_host_side,
             gift_id, gift_name_snapshot, gift_price_snapshot, quantity, total_coin_amount,
             host_points_credited, platform_share, share_percentage,
             status, coin_tx_id, points_tx_id, idempotency_key
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'completed',$17,$18,$19)
           RETURNING *`,
          [
            gftTxId,
            params.senderUserId,
            resolvedSenderName,
            hostOption.hostId,
            hostOption.nickname,
            stage.liveRoomId,
            stage.pkBattleId,
            pkSide,
            gift.giftId,
            gift.name,
            gift.coinPrice,
            qtyMeta.quantity,
            totalCoins,
            pointsEarned,
            platformShare,
            ctx.sharePercent,
            coinTxId,
            ptsTxId,
            cleanKey,
          ]
        );

        committedTx = {
          ...mapGiftTxRow(gftInsert.rows[0]),
          thumbnailUrl: gift.thumbnailUrl,
          imageUrl: gift.imageUrl,
        };

        // Module 7.5: record immutable 70% host share + 30% platform share atomically inside same tx
        const { recordHostEarningShareInTx } = await import('@/lib/hostEarnings');
        await recordHostEarningShareInTx(client, {
          giftTransactionId: gftTxId,
          hostUserId: hostOption.hostId,
          hostNickname: hostOption.nickname,
          senderUserId: params.senderUserId,
          senderNickname: resolvedSenderName,
          giftId: gift.giftId,
          giftName: gift.name,
          giftQuantity: qtyMeta.quantity,
          sourceType: stage.pkBattleId ? 'pk_battle' : stage.liveRoomId ? 'live_room' : 'direct_gift',
          liveRoomId: stage.liveRoomId,
          pkBattleId: stage.pkBattleId,
          originalCoinAmount: totalCoins,
          hostSharePercentage: ctx.sharePercent,
          pointsCredited: pointsEarned,
          platformShareAmount: platformShare,
          pointsTxId: ptsTxId,
          updatedHostPointsBalance: ctx.hostWallet.points,
          updatedTotalReceivedPoints: ctx.hostWallet.totalReceivedPoints,
          pkHostSide: pkSide,
        });

        const nowIso = new Date().toISOString();

        await client.query(
          `INSERT INTO popolive.gift_realtime_events (room_scope, sender_user_id, recipient_host_id, event_type, payload)
           VALUES
             ($1, $2, $3, 'gift:transaction_completed', $4::jsonb),
             ($1, $2, $3, 'gift:coin_balance_updated', $5::jsonb),
             ($1, $2, $3, 'gift:host_points_updated', $6::jsonb),
             ($1, NULL, $3, 'gift:received', $7::jsonb),
             ($1, NULL, $3, 'gift:animation_broadcast', $8::jsonb)`,
          [
            stage.roomScope,
            params.senderUserId,
            hostOption.hostId,
            JSON.stringify({
              giftTransactionId: gftTxId,
              senderUserId: params.senderUserId,
              giftId: gift.giftId,
              quantity: qtyMeta.quantity,
              totalCoinAmount: totalCoins,
              coinTxId,
              availableCoins: ctx.senderWallet.coins,
              emittedAt: nowIso,
            }),
            JSON.stringify({
              userId: params.senderUserId,
              availableCoins: ctx.senderWallet.coins,
              totalSpentCoins: ctx.senderWallet.totalSpentCoins,
              emittedAt: nowIso,
            }),
            JSON.stringify({
              hostId: hostOption.hostId,
              hostPointsEarned: pointsEarned,
              newHostPointsBalance: ctx.hostWallet.points,
              giftTransactionId: gftTxId,
              emittedAt: nowIso,
            }),
            JSON.stringify({
              giftTransactionId: gftTxId,
              senderUserId: params.senderUserId,
              senderNickname: resolvedSenderName,
              recipientHostId: hostOption.hostId,
              recipientNickname: hostOption.nickname,
              liveRoomId: stage.liveRoomId,
              pkBattleId: stage.pkBattleId,
              pkHostSide: pkSide,
              giftId: gift.giftId,
              giftName: gift.name,
              giftNameUr: gift.nameUr,
              thumbnailUrl: gift.thumbnailUrl,
              imageUrl: gift.imageUrl,
              quantity: qtyMeta.quantity,
              totalCoinAmount: totalCoins,
              pkHostAScore: updatedPkHostAScore,
              pkHostBScore: updatedPkHostBScore,
              roomCoinsEarned: updatedRoomCoinsEarned,
              emittedAt: nowIso,
            }),
            JSON.stringify({
              giftTransactionId: gftTxId,
              senderUserId: params.senderUserId,
              senderNickname: resolvedSenderName,
              recipientHostId: hostOption.hostId,
              recipientNickname: hostOption.nickname,
              liveRoomId: stage.liveRoomId,
              pkBattleId: stage.pkBattleId,
              pkHostSide: pkSide,
              giftId: gift.giftId,
              giftName: gift.name,
              giftNameUr: gift.nameUr,
              thumbnailUrl: gift.thumbnailUrl,
              imageUrl: gift.imageUrl,
              animationUrl: gift.animationUrl,
              assetType: gift.assetType,
              giftType: gift.giftType,
              quantity: qtyMeta.quantity,
              totalCoinAmount: totalCoins,
              pkHostAScore: updatedPkHostAScore,
              pkHostBScore: updatedPkHostBScore,
              roomCoinsEarned: updatedRoomCoinsEarned,
              emittedAt: nowIso,
            }),
          ]
        );
      },
    });
  } catch (err: any) {
    if (err instanceof GiftSendValidationError) {
      return {
        success: false,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
      };
    }
    if (err?.code === '23505' && cleanKey) {
      const existing = await query<any>(
        `SELECT gt.*, g.thumbnail_url, g.image_url
         FROM popolive.gift_transactions gt
         LEFT JOIN popolive.gift_catalog g ON g.gift_id = gt.gift_id
         WHERE gt.idempotency_key = $1 LIMIT 1`,
        [cleanKey]
      );
      if (existing.length > 0) {
        const senderSummary = await getWalletSummary(params.senderUserId, true);
        return {
          success: true,
          deduplicated: true,
          statusCode: 200,
          transaction: mapGiftTxRow(existing[0]),
          updatedSenderWallet: {
            userId: params.senderUserId,
            availableCoins: senderSummary.coins,
            totalSpentCoins: senderSummary.totalSpentCoins,
          },
        };
      }
    }
    throw err;
  }

  // Handle race duplicate returned by processAtomicGiftTransfer
  if (transferRes.isDuplicate && transferRes.success && cleanKey) {
    const existing = await query<any>(
      `SELECT gt.*, g.thumbnail_url, g.image_url
       FROM popolive.gift_transactions gt
       LEFT JOIN popolive.gift_catalog g ON g.gift_id = gt.gift_id
       WHERE gt.idempotency_key = $1 LIMIT 1`,
      [cleanKey]
    );
    const senderSummary = transferRes.senderWallet || (await getWalletSummary(params.senderUserId, true));
    const hostSummary = transferRes.hostWallet || (await getWalletSummary(hostOption.hostId, true));
    return {
      success: true,
      deduplicated: true,
      statusCode: 200,
      transaction: existing[0] ? mapGiftTxRow(existing[0]) : undefined,
      updatedSenderWallet: {
        userId: params.senderUserId,
        availableCoins: senderSummary.coins,
        totalSpentCoins: senderSummary.totalSpentCoins,
        hostPointsBalance: senderSummary.points,
      },
      updatedHostStats: {
        hostId: hostOption.hostId,
        nickname: hostOption.nickname,
        pointsCredited: 0,
        newHostPointsBalance: hostSummary.points,
      },
    };
  }

  // Handle clean insufficient balance / frozen wallet failure
  if (!transferRes.success) {
    const failCode = transferRes.code || 'INSUFFICIENT_COINS';
    const failMsg = transferRes.error || 'Unable to complete gift payment.';
    const failedTx = await recordFailedGiftTransaction({
      senderUserId: params.senderUserId,
      senderNickname: resolvedSenderName,
      recipientHostId: hostOption.hostId,
      recipientNickname: hostOption.nickname,
      stage,
      recipientSide: pkSide,
      gift,
      quantity: qtyMeta.quantity,
      totalCoins,
      sharePercentage: rules.hostSharePercent,
      failureCode: failCode,
      failureReason: failMsg,
      coinTxId: transferRes.coinTransaction?.transactionId || null,
    });

    const senderSummary = await getWalletSummary(params.senderUserId, true);
    const shortfallCoins = Math.max(0, totalCoins - senderSummary.coins);

    return {
      success: false,
      statusCode: failCode === 'WALLET_FROZEN' ? 403 : 400,
      errorCode: failCode,
      message: failMsg,
      transaction: failedTx,
      updatedSenderWallet: {
        userId: params.senderUserId,
        availableCoins: senderSummary.coins,
        totalSpentCoins: senderSummary.totalSpentCoins,
      },
      topUpRecommended: failCode === 'INSUFFICIENT_COINS',
      topUpUrl: '/recharge',
      shortfallCoins,
    };
  }

  bumpCacheVersion().catch(() => {});

  // Module 7.4 integration: dispatch approved animation non-blockingly ONLY after financial tx committed
  try {
    const { dispatchGiftAnimationFromTransaction } = await import('@/lib/animations');
    await dispatchGiftAnimationFromTransaction({
      giftTransactionId: committedTx!.giftTransactionId,
      allowIdempotentReturn: true,
    });
  } catch (animErr) {
    console.warn('[Module 7.4] Non-fatal gift animation queue dispatch skipped:', animErr);
  }

  const sWallet = transferRes.senderWallet!;
  const hWallet = transferRes.hostWallet!;

  return {
    success: true,
    deduplicated: false,
    statusCode: 200,
    transaction: committedTx!,
    updatedSenderWallet: {
      userId: params.senderUserId,
      availableCoins: sWallet.coins,
      totalSpentCoins: sWallet.totalSpentCoins,
      hostPointsBalance: sWallet.points,
    },
    updatedHostStats: {
      hostId: hostOption.hostId,
      nickname: hostOption.nickname,
      pointsCredited: transferRes.hostPointsEarned ?? 0,
      newHostPointsBalance: hWallet.points,
      pkHostAScore: updatedPkHostAScore,
      pkHostBScore: updatedPkHostBScore,
      roomCoinsEarned: updatedRoomCoinsEarned,
    },
  };
}

export async function queryGiftTransactions(options: {
  senderUserId?: string | null;
  recipientHostId?: string | null;
  participantUserId?: string | null;
  liveRoomId?: string | null;
  pkBattleId?: string | null;
  giftTransactionId?: string | null;
  status?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
  includeFinancialBreakdown?: boolean;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 25));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (options.participantUserId) {
    params.push(options.participantUserId);
    conditions.push(`(gt.sender_user_id = $${params.length} OR gt.recipient_host_id = $${params.length})`);
  }
  if (options.senderUserId) {
    params.push(options.senderUserId);
    conditions.push(`gt.sender_user_id = $${params.length}`);
  }
  if (options.recipientHostId) {
    params.push(options.recipientHostId);
    conditions.push(`gt.recipient_host_id = $${params.length}`);
  }
  if (options.liveRoomId) {
    params.push(options.liveRoomId);
    conditions.push(`gt.live_room_id = $${params.length}`);
  }
  if (options.pkBattleId && UUID_REGEX.test(options.pkBattleId)) {
    params.push(options.pkBattleId);
    conditions.push(`gt.pk_battle_id = $${params.length}`);
  }
  if (options.giftTransactionId) {
    params.push(options.giftTransactionId);
    conditions.push(`gt.gift_transaction_id = $${params.length}`);
  }
  if (options.status && ['processing', 'completed', 'failed', 'reversed'].includes(options.status)) {
    params.push(options.status);
    conditions.push(`gt.status = $${params.length}`);
  }
  if (options.search && options.search.trim()) {
    params.push(`%${options.search.trim()}%`);
    const pIdx = params.length;
    conditions.push(
      `(gt.gift_transaction_id ILIKE $${pIdx} OR gt.sender_user_id ILIKE $${pIdx} OR gt.sender_nickname ILIKE $${pIdx} OR gt.recipient_host_id ILIKE $${pIdx} OR gt.recipient_nickname ILIKE $${pIdx} OR gt.gift_name_snapshot ILIKE $${pIdx} OR COALESCE(gt.live_room_id, '') ILIKE $${pIdx})`
    );
  }

  const whereClause = conditions.join(' AND ');
  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM popolive.gift_transactions gt WHERE ${whereClause}`,
    params
  );
  const total = countRows[0]?.total ?? 0;

  const listParams = [...params, limit, offset];
  const rows = await query<any>(
    `SELECT gt.*, g.thumbnail_url, g.image_url
     FROM popolive.gift_transactions gt
     LEFT JOIN popolive.gift_catalog g ON g.gift_id = gt.gift_id
     WHERE ${whereClause}
     ORDER BY gt.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  const transactions = rows.map((r) => {
    const mapped = mapGiftTxRow(r);
    if (!options.includeFinancialBreakdown) {
      return {
        ...mapped,
        platformShare: 0,
      };
    }
    return mapped;
  });

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function reverseGiftTransaction(params: {
  giftTransactionId: string;
  reason: string;
  actorId: string;
  actorRole: string;
  ipAddress?: string;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new GiftSendValidationError(403, 'FORBIDDEN', 'Only finance_admin or super_admin can reverse gifts.');
  }
  if (!params.reason || params.reason.trim().length < 4) {
    throw new GiftSendValidationError(400, 'REASON_REQUIRED', 'A clear reversal reason (min 4 characters) is required.');
  }

  const txResult = await withTransaction(async (client) => {
    const rules = await getFinanceRules(client);
    const txRes = await client.query(
      `SELECT * FROM popolive.gift_transactions WHERE gift_transaction_id = $1 FOR UPDATE`,
      [params.giftTransactionId]
    );
    if (txRes.rows.length === 0) {
      throw new GiftSendValidationError(404, 'GIFT_TX_NOT_FOUND', 'Gift transaction not found.');
    }
    const gtx = txRes.rows[0];
    if (gtx.status !== 'completed') {
      throw new GiftSendValidationError(
        400,
        'CANNOT_REVERSE_STATUS',
        `Cannot reverse a gift transaction with status '${gtx.status}'.`
      );
    }

    const totalCoins = parseInt(String(gtx.total_coin_amount), 10);
    const hostPoints = parseInt(String(gtx.host_points_credited), 10);

    const lockIds = Array.from(new Set([gtx.sender_user_id, gtx.recipient_host_id])).sort();
    const lockedMap: Record<string, any> = {};
    for (const uid of lockIds) {
      lockedMap[uid] = await ensureWalletLocked(client, uid, rules);
    }

    const senderWallet = lockedMap[gtx.sender_user_id];
    const hostWallet = lockedMap[gtx.recipient_host_id];

    const prevSenderCoins = parseInt(String(senderWallet.coins), 10);
    const newSenderCoins = prevSenderCoins + totalCoins;
    const prevSpent = parseInt(String(senderWallet.total_spent_coins ?? '0'), 10);
    const newSpent = Math.max(0, prevSpent - totalCoins);

    const prevHostPoints = parseInt(String(hostWallet.diamond_points ?? '0'), 10);
    const newHostPoints = Math.max(0, prevHostPoints - hostPoints);
    const prevHostEarned = parseInt(String(hostWallet.total_received_points ?? '0'), 10);
    const newHostEarned = Math.max(0, prevHostEarned - hostPoints);

    const updatedSenderRes = await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, total_spent_coins = $2, updated_at = NOW()
       WHERE wallet_id = $3 RETURNING *`,
      [newSenderCoins, newSpent, senderWallet.wallet_id]
    );
    const updatedHostRes = await client.query(
      `UPDATE popolive.user_wallets
       SET diamond_points = $1, total_received_points = $2, updated_at = NOW()
       WHERE wallet_id = $3 RETURNING *`,
      [newHostPoints, newHostEarned, hostWallet.wallet_id]
    );

    const revCoinTxId = generateTxId('REV');
    const revPtsTxId = generateTxId('RPT');

    await client.query(
      `INSERT INTO popolive.coin_transactions (
         transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
         previous_balance, new_balance, status, reference_id, related_tx_id, description, created_by
       ) VALUES ($1,$2,$3,'reversal','credit',$4,$5,$6,'completed',$7,$8,$9,$10)`,
      [
        revCoinTxId,
        senderWallet.wallet_id,
        gtx.sender_user_id,
        totalCoins,
        prevSenderCoins,
        newSenderCoins,
        gtx.gift_transaction_id,
        gtx.coin_tx_id,
        `Gift Reversal (${gtx.gift_transaction_id}): ${params.reason}`,
        params.actorId,
      ]
    );

    if (gtx.coin_tx_id) {
      await client.query(
        `UPDATE popolive.coin_transactions SET status = 'reversed', updated_at = NOW() WHERE transaction_id = $1`,
        [gtx.coin_tx_id]
      );
    }

    await client.query(
      `INSERT INTO popolive.points_transactions (
         transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
         source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
         previous_balance, new_balance, status, reference_id, related_tx_id, description, created_by
       ) VALUES ($1,$2,$3,'reversal','debit',$4,$5,$6,$7,$8,$9,$10,$11,'completed',$12,$13,$14,$15)`,
      [
        revPtsTxId,
        hostWallet.wallet_id,
        gtx.recipient_host_id,
        hostPoints,
        totalCoins,
        gtx.share_percentage,
        gtx.gift_name_snapshot,
        gtx.sender_user_id,
        gtx.sender_nickname,
        prevHostPoints,
        newHostPoints,
        gtx.gift_transaction_id,
        gtx.points_tx_id,
        `Gift Points Reversal (${gtx.gift_transaction_id}): ${params.reason}`,
        params.actorId,
      ]
    );

    if (gtx.points_tx_id) {
      await client.query(
        `UPDATE popolive.points_transactions SET status = 'reversed', updated_at = NOW() WHERE transaction_id = $1`,
        [gtx.points_tx_id]
      );
    }

    if (gtx.pk_battle_id) {
      const bRes = await client.query(
        `SELECT status, host_a_id, host_b_id, host_a_score, host_b_score
         FROM popolive.pk_battles WHERE id = $1 FOR UPDATE`,
        [gtx.pk_battle_id]
      );
      if (bRes.rows.length > 0 && bRes.rows[0].status === 'active') {
        const b = bRes.rows[0];
        const nextA =
          gtx.pk_host_side === 'host_a'
            ? Math.max(0, parseInt(String(b.host_a_score), 10) - totalCoins)
            : parseInt(String(b.host_a_score), 10);
        const nextB =
          gtx.pk_host_side === 'host_b'
            ? Math.max(0, parseInt(String(b.host_b_score), 10) - totalCoins)
            : parseInt(String(b.host_b_score), 10);
        const leadingId = nextA > nextB ? b.host_a_id : nextB > nextA ? b.host_b_id : null;
        await client.query(
          `UPDATE popolive.pk_battles SET host_a_score = $1, host_b_score = $2, leading_host_id = $3, last_synced_at = NOW() WHERE id = $4`,
          [nextA, nextB, leadingId, gtx.pk_battle_id]
        );
      }
    }

    const updatedGtxRes = await client.query(
      `UPDATE popolive.gift_transactions
       SET status = 'reversed', reversal_reason = $1, reversed_by = $2, reversed_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [params.reason.trim(), params.actorId, gtx.id]
    );

    // Module 7.5: mark linked host earning share as reversed & emit host-scoped reversal SSE
    const { reverseHostEarningShareInTx } = await import('@/lib/hostEarnings');
    await reverseHostEarningShareInTx(client, {
      giftTransactionId: gtx.gift_transaction_id,
      reversalReference: revPtsTxId,
      reason: params.reason.trim(),
      actorId: params.actorId,
      updatedHostPointsBalance: newHostPoints,
      updatedTotalReceivedPoints: newHostEarned,
    });

    const scope = gtx.pk_battle_id
      ? `pk:${gtx.pk_battle_id}`
      : gtx.live_room_id
      ? `room:${gtx.live_room_id}`
      : 'global';

    await client.query(
      `INSERT INTO popolive.gift_realtime_events (room_scope, sender_user_id, recipient_host_id, event_type, payload)
       VALUES ($1, $2, $3, 'gift:transaction_reversed', $4::jsonb)`,
      [
        scope,
        gtx.sender_user_id,
        gtx.recipient_host_id,
        JSON.stringify({
          giftTransactionId: gtx.gift_transaction_id,
          senderUserId: gtx.sender_user_id,
          recipientHostId: gtx.recipient_host_id,
          reversedCoins: totalCoins,
          reversedPoints: hostPoints,
          reason: params.reason.trim(),
          emittedAt: new Date().toISOString(),
        }),
      ]
    );

    await emitWalletRealtimeEvent(client, gtx.sender_user_id, 'wallet:transaction_reversed', {
      transactionId: revCoinTxId,
      originalGiftTransactionId: gtx.gift_transaction_id,
      coins: newSenderCoins,
    });
    await emitWalletRealtimeEvent(client, gtx.recipient_host_id, 'wallet:transaction_reversed', {
      transactionId: revPtsTxId,
      originalGiftTransactionId: gtx.gift_transaction_id,
      points: newHostPoints,
    });

    return {
      senderUserId: gtx.sender_user_id,
      senderWalletId: senderWallet.wallet_id,
      totalCoins,
      transaction: mapGiftTxRow(updatedGtxRes.rows[0]),
      senderWallet: mapWalletRow(updatedSenderRes.rows[0], rules.hostGiftSharePercent),
      hostWallet: mapWalletRow(updatedHostRes.rows[0], rules.hostGiftSharePercent),
    };
  });

  await logWalletAudit({
    targetUserId: txResult.senderUserId,
    walletId: txResult.senderWalletId,
    actionType: 'gift_transaction_reversed',
    actorId: params.actorId,
    actorRole: params.actorRole,
    reason: params.reason.trim(),
    balanceType: 'both',
    amount: txResult.totalCoins,
    ipAddress: params.ipAddress,
  });

  return {
    success: true,
    transaction: txResult.transaction,
    senderWallet: txResult.senderWallet,
    hostWallet: txResult.hostWallet,
  };
}
