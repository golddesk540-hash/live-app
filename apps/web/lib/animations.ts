import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { FALLBACK_GIFT_IMAGE_URL } from '@/lib/giftAssets';
import { resolveRoomStage } from '@/lib/giftSending';
import { redisGet, redisSetWithTtl } from '@/lib/redis';

// =============================================================================
// Popo Live Phase 7 Module 7.4 — Premium Gift Animations & Host Entrance Engine
// Strictly isolated from wallet balances, coin/points ledgers, and PK scoring.
// =============================================================================

export type AnimationTier =
  | 'small_floating'
  | 'medium_animated'
  | 'large_fullscreen'
  | 'luxury'
  | 'special_event'
  | 'pk_effect';

export type PriorityCategory = 'standard' | 'premium' | 'luxury' | 'special_event';
export type EntranceType = 'standard' | 'premium' | 'vip' | 'special_event';
export type PKEffectStyle = 'side_float' | 'side_burst' | 'center_stage' | 'cross_arena';

export interface GiftAnimationConfigItem {
  animationId: string;
  giftId: string;
  giftName: string;
  giftNameUr: string;
  coinPrice: number;
  assetType: string;
  animationUrl: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  animationTier: AnimationTier;
  priorityCategory: PriorityCategory;
  priorityWeight: number;
  durationMs: number;
  loopCount: number;
  isFullscreen: boolean;
  soundUrl: string | null;
  previewImageUrl: string | null;
  fallbackAssetUrl: string;
  pkEffectStyle: PKEffectStyle;
  isActive: boolean;
  giftActive: boolean;
  updatedAt: string;
}

export interface HostEntranceEffectItem {
  entranceId: string;
  entranceType: EntranceType;
  name: string;
  nameUr: string;
  requiredVipLevel: number;
  minHostLevel: number;
  requiresSpecialEvent: boolean;
  vipBadgeLabel: string | null;
  assetType: string;
  animationUrl: string;
  previewImageUrl: string;
  soundUrl: string | null;
  durationMs: number;
  priorityWeight: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AnimationPriorityConfigItem {
  configKey: string;
  displayLabel: string;
  priorityWeight: number;
  maxConcurrent: number;
  defaultDurationMs: number;
  isEnabled: boolean;
  updatedAt: string;
}

export interface UserAnimationPreferences {
  userId: string;
  enableLargeAnimations: boolean;
  enableSoundEffects: boolean;
  reduceAnimations: boolean;
  respectDeviceReducedMotion: boolean;
  updatedAt: string;
}

export interface AnimationQueueItem {
  queueId: string;
  dedupeKey: string;
  eventCategory: 'gift' | 'host_entrance';
  roomScope: string;
  liveRoomId: string | null;
  pkBattleId: string | null;
  pkHostSide: 'host_a' | 'host_b' | null;
  giftTransactionId: string | null;
  giftId: string | null;
  giftName: string | null;
  giftNameUr: string | null;
  entranceId: string | null;
  entranceType: EntranceType | null;
  senderUserId: string | null;
  senderNickname: string | null;
  senderAvatarUrl: string | null;
  recipientHostId: string;
  recipientNickname: string;
  recipientPoppoId: string | null;
  recipientAvatarUrl: string | null;
  vipBadgeLabel: string | null;
  quantity: number;
  totalCoinAmount: number;
  animationTier: string;
  priorityCategory: string;
  priorityWeight: number;
  isFullscreen: boolean;
  pkEffectStyle: string;
  durationMs: number;
  loopCount: number;
  assetType: string;
  animationUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  soundUrl: string | null;
  fallbackUrl: string;
  status: 'queued' | 'playing' | 'completed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface HostEntranceEligibility {
  hostUserId: string;
  nickname: string;
  poppoId: string;
  avatarUrl: string;
  hostLevel: number;
  vipLevel: number;
  vipTier: string;
  vipBadgeLabel: string | null;
  specialEventAccess: boolean;
  vipActive: boolean;
  allowedEntranceTypes: EntranceType[];
  equippedStoreEntrance?: {
    inventoryId: string;
    itemId: string;
    name: string;
    previewImageUrl: string;
    animationAssetUrl: string | null;
    expiresAt: string | null;
  } | null;
}

export interface AnimationAuditLogRecord {
  auditId: string;
  targetType: string;
  targetId: string;
  actionType: string;
  actorId: string;
  actorRole: string;
  reason: string | null;
  beforeData: any;
  afterData: any;
  ipAddress: string | null;
  createdAt: string;
}

export class AnimationValidationError extends Error {
  statusCode: number;
  errorCode: string;
  details?: Record<string, any>;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_VERSION_KEY = 'popo:animations:cache_version';
const CACHE_TTL_SECONDS = 90;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function getCacheVersion(): Promise<string> {
  const val = await redisGet(CACHE_VERSION_KEY);
  if (val) return val;
  const fresh = String(Date.now());
  await redisSetWithTtl(CACHE_VERSION_KEY, fresh, 86400);
  return fresh;
}

export async function bumpAnimationCacheVersion(): Promise<void> {
  await redisSetWithTtl(CACHE_VERSION_KEY, String(Date.now()), 86400);
}

function mapGiftAnimationRow(r: any): GiftAnimationConfigItem {
  return {
    animationId: r.animation_id,
    giftId: r.gift_id,
    giftName: r.gift_name || r.name || 'Virtual Gift',
    giftNameUr: r.gift_name_ur || r.name_ur || r.gift_name || 'تحفہ',
    coinPrice: parseInt(String(r.coin_price ?? '0'), 10),
    assetType: r.asset_type || 'png',
    animationUrl: r.animation_url || null,
    imageUrl: r.image_url || FALLBACK_GIFT_IMAGE_URL,
    thumbnailUrl: r.thumbnail_url || r.image_url || FALLBACK_GIFT_IMAGE_URL,
    animationTier: r.animation_tier,
    priorityCategory: r.priority_category || 'standard',
    priorityWeight: parseInt(String(r.priority_weight ?? '10'), 10),
    durationMs: parseInt(String(r.duration_ms ?? '2800'), 10),
    loopCount: parseInt(String(r.loop_count ?? '1'), 10),
    isFullscreen: Boolean(r.is_fullscreen),
    soundUrl: r.sound_url || null,
    previewImageUrl: r.preview_image_url || r.image_url || FALLBACK_GIFT_IMAGE_URL,
    fallbackAssetUrl: r.fallback_asset_url || FALLBACK_GIFT_IMAGE_URL,
    pkEffectStyle: r.pk_effect_style || 'side_burst',
    isActive: Boolean(r.is_active),
    giftActive: r.gift_active !== false,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

function mapEntranceRow(r: any): HostEntranceEffectItem {
  return {
    entranceId: r.entrance_id,
    entranceType: r.entrance_type,
    name: r.name,
    nameUr: r.name_ur,
    requiredVipLevel: parseInt(String(r.required_vip_level ?? '0'), 10),
    minHostLevel: parseInt(String(r.min_host_level ?? '1'), 10),
    requiresSpecialEvent: Boolean(r.requires_special_event),
    vipBadgeLabel: r.vip_badge_label || null,
    assetType: r.asset_type || 'lottie',
    animationUrl: r.animation_url,
    previewImageUrl: r.preview_image_url,
    soundUrl: r.sound_url || null,
    durationMs: parseInt(String(r.duration_ms ?? '3400'), 10),
    priorityWeight: parseInt(String(r.priority_weight ?? '40'), 10),
    isActive: Boolean(r.is_active),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

function mapPriorityRow(r: any): AnimationPriorityConfigItem {
  return {
    configKey: r.config_key,
    displayLabel: r.display_label,
    priorityWeight: parseInt(String(r.priority_weight ?? '10'), 10),
    maxConcurrent: parseInt(String(r.max_concurrent ?? '1'), 10),
    defaultDurationMs: parseInt(String(r.default_duration_ms ?? '3000'), 10),
    isEnabled: Boolean(r.is_enabled),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

export function mapQueueRow(r: any): AnimationQueueItem {
  return {
    queueId: r.queue_id,
    dedupeKey: r.dedupe_key,
    eventCategory: r.event_category,
    roomScope: r.room_scope,
    liveRoomId: r.live_room_id || null,
    pkBattleId: r.pk_battle_id || null,
    pkHostSide: r.pk_host_side || null,
    giftTransactionId: r.gift_transaction_id || null,
    giftId: r.gift_id || null,
    giftName: r.gift_name || null,
    giftNameUr: r.gift_name_ur || null,
    entranceId: r.entrance_id || null,
    entranceType: r.entrance_type || null,
    senderUserId: r.sender_user_id || null,
    senderNickname: r.sender_nickname || null,
    senderAvatarUrl: r.sender_avatar_url || null,
    recipientHostId: r.recipient_host_id,
    recipientNickname: r.recipient_nickname,
    recipientPoppoId: r.recipient_poppo_id || null,
    recipientAvatarUrl: r.recipient_avatar_url || null,
    vipBadgeLabel: r.vip_badge_label || null,
    quantity: parseInt(String(r.quantity ?? '1'), 10),
    totalCoinAmount: parseInt(String(r.total_coin_amount ?? '0'), 10),
    animationTier: r.animation_tier,
    priorityCategory: r.priority_category || 'standard',
    priorityWeight: parseInt(String(r.priority_weight ?? '10'), 10),
    isFullscreen: Boolean(r.is_fullscreen),
    pkEffectStyle: r.pk_effect_style || 'side_burst',
    durationMs: parseInt(String(r.duration_ms ?? '3000'), 10),
    loopCount: parseInt(String(r.loop_count ?? '1'), 10),
    assetType: r.asset_type || 'lottie',
    animationUrl: r.animation_url || null,
    imageUrl: r.image_url || null,
    thumbnailUrl: r.thumbnail_url || null,
    soundUrl: r.sound_url || null,
    fallbackUrl: r.fallback_url || FALLBACK_GIFT_IMAGE_URL,
    status: r.status,
    startedAt: r.started_at ? new Date(r.started_at).toISOString() : null,
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  };
}

// -----------------------------------------------------------------------------
// 1. Animation Catalog, Priority & Entrance Configurations (Redis Cached)
// -----------------------------------------------------------------------------
export async function getAnimationSystemCatalog(includeInactive = false): Promise<{
  giftAnimations: GiftAnimationConfigItem[];
  entranceEffects: HostEntranceEffectItem[];
  priorityConfigs: AnimationPriorityConfigItem[];
}> {
  const version = await getCacheVersion();
  const cacheKey = `popo:animations:catalog:${version}:${includeInactive ? 'all' : 'active'}`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const [animRows, entranceRows, priorityRows] = await Promise.all([
    query<any>(
      `SELECT ga.*, gc.name AS gift_name, gc.name_ur AS gift_name_ur,
              gc.coin_price, gc.asset_type, gc.animation_url,
              gc.image_url, gc.thumbnail_url, gc.is_active AS gift_active
       FROM popolive.gift_animations ga
       INNER JOIN popolive.gift_catalog gc ON gc.gift_id = ga.gift_id
       ${includeInactive ? '' : 'WHERE ga.is_active = TRUE AND gc.is_active = TRUE'}
       ORDER BY ga.priority_weight DESC, gc.display_order ASC`
    ),
    query<any>(
      `SELECT *
       FROM popolive.host_entrance_effects
       ${includeInactive ? '' : 'WHERE is_active = TRUE'}
       ORDER BY priority_weight ASC, required_vip_level ASC`
    ),
    query<any>(
      `SELECT *
       FROM popolive.animation_priority_config
       ORDER BY priority_weight ASC`
    ),
  ]);

  const result = {
    giftAnimations: animRows.map(mapGiftAnimationRow),
    entranceEffects: entranceRows.map(mapEntranceRow),
    priorityConfigs: priorityRows.map(mapPriorityRow),
  };

  await redisSetWithTtl(cacheKey, JSON.stringify(result), CACHE_TTL_SECONDS);
  return result;
}

export async function getGiftAnimationConfig(giftId: string): Promise<GiftAnimationConfigItem> {
  const catalog = await getAnimationSystemCatalog(false);
  const match = catalog.giftAnimations.find((g) => g.giftId === giftId);
  if (match) return match;

  // Fallback check directly in DB in case a gift was just newly created in catalog
  const rows = await query<any>(
    `SELECT ga.*, gc.name AS gift_name, gc.name_ur AS gift_name_ur,
            gc.coin_price, gc.asset_type, gc.animation_url,
            gc.image_url, gc.thumbnail_url, gc.is_active AS gift_active
     FROM popolive.gift_animations ga
     INNER JOIN popolive.gift_catalog gc ON gc.gift_id = ga.gift_id
     WHERE ga.gift_id = $1 AND ga.is_active = TRUE AND gc.is_active = TRUE
     LIMIT 1`,
    [giftId]
  );

  if (rows.length > 0) {
    return mapGiftAnimationRow(rows[0]);
  }

  throw new AnimationValidationError(
    400,
    'ANIMATION_NOT_CONFIGURED',
    `Approved animation mapping does not exist or is disabled for gift ${giftId}.`
  );
}

// -----------------------------------------------------------------------------
// 2. User Animation Preferences (Pure UI Settings — Never Blocks Transactions)
// -----------------------------------------------------------------------------
export async function getUserAnimationPreferences(
  userId: string
): Promise<UserAnimationPreferences> {
  const cleanId = (userId || '').trim();
  if (!cleanId) {
    return {
      userId: 'anonymous',
      enableLargeAnimations: true,
      enableSoundEffects: true,
      reduceAnimations: false,
      respectDeviceReducedMotion: true,
      updatedAt: new Date().toISOString(),
    };
  }

  const rows = await query<any>(
    `SELECT * FROM popolive.user_animation_preferences WHERE user_id = $1 LIMIT 1`,
    [cleanId]
  );

  if (rows.length === 0) {
    return {
      userId: cleanId,
      enableLargeAnimations: true,
      enableSoundEffects: true,
      reduceAnimations: false,
      respectDeviceReducedMotion: true,
      updatedAt: new Date().toISOString(),
    };
  }

  const r = rows[0];
  return {
    userId: r.user_id,
    enableLargeAnimations: Boolean(r.enable_large_animations),
    enableSoundEffects: Boolean(r.enable_sound_effects),
    reduceAnimations: Boolean(r.reduce_animations),
    respectDeviceReducedMotion: Boolean(r.respect_device_reduced_motion),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function updateUserAnimationPreferences(params: {
  userId: string;
  enableLargeAnimations?: boolean;
  enableSoundEffects?: boolean;
  reduceAnimations?: boolean;
  respectDeviceReducedMotion?: boolean;
}): Promise<UserAnimationPreferences> {
  const current = await getUserAnimationPreferences(params.userId);
  const next = {
    enableLargeAnimations:
      typeof params.enableLargeAnimations === 'boolean'
        ? params.enableLargeAnimations
        : current.enableLargeAnimations,
    enableSoundEffects:
      typeof params.enableSoundEffects === 'boolean'
        ? params.enableSoundEffects
        : current.enableSoundEffects,
    reduceAnimations:
      typeof params.reduceAnimations === 'boolean'
        ? params.reduceAnimations
        : current.reduceAnimations,
    respectDeviceReducedMotion:
      typeof params.respectDeviceReducedMotion === 'boolean'
        ? params.respectDeviceReducedMotion
        : current.respectDeviceReducedMotion,
  };

  const rows = await query<any>(
    `INSERT INTO popolive.user_animation_preferences (
       user_id, enable_large_animations, enable_sound_effects,
       reduce_animations, respect_device_reduced_motion, updated_at
     ) VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       enable_large_animations = EXCLUDED.enable_large_animations,
       enable_sound_effects = EXCLUDED.enable_sound_effects,
       reduce_animations = EXCLUDED.reduce_animations,
       respect_device_reduced_motion = EXCLUDED.respect_device_reduced_motion,
       updated_at = NOW()
     RETURNING *`,
    [
      params.userId,
      next.enableLargeAnimations,
      next.enableSoundEffects,
      next.reduceAnimations,
      next.respectDeviceReducedMotion,
    ]
  );

  const r = rows[0];
  return {
    userId: r.user_id,
    enableLargeAnimations: Boolean(r.enable_large_animations),
    enableSoundEffects: Boolean(r.enable_sound_effects),
    reduceAnimations: Boolean(r.reduce_animations),
    respectDeviceReducedMotion: Boolean(r.respect_device_reduced_motion),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// 3. Queue Sweeping, Concurrency Limits & Promotion Engine (Inside Transaction)
// -----------------------------------------------------------------------------
async function sweepAndPromoteInTx(
  client: { query: (sql: string, args?: any[]) => Promise<any> },
  roomScope: string
): Promise<{ promoted: AnimationQueueItem[]; completedCount: number }> {
  // 1. Mark expired 'playing' items as completed so queues recover safely
  const expiredRes = await client.query(
    `UPDATE popolive.animation_playback_queue
     SET status = 'completed', completed_at = COALESCE(completed_at, NOW())
     WHERE room_scope = $1 AND status = 'playing' AND expires_at IS NOT NULL AND expires_at < NOW()
     RETURNING *`,
    [roomScope]
  );

  for (const row of expiredRes.rows) {
    const mapped = mapQueueRow(row);
    const evName =
      mapped.eventCategory === 'host_entrance'
        ? 'animation:host_entrance_completed'
        : 'animation:gift_completed';
    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [
        roomScope,
        evName,
        mapped.queueId,
        JSON.stringify({
          queueId: mapped.queueId,
          giftTransactionId: mapped.giftTransactionId,
          entranceType: mapped.entranceType,
          reason: 'duration_elapsed',
          completedAt: mapped.completedAt || new Date().toISOString(),
        }),
      ]
    );
  }

  // 2. Check configured concurrency limits
  const limitRows = await client.query(
    `SELECT config_key, max_concurrent FROM popolive.animation_priority_config
     WHERE config_key = 'max_concurrent_fullscreen' LIMIT 1`
  );
  const maxFullscreen = Math.max(
    1,
    parseInt(String(limitRows.rows[0]?.max_concurrent ?? '1'), 10)
  );
  const maxTotalConcurrent = 4;

  const playingRes = await client.query(
    `SELECT queue_id, is_fullscreen, event_category FROM popolive.animation_playback_queue
     WHERE room_scope = $1 AND status = 'playing'
     FOR UPDATE`,
    [roomScope]
  );
  let activeTotal = playingRes.rows.length;
  let activeGiftFullscreen = playingRes.rows.filter(
    (r: any) => r.event_category === 'gift' && Boolean(r.is_fullscreen)
  ).length;
  let activeEntrances = playingRes.rows.filter(
    (r: any) => r.event_category === 'host_entrance'
  ).length;

  const queuedRes = await client.query(
    `SELECT * FROM popolive.animation_playback_queue
     WHERE room_scope = $1 AND status = 'queued'
     ORDER BY priority_weight DESC, created_at ASC
     FOR UPDATE`,
    [roomScope]
  );

  const promoted: AnimationQueueItem[] = [];
  for (const qRow of queuedRes.rows) {
    if (activeTotal >= maxTotalConcurrent) break;
    const isEntrance = qRow.event_category === 'host_entrance';
    const isGiftFull = !isEntrance && Boolean(qRow.is_fullscreen);

    if (isEntrance && activeEntrances >= 1) continue;
    if (isGiftFull && activeGiftFullscreen >= maxFullscreen) continue;

    const durationMs = Math.max(800, parseInt(String(qRow.duration_ms ?? '3000'), 10));
    const updRes = await client.query(
      `UPDATE popolive.animation_playback_queue
       SET status = 'playing',
           started_at = NOW(),
           expires_at = NOW() + ($2 || ' milliseconds')::interval
       WHERE queue_id = $1
       RETURNING *`,
      [qRow.queue_id, String(durationMs)]
    );

    const mapped = mapQueueRow(updRes.rows[0]);
    promoted.push(mapped);
    activeTotal += 1;
    if (isEntrance) activeEntrances += 1;
    if (isGiftFull) activeGiftFullscreen += 1;

    const startEventType =
      mapped.eventCategory === 'host_entrance' ? 'animation:host_entrance' : 'animation:gift_started';
    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [roomScope, startEventType, mapped.queueId, JSON.stringify(mapped)]
    );
  }

  return { promoted, completedCount: expiredRes.rows.length };
}

async function fetchQueueSummaryInTx(
  client: { query: (sql: string, args?: any[]) => Promise<any> },
  roomScope: string
): Promise<{ playing: AnimationQueueItem[]; queued: AnimationQueueItem[] }> {
  const rows = await client.query(
    `SELECT * FROM popolive.animation_playback_queue
     WHERE room_scope = $1 AND status IN ('playing', 'queued')
     ORDER BY priority_weight DESC, created_at ASC
     LIMIT 30`,
    [roomScope]
  );
  const items = rows.rows.map(mapQueueRow);
  return {
    playing: items.filter((i: AnimationQueueItem) => i.status === 'playing'),
    queued: items.filter((i: AnimationQueueItem) => i.status === 'queued'),
  };
}

// -----------------------------------------------------------------------------
// 4. Validated Gift Animation Enqueue & Dispatch (Rejects Failed/Fake Txns)
// -----------------------------------------------------------------------------
export async function dispatchGiftAnimationFromTransaction(params: {
  giftTransactionId: string;
  roomId?: string | null;
  pkBattleId?: string | null;
  allowIdempotentReturn?: boolean;
}): Promise<{
  queueItem: AnimationQueueItem;
  startedImmediately: boolean;
  queueDepth: number;
  deduplicated: boolean;
}> {
  const txId = (params.giftTransactionId || '').trim();
  if (!txId) {
    throw new AnimationValidationError(
      400,
      'GIFT_TRANSACTION_REQUIRED',
      'giftTransactionId is required to dispatch an approved animation.'
    );
  }

  // 1. Validate confirmed gift transaction record on backend (NEVER trust client payload)
  const txRows = await query<any>(
    `SELECT gt.*, u_sender.avatar_url AS sender_avatar_url,
            u_host.avatar_url AS recipient_avatar_url, u_host.poppo_id AS recipient_poppo_id
     FROM popolive.gift_transactions gt
     LEFT JOIN popolive.users u_sender ON u_sender.id::text = gt.sender_user_id
     LEFT JOIN popolive.users u_host ON u_host.id::text = gt.recipient_host_id
     WHERE gt.gift_transaction_id = $1
     LIMIT 1`,
    [txId]
  );

  if (txRows.length === 0) {
    throw new AnimationValidationError(
      404,
      'GIFT_TRANSACTION_NOT_FOUND',
      'Gift transaction does not exist. Cannot trigger unverified animation.'
    );
  }

  const tx = txRows[0];
  if (tx.status !== 'completed') {
    throw new AnimationValidationError(
      400,
      'INVALID_OR_FAILED_TRANSACTION',
      `Gift transaction ${txId} has status "${tx.status}". Failed or cancelled transactions never play animations.`
    );
  }

  // 2. Verify room/PK scope if caller explicitly supplied one
  let roomScope = tx.pk_battle_id
    ? `pk:${tx.pk_battle_id}`
    : tx.live_room_id
    ? `room:${tx.live_room_id}`
    : '';

  if (params.pkBattleId && tx.pk_battle_id !== params.pkBattleId) {
    throw new AnimationValidationError(
      403,
      'ROOM_MEMBERSHIP_MISMATCH',
      'Gift transaction does not belong to the requested PK battle.'
    );
  }

  if (params.roomId && !tx.pk_battle_id) {
    const stage = await resolveRoomStage({
      roomId: params.roomId,
      requireActiveForSend: false,
    }).catch(() => null);
    if (stage && stage.liveRoomId && tx.live_room_id && stage.liveRoomId !== tx.live_room_id) {
      throw new AnimationValidationError(
        403,
        'ROOM_MEMBERSHIP_MISMATCH',
        'Gift transaction does not belong to the requested live room.'
      );
    }
    if (!roomScope && stage) roomScope = stage.roomScope;
  }

  if (!roomScope) roomScope = 'room:880219';

  // 3. Retrieve authoritative gift animation mapping from Module 7.2/7.4 catalog
  const animCfg = await getGiftAnimationConfig(tx.gift_id);
  const catalog = await getAnimationSystemCatalog(false);
  const tierPriorityCfg = catalog.priorityConfigs.find(
    (p) => p.configKey === animCfg.priorityCategory
  );
  const baseWeight = tierPriorityCfg ? tierPriorityCfg.priorityWeight : animCfg.priorityWeight;
  const effectivePriorityWeight = Math.max(animCfg.priorityWeight, baseWeight);
  const quantity = Math.max(1, parseInt(String(tx.quantity ?? '1'), 10));
  const totalCoins = parseInt(String(tx.total_coin_amount ?? '0'), 10);

  // Authoritative PK host side resolution directly from transaction/PK battle (never mutate scores!)
  let pkHostSide: 'host_a' | 'host_b' | null =
    tx.pk_host_side === 'host_a' || tx.pk_host_side === 'host_b' ? tx.pk_host_side : null;
  if (tx.pk_battle_id && !pkHostSide) {
    const pkRows = await query<any>(
      `SELECT host_a_id, host_b_id FROM popolive.pk_battles WHERE id = $1 LIMIT 1`,
      [tx.pk_battle_id]
    );
    if (pkRows[0]) {
      pkHostSide =
        pkRows[0].host_b_id === tx.recipient_host_id
          ? 'host_b'
          : pkRows[0].host_a_id === tx.recipient_host_id
          ? 'host_a'
          : null;
    }
  }

  const dedupeKey = `gift_tx:${txId}`;

  return withTransaction(async (client) => {
    // Check deduplication strictly
    const existing = await client.query(
      `SELECT * FROM popolive.animation_playback_queue WHERE dedupe_key = $1 LIMIT 1`,
      [dedupeKey]
    );
    if (existing.rows.length > 0) {
      if (params.allowIdempotentReturn) {
        const summary = await fetchQueueSummaryInTx(client, roomScope);
        return {
          queueItem: mapQueueRow(existing.rows[0]),
          startedImmediately: existing.rows[0].status === 'playing',
          queueDepth: summary.queued.length,
          deduplicated: true,
        };
      }
      throw new AnimationValidationError(
        409,
        'DUPLICATE_ANIMATION_EVENT',
        `Duplicate animation blocked: gift transaction ${txId} was already dispatched.`
      );
    }

    const queueId = genId('ANQ');
    const insRes = await client.query(
      `INSERT INTO popolive.animation_playback_queue (
         queue_id, dedupe_key, event_category, room_scope, live_room_id, pk_battle_id, pk_host_side,
         gift_transaction_id, gift_id, gift_name, gift_name_ur,
         sender_user_id, sender_nickname, sender_avatar_url,
         recipient_host_id, recipient_nickname, recipient_poppo_id, recipient_avatar_url,
         quantity, total_coin_amount, animation_tier, priority_category, priority_weight,
         is_fullscreen, pk_effect_style, duration_ms, loop_count,
         asset_type, animation_url, image_url, thumbnail_url, sound_url, fallback_url, status
       ) VALUES (
         $1,$2,'gift',$3,$4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,$13,
         $14,$15,$16,$17,
         $18,$19,$20,$21,$22,
         $23,$24,$25,$26,
         $27,$28,$29,$30,$31,$32,'queued'
       ) RETURNING *`,
      [
        queueId,
        dedupeKey,
        roomScope,
        tx.live_room_id || null,
        tx.pk_battle_id || null,
        pkHostSide,
        txId,
        animCfg.giftId,
        animCfg.giftName,
        animCfg.giftNameUr,
        tx.sender_user_id,
        tx.sender_nickname || 'Supporter',
        tx.sender_avatar_url || '/assets/following/host1@2x.png',
        tx.recipient_host_id,
        tx.recipient_nickname || 'Host',
        tx.recipient_poppo_id || null,
        tx.recipient_avatar_url || '/assets/following/host2@2x.png',
        quantity,
        totalCoins,
        animCfg.animationTier,
        animCfg.priorityCategory,
        effectivePriorityWeight,
        animCfg.isFullscreen,
        animCfg.pkEffectStyle,
        animCfg.durationMs,
        animCfg.loopCount,
        animCfg.assetType,
        animCfg.animationUrl,
        animCfg.imageUrl,
        animCfg.thumbnailUrl,
        animCfg.soundUrl,
        animCfg.fallbackAssetUrl,
      ]
    );

    const insertedItem = mapQueueRow(insRes.rows[0]);

    // Read-only PK display scores if PK battle (never mutate!)
    let pkScores: { hostAScore: number; hostBScore: number } | null = null;
    if (tx.pk_battle_id) {
      const sRows = await client.query(
        `SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1 LIMIT 1`,
        [tx.pk_battle_id]
      );
      if (sRows.rows[0]) {
        pkScores = {
          hostAScore: parseInt(String(sRows.rows[0].host_a_score ?? '0'), 10),
          hostBScore: parseInt(String(sRows.rows[0].host_b_score ?? '0'), 10),
        };
      }
    }

    // Emit animation:gift_received immediately upon verified transaction
    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, 'animation:gift_received', $2, $3::jsonb)`,
      [
        roomScope,
        queueId,
        JSON.stringify({
          ...insertedItem,
          pkScores,
        }),
      ]
    );

    // Promote immediately if concurrency slots allow; otherwise queue cleanly
    const promo = await sweepAndPromoteInTx(client, roomScope);
    const startedImmediately = promo.promoted.some((p) => p.queueId === queueId);

    const summary = await fetchQueueSummaryInTx(client, roomScope);
    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, 'animation:gift_queue_updated', $2, $3::jsonb)`,
      [
        roomScope,
        queueId,
        JSON.stringify({
          roomScope,
          playingCount: summary.playing.length,
          queuedCount: summary.queued.length,
          playing: summary.playing,
          queued: summary.queued,
        }),
      ]
    );

    const refreshed =
      summary.playing.find((i) => i.queueId === queueId) ||
      summary.queued.find((i) => i.queueId === queueId) ||
      insertedItem;

    return {
      queueItem: refreshed,
      startedImmediately,
      queueDepth: summary.queued.length,
      deduplicated: false,
    };
  });
}

// -----------------------------------------------------------------------------
// 5. Host Entrance Eligibility & Real-Time Trigger (Strict VIP Verification)
// -----------------------------------------------------------------------------
export async function getHostEntranceEligibility(
  hostUserId: string
): Promise<HostEntranceEligibility> {
  const cleanId = (hostUserId || '').trim();
  if (!cleanId) {
    throw new AnimationValidationError(400, 'HOST_ID_REQUIRED', 'hostUserId is required.');
  }

  let userRow: any = null;
  if (UUID_REGEX.test(cleanId)) {
    const rows = await query<any>(
      `SELECT id::text AS id, nickname, poppo_id, avatar_url, host_level
       FROM popolive.users WHERE id = $1 LIMIT 1`,
      [cleanId]
    );
    userRow = rows[0] || null;
  } else {
    const rows = await query<any>(
      `SELECT id::text AS id, nickname, poppo_id, avatar_url, host_level
       FROM popolive.users WHERE id::text = $1 OR poppo_id = $1 LIMIT 1`,
      [cleanId]
    );
    userRow = rows[0] || null;
  }

  const canonicalId = userRow?.id || cleanId;
  const hostLevel = parseInt(String(userRow?.host_level ?? '1'), 10);

  // Module 7.7 integration: enforce exact server-time expiration before evaluating entrance eligibility
  await query(
    `UPDATE popolive.user_vip_memberships
     SET status = 'expired',
         vip_level = 0,
         vip_tier = 'none',
         badge_label = 'NONE',
         special_event_access = FALSE,
         updated_at = NOW()
     WHERE user_id = $1 AND status = 'active' AND expires_at <= NOW()`,
    [canonicalId]
  );
  await query(
    `UPDATE popolive.vip_membership_records
     SET status = 'expired', updated_at = NOW()
     WHERE user_id = $1 AND status = 'active' AND expiry_date <= NOW()`,
    [canonicalId]
  ).catch(() => undefined);

  const vipRows = await query<any>(
    `SELECT * FROM popolive.user_vip_memberships
     WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
     ORDER BY vip_level DESC
     LIMIT 1`,
    [canonicalId]
  );

  const vip = vipRows[0] || null;
  const vipLevel = vip ? parseInt(String(vip.vip_level ?? '0'), 10) : 0;
  const vipActive = vipLevel >= 1;
  const vipTier = vip?.vip_tier || 'none';
  const specialEventAccess = Boolean(vip?.special_event_access);
  const vipBadgeLabel = vipLevel >= 1 ? vip?.badge_label || `VIP ${vipLevel}` : null;

  const catalog = await getAnimationSystemCatalog(false);
  const allowedEntranceTypes: EntranceType[] = [];

  for (const eff of catalog.entranceEffects) {
    if (eff.entranceType === 'standard') {
      allowedEntranceTypes.push('standard');
    } else if (eff.entranceType === 'premium') {
      if (hostLevel >= eff.minHostLevel || vipLevel >= 1 || vipTier === 'premium_host') {
        allowedEntranceTypes.push('premium');
      }
    } else if (eff.entranceType === 'vip') {
      if (vipActive && vipLevel >= eff.requiredVipLevel) {
        allowedEntranceTypes.push('vip');
      }
    } else if (eff.entranceType === 'special_event') {
      if (vipActive && specialEventAccess && vipLevel >= eff.requiredVipLevel) {
        allowedEntranceTypes.push('special_event');
      }
    }
  }

  const storeLoadout = await (await import('@/lib/store')).getUserEquippedStoreLoadout(canonicalId).catch(() => null);
  const storeEntrance = storeLoadout?.entranceEffect || null;

  return {
    hostUserId: canonicalId,
    nickname: userRow?.nickname || (cleanId === 'user_wallet_demo_701' ? 'Supporter 701' : 'Live Host'),
    poppoId: userRow?.poppo_id || '8800001',
    avatarUrl: userRow?.avatar_url || '/assets/studio/host_zara_avatar.png',
    hostLevel,
    vipLevel,
    vipTier,
    vipBadgeLabel,
    specialEventAccess,
    vipActive,
    allowedEntranceTypes,
    equippedStoreEntrance: storeEntrance
      ? {
          inventoryId: storeEntrance.inventoryId,
          itemId: storeEntrance.itemId,
          name: storeEntrance.name,
          previewImageUrl: storeEntrance.previewImageUrl,
          animationAssetUrl: storeEntrance.animationAssetUrl,
          expiresAt: storeEntrance.expiresAt,
        }
      : null,
  };
}

export async function triggerHostEntrance(params: {
  hostUserId: string;
  entranceType?: EntranceType;
  roomId?: string | null;
  pkBattleId?: string | null;
  idempotencyKey?: string | null;
}): Promise<{
  queueItem: AnimationQueueItem;
  eligibility: HostEntranceEligibility;
  startedImmediately: boolean;
}> {
  const requestedType: EntranceType = params.entranceType || 'standard';

  // 1. Validate room / PK stage membership
  const stage = await resolveRoomStage({
    roomId: params.roomId || (!params.pkBattleId ? '880219' : null),
    pkBattleId: params.pkBattleId,
    requireActiveForSend: false,
  });

  // 2. Load real DB host + active VIP entitlement (NEVER give free VIP to ordinary users)
  const eligibility = await getHostEntranceEligibility(params.hostUserId);
  const catalog = await getAnimationSystemCatalog(false);
  const effect = catalog.entranceEffects.find((e) => e.entranceType === requestedType);

  if (!effect || !effect.isActive) {
    throw new AnimationValidationError(
      404,
      'ENTRANCE_EFFECT_NOT_FOUND',
      `Configured entrance effect "${requestedType}" is unavailable or disabled.`
    );
  }

  if (requestedType === 'vip' && (!eligibility.vipActive || eligibility.vipLevel < effect.requiredVipLevel)) {
    throw new AnimationValidationError(
      403,
      'VIP_STATUS_REQUIRED',
      `VIP entrance requires an active VIP membership (Level ${effect.requiredVipLevel}+). Ordinary users cannot trigger VIP effects.`
    );
  }

  if (
    requestedType === 'special_event' &&
    (!eligibility.vipActive || !eligibility.specialEventAccess || eligibility.vipLevel < effect.requiredVipLevel)
  ) {
    throw new AnimationValidationError(
      403,
      'SPECIAL_EVENT_ENTITLEMENT_REQUIRED',
      'Special event entrance requires an approved event VIP privilege.'
    );
  }

  if (
    requestedType === 'premium' &&
    !eligibility.allowedEntranceTypes.includes('premium')
  ) {
    throw new AnimationValidationError(
      403,
      'PREMIUM_ENTRANCE_NOT_UNLOCKED',
      `Premium entrance requires Host Level ${effect.minHostLevel}+ or active VIP status.`
    );
  }

  // Strictly attach VIP badge ONLY when user truly owns an active VIP membership (or approved Star badge on premium)
  const badgeToShow =
    requestedType === 'vip' || requestedType === 'special_event'
      ? eligibility.vipBadgeLabel || effect.vipBadgeLabel || 'VIP'
      : requestedType === 'premium'
      ? effect.vipBadgeLabel || 'STAR HOST'
      : null;

  const pkSide: 'host_a' | 'host_b' | null =
    stage.mode === 'pk_battle'
      ? stage.hosts.find((h) => h.hostId === eligibility.hostUserId)?.side === 'host_b'
        ? 'host_b'
        : stage.hosts.find((h) => h.hostId === eligibility.hostUserId)?.side === 'host_a'
        ? 'host_a'
        : null
      : null;

  const priorityCfg = catalog.priorityConfigs.find(
    (p) => p.configKey === (requestedType === 'vip' ? 'vip_entrance' : requestedType)
  );
  const priorityWeight = Math.max(effect.priorityWeight, priorityCfg?.priorityWeight ?? 30);

  const cleanNonce = (params.idempotencyKey || '').trim();
  const dedupeKey = cleanNonce
    ? `ent:${stage.roomScope}:${cleanNonce}`
    : `ent:${stage.roomScope}:${eligibility.hostUserId}:${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  return withTransaction(async (client) => {
    if (cleanNonce) {
      const existing = await client.query(
        `SELECT * FROM popolive.animation_playback_queue WHERE dedupe_key = $1 LIMIT 1`,
        [dedupeKey]
      );
      if (existing.rows.length > 0) {
        throw new AnimationValidationError(
          409,
          'DUPLICATE_ANIMATION_EVENT',
          'Duplicate host entrance animation request blocked.'
        );
      }
    }

    const queueId = genId('ENTQ');
    const isFullscreen = requestedType === 'vip' || requestedType === 'special_event';

    const storeEntrance = eligibility.equippedStoreEntrance;
    const resolvedAnimUrl = storeEntrance?.animationAssetUrl || effect.animationUrl;
    const resolvedPreviewUrl = storeEntrance?.previewImageUrl || effect.previewImageUrl;
    const resolvedEffectName = storeEntrance?.name || effect.name;

    const insRes = await client.query(
      `INSERT INTO popolive.animation_playback_queue (
         queue_id, dedupe_key, event_category, room_scope, live_room_id, pk_battle_id, pk_host_side,
         entrance_id, entrance_type, gift_name, gift_name_ur,
         recipient_host_id, recipient_nickname, recipient_poppo_id, recipient_avatar_url, vip_badge_label,
         quantity, total_coin_amount, animation_tier, priority_category, priority_weight,
         is_fullscreen, pk_effect_style, duration_ms, loop_count,
         asset_type, animation_url, image_url, thumbnail_url, sound_url, fallback_url, status
       ) VALUES (
         $1,$2,'host_entrance',$3,$4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,$13,$14,$15,
         1,0,$16,$17,$18,
         $19,'center_stage',$20,1,
         $21,$22,$23,$23,$24,$25,'queued'
       ) RETURNING *`,
      [
        queueId,
        dedupeKey,
        stage.roomScope,
        stage.liveRoomId || null,
        stage.pkBattleId || null,
        pkSide,
        effect.entranceId,
        effect.entranceType,
        resolvedEffectName,
        effect.nameUr,
        eligibility.hostUserId,
        eligibility.nickname,
        eligibility.poppoId,
        eligibility.avatarUrl,
        badgeToShow,
        requestedType,
        requestedType === 'vip' || requestedType === 'special_event' ? 'special_event' : 'premium',
        priorityWeight,
        isFullscreen,
        effect.durationMs,
        effect.assetType,
        resolvedAnimUrl,
        resolvedPreviewUrl,
        effect.soundUrl,
        resolvedPreviewUrl,
      ]
    );

    const promo = await sweepAndPromoteInTx(client, stage.roomScope);
    const startedImmediately = promo.promoted.some((p) => p.queueId === queueId);
    const summary = await fetchQueueSummaryInTx(client, stage.roomScope);

    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, 'animation:gift_queue_updated', $2, $3::jsonb)`,
      [
        stage.roomScope,
        queueId,
        JSON.stringify({
          roomScope: stage.roomScope,
          playingCount: summary.playing.length,
          queuedCount: summary.queued.length,
          playing: summary.playing,
          queued: summary.queued,
        }),
      ]
    );

    const finalItem =
      summary.playing.find((i) => i.queueId === queueId) ||
      summary.queued.find((i) => i.queueId === queueId) ||
      mapQueueRow(insRes.rows[0]);

    return {
      queueItem: finalItem,
      eligibility,
      startedImmediately,
    };
  });
}

// -----------------------------------------------------------------------------
// 6. Playback Completion & Reconnect State Recovery
// -----------------------------------------------------------------------------
export async function completeAnimationPlayback(queueId: string): Promise<{
  completedItem: AnimationQueueItem | null;
  promoted: AnimationQueueItem[];
  queuedRemaining: AnimationQueueItem[];
}> {
  const cleanId = (queueId || '').trim();
  if (!cleanId) {
    throw new AnimationValidationError(400, 'QUEUE_ID_REQUIRED', 'queueId is required.');
  }

  return withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT * FROM popolive.animation_playback_queue WHERE queue_id = $1 FOR UPDATE`,
      [cleanId]
    );
    if (existing.rows.length === 0) {
      throw new AnimationValidationError(404, 'QUEUE_ITEM_NOT_FOUND', 'Animation queue item not found.');
    }

    const row = existing.rows[0];
    let completedMapped = mapQueueRow(row);

    if (row.status === 'playing' || row.status === 'queued') {
      const upd = await client.query(
        `UPDATE popolive.animation_playback_queue
         SET status = 'completed', completed_at = NOW()
         WHERE queue_id = $1
         RETURNING *`,
        [cleanId]
      );
      completedMapped = mapQueueRow(upd.rows[0]);

      const completedEv =
        completedMapped.eventCategory === 'host_entrance'
          ? 'animation:host_entrance_completed'
          : 'animation:gift_completed';
      await client.query(
        `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [
          completedMapped.roomScope,
          completedEv,
          completedMapped.queueId,
          JSON.stringify({
            queueId: completedMapped.queueId,
            giftTransactionId: completedMapped.giftTransactionId,
            entranceType: completedMapped.entranceType,
            completedAt: completedMapped.completedAt,
          }),
        ]
      );
    }

    const promo = await sweepAndPromoteInTx(client, completedMapped.roomScope);
    const summary = await fetchQueueSummaryInTx(client, completedMapped.roomScope);

    await client.query(
      `INSERT INTO popolive.animation_realtime_events (room_scope, event_type, queue_id, payload)
       VALUES ($1, 'animation:gift_queue_updated', $2, $3::jsonb)`,
      [
        completedMapped.roomScope,
        completedMapped.queueId,
        JSON.stringify({
          roomScope: completedMapped.roomScope,
          playingCount: summary.playing.length,
          queuedCount: summary.queued.length,
          playing: summary.playing,
          queued: summary.queued,
        }),
      ]
    );

    return {
      completedItem: completedMapped,
      promoted: promo.promoted,
      queuedRemaining: summary.queued,
    };
  });
}

export async function getRoomAnimationStateSync(params: {
  roomScope: string;
  userId?: string | null;
  pkBattleId?: string | null;
}): Promise<{
  roomScope: string;
  activeAnimations: AnimationQueueItem[];
  queuedAnimations: AnimationQueueItem[];
  recentEntrances: AnimationQueueItem[];
  priorityConfigs: AnimationPriorityConfigItem[];
  preferences: UserAnimationPreferences;
  pkScores: { hostAScore: number; hostBScore: number } | null;
  syncedAt: string;
}> {
  const scope = (params.roomScope || 'room:880219').trim();

  const state = await withTransaction(async (client) => {
    await sweepAndPromoteInTx(client, scope);
    return fetchQueueSummaryInTx(client, scope);
  });

  const [recentEntRows, catalog, prefs] = await Promise.all([
    query<any>(
      `SELECT * FROM popolive.animation_playback_queue
       WHERE room_scope = $1 AND event_category = 'host_entrance'
       ORDER BY created_at DESC
       LIMIT 5`,
      [scope]
    ),
    getAnimationSystemCatalog(false),
    getUserAnimationPreferences(params.userId || ''),
  ]);

  let pkScores: { hostAScore: number; hostBScore: number } | null = null;
  const resolvedPkId =
    params.pkBattleId || (scope.startsWith('pk:') ? scope.slice(3) : null);
  if (resolvedPkId && UUID_REGEX.test(resolvedPkId)) {
    const sRows = await query<any>(
      `SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1 LIMIT 1`,
      [resolvedPkId]
    );
    if (sRows[0]) {
      pkScores = {
        hostAScore: parseInt(String(sRows[0].host_a_score ?? '0'), 10),
        hostBScore: parseInt(String(sRows[0].host_b_score ?? '0'), 10),
      };
    }
  }

  return {
    roomScope: scope,
    activeAnimations: state.playing,
    queuedAnimations: state.queued,
    recentEntrances: recentEntRows.map(mapQueueRow),
    priorityConfigs: catalog.priorityConfigs,
    preferences: prefs,
    pkScores,
    syncedAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// 7. Admin Configuration & Audit Trail
// -----------------------------------------------------------------------------
async function writeAnimationAudit(params: {
  targetType: string;
  targetId: string;
  actionType: string;
  actorId: string;
  actorRole: string;
  reason?: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO popolive.animation_admin_audit_logs (
       audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)`,
    [
      genId('AAUD'),
      params.targetType,
      params.targetId,
      params.actionType,
      params.actorId,
      params.actorRole,
      params.reason || null,
      params.beforeData ? JSON.stringify(params.beforeData) : null,
      params.afterData ? JSON.stringify(params.afterData) : null,
      params.ipAddress || null,
    ]
  );
}

export async function adminUpsertGiftAnimation(params: {
  giftId: string;
  animationTier: AnimationTier;
  priorityCategory: PriorityCategory;
  priorityWeight: number;
  durationMs: number;
  loopCount: number;
  isFullscreen: boolean;
  soundUrl?: string | null;
  animationUrl?: string | null;
  assetType?: string | null;
  pkEffectStyle?: PKEffectStyle;
  isActive?: boolean;
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
  reason?: string;
}): Promise<GiftAnimationConfigItem> {
  const giftRows = await query<any>(
    `SELECT * FROM popolive.gift_catalog WHERE gift_id = $1 LIMIT 1`,
    [params.giftId]
  );
  if (giftRows.length === 0) {
    throw new AnimationValidationError(404, 'GIFT_NOT_FOUND', 'Catalog gift does not exist.');
  }

  const durationMs = Math.max(800, Math.min(15000, Math.round(Number(params.durationMs) || 3000)));
  const loopCount = Math.max(1, Math.min(10, Math.round(Number(params.loopCount) || 1)));
  const priorityWeight = Math.max(1, Math.min(1000, Math.round(Number(params.priorityWeight) || 20)));

  const beforeRows = await query<any>(
    `SELECT * FROM popolive.gift_animations WHERE gift_id = $1 LIMIT 1`,
    [params.giftId]
  );

  // If admin also uploaded a new animationUrl or assetType for this gift, keep gift_catalog aligned cleanly
  if (params.animationUrl !== undefined || params.assetType !== undefined) {
    await query(
      `UPDATE popolive.gift_catalog
       SET animation_url = COALESCE($2, animation_url),
           asset_type = COALESCE($3, asset_type),
           updated_at = NOW()
       WHERE gift_id = $1`,
      [params.giftId, params.animationUrl ?? null, params.assetType ?? null]
    );
  }

  const animId = beforeRows[0]?.animation_id || `anim_${params.giftId}`;
  const upserted = await query<any>(
    `INSERT INTO popolive.gift_animations (
       animation_id, gift_id, animation_tier, priority_category, priority_weight,
       duration_ms, loop_count, is_fullscreen, sound_url, preview_image_url,
       fallback_asset_url, pk_effect_style, is_active, updated_by, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
     ON CONFLICT (gift_id) DO UPDATE SET
       animation_tier = EXCLUDED.animation_tier,
       priority_category = EXCLUDED.priority_category,
       priority_weight = EXCLUDED.priority_weight,
       duration_ms = EXCLUDED.duration_ms,
       loop_count = EXCLUDED.loop_count,
       is_fullscreen = EXCLUDED.is_fullscreen,
       sound_url = COALESCE(EXCLUDED.sound_url, popolive.gift_animations.sound_url),
       pk_effect_style = EXCLUDED.pk_effect_style,
       is_active = EXCLUDED.is_active,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING *`,
    [
      animId,
      params.giftId,
      params.animationTier,
      params.priorityCategory,
      priorityWeight,
      durationMs,
      loopCount,
      Boolean(params.isFullscreen),
      params.soundUrl ?? beforeRows[0]?.sound_url ?? '/assets/gifts/sfx/sfx_medium_sparkle.wav',
      giftRows[0].image_url || FALLBACK_GIFT_IMAGE_URL,
      FALLBACK_GIFT_IMAGE_URL,
      params.pkEffectStyle || beforeRows[0]?.pk_effect_style || 'side_burst',
      params.isActive !== undefined ? Boolean(params.isActive) : true,
      params.actorId,
    ]
  );

  await writeAnimationAudit({
    targetType: 'gift_animation',
    targetId: animId,
    actionType: beforeRows.length > 0 ? 'update_gift_animation' : 'create_gift_animation',
    actorId: params.actorId,
    actorRole: params.actorRole,
    reason: params.reason || `Configured ${params.animationTier} animation for ${giftRows[0].name}`,
    beforeData: beforeRows[0] || null,
    afterData: upserted[0],
    ipAddress: params.ipAddress,
  });

  await bumpAnimationCacheVersion();

  const fullRow = await query<any>(
    `SELECT ga.*, gc.name AS gift_name, gc.name_ur AS gift_name_ur,
            gc.coin_price, gc.asset_type, gc.animation_url,
            gc.image_url, gc.thumbnail_url, gc.is_active AS gift_active
     FROM popolive.gift_animations ga
     INNER JOIN popolive.gift_catalog gc ON gc.gift_id = ga.gift_id
     WHERE ga.gift_id = $1 LIMIT 1`,
    [params.giftId]
  );

  return mapGiftAnimationRow(fullRow[0]);
}

export async function adminUpdateEntranceEffect(params: {
  entranceType: EntranceType;
  name?: string;
  nameUr?: string;
  requiredVipLevel?: number;
  minHostLevel?: number;
  requiresSpecialEvent?: boolean;
  vipBadgeLabel?: string | null;
  assetType?: string;
  animationUrl?: string;
  previewImageUrl?: string;
  soundUrl?: string | null;
  durationMs?: number;
  priorityWeight?: number;
  isActive?: boolean;
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
  reason?: string;
}): Promise<HostEntranceEffectItem> {
  const beforeRows = await query<any>(
    `SELECT * FROM popolive.host_entrance_effects WHERE entrance_type = $1 LIMIT 1`,
    [params.entranceType]
  );
  if (beforeRows.length === 0) {
    throw new AnimationValidationError(404, 'ENTRANCE_NOT_FOUND', 'Host entrance tier not found.');
  }

  const prev = beforeRows[0];
  const nextDuration =
    params.durationMs !== undefined
      ? Math.max(1000, Math.min(15000, Math.round(params.durationMs)))
      : parseInt(String(prev.duration_ms), 10);

  const upd = await query<any>(
    `UPDATE popolive.host_entrance_effects
     SET name = $2,
         name_ur = $3,
         required_vip_level = $4,
         min_host_level = $5,
         requires_special_event = $6,
         vip_badge_label = $7,
         asset_type = $8,
         animation_url = $9,
         preview_image_url = $10,
         sound_url = $11,
         duration_ms = $12,
         priority_weight = $13,
         is_active = $14,
         updated_by = $15,
         updated_at = NOW()
     WHERE entrance_type = $1
     RETURNING *`,
    [
      params.entranceType,
      params.name ?? prev.name,
      params.nameUr ?? prev.name_ur,
      params.requiredVipLevel ?? prev.required_vip_level,
      params.minHostLevel ?? prev.min_host_level,
      params.requiresSpecialEvent ?? prev.requires_special_event,
      params.vipBadgeLabel !== undefined ? params.vipBadgeLabel : prev.vip_badge_label,
      params.assetType ?? prev.asset_type,
      params.animationUrl ?? prev.animation_url,
      params.previewImageUrl ?? prev.preview_image_url,
      params.soundUrl !== undefined ? params.soundUrl : prev.sound_url,
      nextDuration,
      params.priorityWeight ?? prev.priority_weight,
      params.isActive !== undefined ? Boolean(params.isActive) : prev.is_active,
      params.actorId,
    ]
  );

  await writeAnimationAudit({
    targetType: 'host_entrance_effect',
    targetId: prev.entrance_id,
    actionType: 'update_host_entrance',
    actorId: params.actorId,
    actorRole: params.actorRole,
    reason: params.reason || `Updated ${params.entranceType} entrance effect`,
    beforeData: prev,
    afterData: upd[0],
    ipAddress: params.ipAddress,
  });

  await bumpAnimationCacheVersion();
  return mapEntranceRow(upd[0]);
}

export async function adminUpdatePriorityConfig(params: {
  configKey: string;
  priorityWeight?: number;
  maxConcurrent?: number;
  defaultDurationMs?: number;
  isEnabled?: boolean;
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
}): Promise<AnimationPriorityConfigItem> {
  const beforeRows = await query<any>(
    `SELECT * FROM popolive.animation_priority_config WHERE config_key = $1 LIMIT 1`,
    [params.configKey]
  );
  if (beforeRows.length === 0) {
    throw new AnimationValidationError(404, 'PRIORITY_KEY_NOT_FOUND', 'Priority config key not found.');
  }
  const prev = beforeRows[0];

  const upd = await query<any>(
    `UPDATE popolive.animation_priority_config
     SET priority_weight = $2,
         max_concurrent = $3,
         default_duration_ms = $4,
         is_enabled = $5,
         updated_by = $6,
         updated_at = NOW()
     WHERE config_key = $1
     RETURNING *`,
    [
      params.configKey,
      params.priorityWeight !== undefined ? Math.max(1, Math.round(params.priorityWeight)) : prev.priority_weight,
      params.maxConcurrent !== undefined ? Math.max(1, Math.min(10, Math.round(params.maxConcurrent))) : prev.max_concurrent,
      params.defaultDurationMs !== undefined
        ? Math.max(800, Math.min(15000, Math.round(params.defaultDurationMs)))
        : prev.default_duration_ms,
      params.isEnabled !== undefined ? Boolean(params.isEnabled) : prev.is_enabled,
      params.actorId,
    ]
  );

  await writeAnimationAudit({
    targetType: 'priority_config',
    targetId: params.configKey,
    actionType: 'update_priority_config',
    actorId: params.actorId,
    actorRole: params.actorRole,
    reason: `Updated priority rule for ${params.configKey}`,
    beforeData: prev,
    afterData: upd[0],
    ipAddress: params.ipAddress,
  });

  await bumpAnimationCacheVersion();
  return mapPriorityRow(upd[0]);
}

export async function listAnimationAuditLogs(limit = 50): Promise<AnimationAuditLogRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const rows = await query<any>(
    `SELECT * FROM popolive.animation_admin_audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );
  return rows.map((r: any) => ({
    auditId: r.audit_id,
    targetType: r.target_type,
    targetId: r.target_id,
    actionType: r.action_type,
    actorId: r.actor_id,
    actorRole: r.actor_role,
    reason: r.reason || null,
    beforeData: r.before_data,
    afterData: r.after_data,
    ipAddress: r.ip_address || null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));
}

export async function adminSetUserVipMembership(params: {
  userId: string;
  vipLevel: number;
  vipTier: 'none' | 'premium_host' | 'vip_gold' | 'vip_diamond' | 'special_event_vip';
  badgeLabel: string;
  specialEventAccess: boolean;
  status: 'active' | 'expired' | 'revoked';
  expiresInDays?: number;
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
}): Promise<any> {
  const beforeRows = await query<any>(
    `SELECT * FROM popolive.user_vip_memberships WHERE user_id = $1 LIMIT 1`,
    [params.userId]
  );
  const membershipId = beforeRows[0]?.membership_id || genId('VIPM');
  const days = Math.max(1, Math.min(3650, params.expiresInDays || 365));

  const upd = await query<any>(
    `INSERT INTO popolive.user_vip_memberships (
       membership_id, user_id, vip_level, vip_tier, badge_label,
       special_event_access, status, granted_by, expires_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() + ($9 || ' days')::interval, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       vip_level = EXCLUDED.vip_level,
       vip_tier = EXCLUDED.vip_tier,
       badge_label = EXCLUDED.badge_label,
       special_event_access = EXCLUDED.special_event_access,
       status = EXCLUDED.status,
       granted_by = EXCLUDED.granted_by,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()
     RETURNING *`,
    [
      membershipId,
      params.userId,
      Math.max(0, Math.round(params.vipLevel)),
      params.vipTier,
      params.badgeLabel || 'VIP',
      Boolean(params.specialEventAccess),
      params.status,
      params.actorId,
      String(days),
    ]
  );

  await writeAnimationAudit({
    targetType: 'vip_membership',
    targetId: membershipId,
    actionType: 'set_vip_membership',
    actorId: params.actorId,
    actorRole: params.actorRole,
    reason: `Set VIP ${params.vipTier} (level ${params.vipLevel}, status=${params.status}) for ${params.userId}`,
    beforeData: beforeRows[0] || null,
    afterData: upd[0],
    ipAddress: params.ipAddress,
  });

  await bumpAnimationCacheVersion();
  return upd[0];
}

export async function listVipMemberships(): Promise<any[]> {
  return query<any>(
    `SELECT vm.*, u.nickname, u.poppo_id
     FROM popolive.user_vip_memberships vm
     LEFT JOIN popolive.users u ON u.id::text = vm.user_id
     ORDER BY vm.vip_level DESC, vm.updated_at DESC
     LIMIT 30`
  );
}
