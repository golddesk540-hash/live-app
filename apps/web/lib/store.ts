import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';
import {
  DEFAULT_DEMO_WALLET_USER_ID,
  deductCoinsInTx,
  creditCoinsInTx,
  ensureWalletLocked,
  getFinanceRules,
  isAuthorizedFinanceAdmin,
} from '@/lib/wallet';
import { resolveActiveUserVipProfile, resolveCanonicalVipUserId } from '@/lib/vip';
import {
  getUserRecognitionSummary,
  reverseRecognitionForSourceInTx,
} from '@/lib/recognition';

// =============================================================================
// Popo Live Phase 7 Module 7.9 — Complete Virtual Store Engine
// Authoritative backend catalog, configurable categories, atomic purchases,
// server-enforced durations & expiry, VIP/Wealth/Shining/Honor gating,
// slot-exclusive equipment, real-time SSE events, and Admin audit controls.
// =============================================================================

export type StoreEquipSlot =
  | 'profile_frame'
  | 'name_decoration'
  | 'chat_decoration'
  | 'entrance_effect'
  | 'theme'
  | 'special_badge'
  | 'accessory'
  | 'none';

export const STORE_ACTIVE_EQUIP_SLOTS: readonly Exclude<StoreEquipSlot, 'none'>[] = [
  'profile_frame',
  'name_decoration',
  'chat_decoration',
  'entrance_effect',
  'theme',
  'special_badge',
  'accessory',
];

export type StoreDurationType =
  | 'permanent'
  | 'limited_duration'
  | 'event_based'
  | 'membership_based';

export const STORE_DURATION_TYPES: readonly StoreDurationType[] = [
  'permanent',
  'limited_duration',
  'event_based',
  'membership_based',
];

export const STORE_FORBIDDEN_CLIENT_KEYS = [
  'price',
  'coinPrice',
  'coin_price',
  'amount',
  'coinAmount',
  'coin_amount',
  'walletBalance',
  'coins',
  'discount',
  'discountPrice',
  'expiresAt',
  'expires_at',
  'grantedBy',
  'granted_by',
  'isEquipped',
  'is_equipped',
  'inventoryId',
  'inventory_id',
  'vipLevel',
  'vip_level',
  'vipActive',
  'wealthLevel',
  'wealth_level',
  'shiningLevel',
  'shining_level',
  'honorLevel',
  'honor_level',
  'status',
  'purchaseId',
  'coinTxId',
  'freeGrant',
] as const;

export interface StoreCategoryRecord {
  categoryId: string;
  slug: string;
  name: string;
  nameUr: string;
  shortLabel: string;
  shortLabelUr: string;
  description: string;
  descriptionUr: string;
  iconKey: string;
  defaultEquipSlot: StoreEquipSlot;
  displayOrder: number;
  isApproved: boolean;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreItemEligibility {
  eligible: boolean;
  reasons: string[];
  vipRequired: boolean;
  vipMet: boolean;
  minWealthLevel: number;
  wealthMet: boolean;
  minShiningLevel: number;
  shiningMet: boolean;
  minHonorLevel: number;
  honorMet: boolean;
  usageLimitPerUser: number | null;
  ownedPurchaseCount: number;
  remainingPurchases: number | null;
  inStock: boolean;
}

export interface StoreItemRecord {
  itemId: string;
  categoryId: string;
  categoryName?: string;
  categoryNameUr?: string;
  categoryShortLabel?: string;
  categoryShortLabelUr?: string;
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  thumbnailUrl: string;
  previewImageUrl: string;
  animationAssetUrl: string | null;
  visualStyle: Record<string, any>;
  coinPrice: number;
  durationType: StoreDurationType;
  durationValue: number | null;
  durationUnit: 'days' | 'hours' | 'seconds' | 'permanent' | 'event' | 'vip';
  durationLabel: string;
  durationLabelUr: string;
  eventEndAt: string | null;
  equipSlot: StoreEquipSlot;
  isEquippable: boolean;
  usageLimitPerUser: number | null;
  maxTotalStock: number | null;
  soldCount: number;
  vipOnly: boolean;
  requiredVipLevel: number;
  minWealthLevel: number;
  minShiningLevel: number;
  minHonorLevel: number;
  eligibilityRules: Record<string, any>;
  isFeatured: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  isApproved: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  userEligibility?: StoreItemEligibility;
}

export interface StorePurchaseRecord {
  purchaseId: string;
  idempotencyKey: string | null;
  userId: string;
  itemId: string;
  categoryId: string;
  itemNameSnapshot: string;
  quantity: number;
  unitCoinPrice: number;
  totalCoins: number;
  coinTxId: string | null;
  inventoryId: string | null;
  status: 'completed' | 'failed' | 'refunded' | 'reversed';
  failureCode: string | null;
  failureReason: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserStoreInventoryRecord {
  inventoryId: string;
  userId: string;
  itemId: string;
  categoryId: string;
  categoryName?: string;
  categoryNameUr?: string;
  itemName: string;
  itemNameUr: string;
  thumbnailUrl: string;
  previewImageUrl: string;
  animationAssetUrl: string | null;
  visualStyle: Record<string, any>;
  equipSlot: StoreEquipSlot;
  isEquippable: boolean;
  purchaseId: string | null;
  quantity: number;
  status: 'active' | 'expired' | 'revoked' | 'consumed';
  isEquipped: boolean;
  grantedBy: 'purchase' | 'vip_plan' | 'admin_grant';
  durationType: StoreDurationType;
  durationLabel: string;
  durationLabelUr: string;
  purchasedAt: string;
  activatedAt: string;
  expiresAt: string | null;
  updatedAt: string;
}

export interface EquippedStoreSlotItem {
  inventoryId: string;
  itemId: string;
  equipSlot: Exclude<StoreEquipSlot, 'none'>;
  name: string;
  nameUr: string;
  thumbnailUrl: string;
  previewImageUrl: string;
  animationAssetUrl: string | null;
  visualStyle: Record<string, any>;
  equippedAt: string;
  expiresAt: string | null;
}

export interface UserEquippedStoreLoadout {
  profileFrame: EquippedStoreSlotItem | null;
  nameDecoration: EquippedStoreSlotItem | null;
  chatDecoration: EquippedStoreSlotItem | null;
  entranceEffect: EquippedStoreSlotItem | null;
  theme: EquippedStoreSlotItem | null;
  specialBadge: EquippedStoreSlotItem | null;
  accessory: EquippedStoreSlotItem | null;
  itemsBySlot: Record<string, EquippedStoreSlotItem>;
}

export class StoreValidationError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const STORE_CACHE_VERSION_KEY = 'popolive:store:cache:version';

export function generateStoreId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function detectTamperedStoreKeys(body: Record<string, any> | null | undefined): string | null {
  if (!body || typeof body !== 'object') return null;
  for (const key of STORE_FORBIDDEN_CLIENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      return key;
    }
  }
  return null;
}

async function getStoreCacheVersion(): Promise<string> {
  const existing = await redisGet(STORE_CACHE_VERSION_KEY);
  if (existing) return existing;
  await redisSetWithTtl(STORE_CACHE_VERSION_KEY, 'v1', 86400);
  return 'v1';
}

export async function invalidateStoreCaches(): Promise<void> {
  await redisDel(STORE_CACHE_VERSION_KEY);
  await redisSetWithTtl(
    STORE_CACHE_VERSION_KEY,
    `v_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    86400
  );
}

async function runSql(dbClient: any, text: string, values?: any[]): Promise<any[]> {
  if (dbClient && typeof dbClient.query === 'function') {
    const res = await dbClient.query(text, values);
    return res.rows || [];
  }
  return query<any>(text, values);
}

function parseJsonField(val: any, fallback: any = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(String(val));
  } catch {
    return fallback;
  }
}

function mapCategoryRow(row: any): StoreCategoryRecord {
  return {
    categoryId: String(row.category_id),
    slug: String(row.slug),
    name: String(row.name),
    nameUr: String(row.name_ur || row.name),
    shortLabel: String(row.short_label || row.name),
    shortLabelUr: String(row.short_label_ur || row.name_ur || row.short_label),
    description: String(row.description || ''),
    descriptionUr: String(row.description_ur || ''),
    iconKey: String(row.icon_key || 'sparkles'),
    defaultEquipSlot: (row.default_equip_slot || 'none') as StoreEquipSlot,
    displayOrder: parseInt(String(row.display_order ?? 100), 10),
    isApproved: Boolean(row.is_approved),
    isActive: Boolean(row.is_active),
    itemCount: row.item_count !== undefined ? parseInt(String(row.item_count), 10) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapItemRow(row: any): StoreItemRecord {
  return {
    itemId: String(row.item_id),
    categoryId: String(row.category_id),
    categoryName: row.category_name ? String(row.category_name) : undefined,
    categoryNameUr: row.category_name_ur ? String(row.category_name_ur) : undefined,
    categoryShortLabel: row.category_short_label ? String(row.category_short_label) : undefined,
    categoryShortLabelUr: row.category_short_label_ur ? String(row.category_short_label_ur) : undefined,
    name: String(row.name),
    nameUr: String(row.name_ur || row.name),
    description: String(row.description || ''),
    descriptionUr: String(row.description_ur || ''),
    thumbnailUrl: String(row.thumbnail_url),
    previewImageUrl: String(row.preview_image_url || row.thumbnail_url),
    animationAssetUrl: row.animation_asset_url ? String(row.animation_asset_url) : null,
    visualStyle: parseJsonField(row.visual_style, {}),
    coinPrice: parseInt(String(row.coin_price ?? 0), 10),
    durationType: (row.duration_type || 'limited_duration') as StoreDurationType,
    durationValue: row.duration_value !== null && row.duration_value !== undefined ? parseInt(String(row.duration_value), 10) : null,
    durationUnit: (row.duration_unit || 'days') as StoreItemRecord['durationUnit'],
    durationLabel: String(row.duration_label || 'Permanent'),
    durationLabelUr: String(row.duration_label_ur || row.duration_label || 'مستقل'),
    eventEndAt: row.event_end_at ? new Date(row.event_end_at).toISOString() : null,
    equipSlot: (row.equip_slot || 'none') as StoreEquipSlot,
    isEquippable: Boolean(row.is_equippable),
    usageLimitPerUser:
      row.usage_limit_per_user !== null && row.usage_limit_per_user !== undefined
        ? parseInt(String(row.usage_limit_per_user), 10)
        : null,
    maxTotalStock:
      row.max_total_stock !== null && row.max_total_stock !== undefined
        ? parseInt(String(row.max_total_stock), 10)
        : null,
    soldCount: parseInt(String(row.sold_count ?? 0), 10),
    vipOnly: Boolean(row.vip_only),
    requiredVipLevel: parseInt(String(row.required_vip_level ?? 0), 10),
    minWealthLevel: parseInt(String(row.min_wealth_level ?? 1), 10),
    minShiningLevel: parseInt(String(row.min_shining_level ?? 1), 10),
    minHonorLevel: parseInt(String(row.min_honor_level ?? 1), 10),
    eligibilityRules: parseJsonField(row.eligibility_rules, {}),
    isFeatured: Boolean(row.is_featured),
    isPopular: Boolean(row.is_popular),
    isNewArrival: Boolean(row.is_new_arrival),
    isApproved: Boolean(row.is_approved),
    isActive: Boolean(row.is_active),
    displayOrder: parseInt(String(row.display_order ?? 100), 10),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapPurchaseRow(row: any): StorePurchaseRecord {
  return {
    purchaseId: String(row.purchase_id),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    userId: String(row.user_id),
    itemId: String(row.item_id),
    categoryId: String(row.category_id),
    itemNameSnapshot: String(row.item_name_snapshot),
    quantity: parseInt(String(row.quantity ?? 1), 10),
    unitCoinPrice: parseInt(String(row.unit_coin_price ?? 0), 10),
    totalCoins: parseInt(String(row.total_coins ?? 0), 10),
    coinTxId: row.coin_tx_id ? String(row.coin_tx_id) : null,
    inventoryId: row.inventory_id ? String(row.inventory_id) : null,
    status: row.status as StorePurchaseRecord['status'],
    failureCode: row.failure_code ? String(row.failure_code) : null,
    failureReason: row.failure_reason ? String(row.failure_reason) : null,
    metadata: parseJsonField(row.metadata, {}),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapInventoryRow(row: any): UserStoreInventoryRecord {
  return {
    inventoryId: String(row.inventory_id),
    userId: String(row.user_id),
    itemId: String(row.item_id),
    categoryId: String(row.category_id),
    categoryName: row.category_name ? String(row.category_name) : undefined,
    categoryNameUr: row.category_name_ur ? String(row.category_name_ur) : undefined,
    itemName: String(row.item_name || row.item_id),
    itemNameUr: String(row.item_name_ur || row.item_name || row.item_id),
    thumbnailUrl: String(row.thumbnail_url || '/assets/store/frame_golden_feather.png'),
    previewImageUrl: String(row.preview_image_url || row.thumbnail_url || '/assets/store/frame_golden_feather.png'),
    animationAssetUrl: row.animation_asset_url ? String(row.animation_asset_url) : null,
    visualStyle: parseJsonField(row.visual_style, {}),
    equipSlot: (row.equip_slot || 'none') as StoreEquipSlot,
    isEquippable: row.is_equippable !== undefined ? Boolean(row.is_equippable) : row.equip_slot !== 'none',
    purchaseId: row.purchase_id ? String(row.purchase_id) : null,
    quantity: parseInt(String(row.quantity ?? 1), 10),
    status: row.status as UserStoreInventoryRecord['status'],
    isEquipped: Boolean(row.is_equipped),
    grantedBy: (row.granted_by || 'purchase') as UserStoreInventoryRecord['grantedBy'],
    durationType: (row.duration_type || 'limited_duration') as StoreDurationType,
    durationLabel: String(row.duration_label || 'Permanent'),
    durationLabelUr: String(row.duration_label_ur || row.duration_label || 'مستقل'),
    purchasedAt: row.purchased_at ? new Date(row.purchased_at).toISOString() : new Date().toISOString(),
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : new Date().toISOString(),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function emitStoreRealtimeEvent(
  dbClient: any,
  userId: string,
  eventName: string,
  payload: Record<string, any>
): Promise<void> {
  await runSql(
    dbClient,
    `INSERT INTO popolive.store_realtime_events (user_id, event_name, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventName, JSON.stringify({ ...payload, timestamp: new Date().toISOString() })]
  );
}

export async function resolveStoreCanonicalUserId(rawIdentifier: string): Promise<string> {
  const clean = String(rawIdentifier || '').trim();
  if (!clean) return DEFAULT_DEMO_WALLET_USER_ID;
  if (clean === DEFAULT_DEMO_WALLET_USER_ID) return clean;
  const resolved = await resolveCanonicalVipUserId(clean);
  return resolved || clean;
}

export function emptyEquippedLoadout(): UserEquippedStoreLoadout {
  return {
    profileFrame: null,
    nameDecoration: null,
    chatDecoration: null,
    entranceEffect: null,
    theme: null,
    specialBadge: null,
    accessory: null,
    itemsBySlot: {},
  };
}

// =============================================================================
// 1. Server-Time Expiry Synchronization
// =============================================================================

export async function syncExpiredStoreItems(
  dbClient?: any,
  targetUserId?: string
): Promise<number> {
  const params: any[] = [];
  const userClause = targetUserId ? `AND inv.user_id = $1` : '';
  if (targetUserId) params.push(targetUserId);

  // Expire fixed-time and event-based items whose expires_at <= NOW()
  const expiredTimeRows = await runSql(
    dbClient,
    `UPDATE popolive.user_store_inventory inv
     SET status = 'expired',
         is_equipped = FALSE,
         updated_at = NOW()
     WHERE inv.status = 'active'
       AND inv.expires_at IS NOT NULL
       AND inv.expires_at <= NOW()
       ${userClause}
     RETURNING inv.inventory_id, inv.user_id, inv.item_id, inv.equip_slot`,
    params
  );

  // Expire membership_based items when user no longer has an active VIP membership
  const expiredMembershipRows = await runSql(
    dbClient,
    `UPDATE popolive.user_store_inventory inv
     SET status = 'expired',
         is_equipped = FALSE,
         updated_at = NOW()
     FROM popolive.store_items si
     WHERE si.item_id = inv.item_id
       AND inv.status = 'active'
       AND si.duration_type = 'membership_based'
       ${userClause}
       AND NOT EXISTS (
         SELECT 1 FROM popolive.vip_membership_records v
         WHERE v.user_id = inv.user_id
           AND v.status = 'active'
           AND v.expiry_date > NOW()
       )
     RETURNING inv.inventory_id, inv.user_id, inv.item_id, inv.equip_slot`,
    params
  );

  const allExpired = [...expiredTimeRows, ...expiredMembershipRows];
  if (allExpired.length === 0) return 0;

  const expiredIds = allExpired.map((r) => String(r.inventory_id));
  await runSql(
    dbClient,
    `DELETE FROM popolive.user_store_equipment WHERE inventory_id = ANY($1)`,
    [expiredIds]
  );

  const affectedUsers = new Set<string>();
  for (const row of allExpired) {
    const uid = String(row.user_id);
    affectedUsers.add(uid);
    await emitStoreRealtimeEvent(dbClient, uid, 'store:item_expired', {
      userId: uid,
      inventoryId: row.inventory_id,
      itemId: row.item_id,
      equipSlot: row.equip_slot,
    });
  }

  for (const uid of Array.from(affectedUsers)) {
    await emitStoreRealtimeEvent(dbClient, uid, 'store:inventory_updated', {
      userId: uid,
      reason: 'item_expired',
    });
  }

  return allExpired.length;
}

// =============================================================================
// 2. Configurable Categories, Store Catalog & Item Details
// =============================================================================

export async function getStoreCategories(
  options: { includeInactive?: boolean } = {}
): Promise<StoreCategoryRecord[]> {
  const includeInactive = Boolean(options.includeInactive);
  const ver = await getStoreCacheVersion();
  const cacheKey = `popolive:store:categories:${ver}:${includeInactive ? 'all' : 'active'}`;

  if (!includeInactive) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore stale parse error
      }
    }
  }

  const whereClause = includeInactive
    ? ''
    : 'WHERE c.is_active = TRUE AND c.is_approved = TRUE';

  const rows = await query<any>(
    `SELECT c.*,
            (
              SELECT COUNT(*)::int
              FROM popolive.store_items i
              WHERE i.category_id = c.category_id
                ${includeInactive ? '' : 'AND i.is_active = TRUE AND i.is_approved = TRUE'}
            ) AS item_count
     FROM popolive.store_categories c
     ${whereClause}
     ORDER BY c.display_order ASC, c.name ASC`
  );

  const mapped = rows.map(mapCategoryRow);
  if (!includeInactive) {
    await redisSetWithTtl(cacheKey, JSON.stringify(mapped), 60);
  }
  return mapped;
}

async function evaluateUserEligibilityForItems(
  items: StoreItemRecord[],
  canonicalUserId: string
): Promise<StoreItemRecord[]> {
  if (items.length === 0) return items;

  const [vip, recognition, purchaseCountsRows] = await Promise.all([
    resolveActiveUserVipProfile(canonicalUserId),
    getUserRecognitionSummary(canonicalUserId, { includePrivate: false, skipCache: false }),
    query<any>(
      `SELECT item_id, COALESCE(SUM(quantity), 0)::int AS bought_cnt
       FROM popolive.store_purchases
       WHERE user_id = $1 AND status = 'completed'
       GROUP BY item_id`,
      [canonicalUserId]
    ),
  ]);

  const boughtByItem = new Map<string, number>();
  for (const r of purchaseCountsRows) {
    boughtByItem.set(String(r.item_id), parseInt(String(r.bought_cnt), 10));
  }

  return items.map((item) => {
    const ownedPurchaseCount = boughtByItem.get(item.itemId) || 0;
    const vipRequired = item.vipOnly || item.requiredVipLevel > 0;
    const vipMet = !vipRequired || (vip.hasActiveVip && vip.vipLevel >= Math.max(1, item.requiredVipLevel));
    const wealthMet = recognition.wealth.currentLevelNumber >= item.minWealthLevel;
    const shiningMet = recognition.shining.currentLevelNumber >= item.minShiningLevel;
    const honorMet = recognition.honor.currentLevelNumber >= item.minHonorLevel;
    const remainingPurchases =
      item.usageLimitPerUser !== null ? Math.max(0, item.usageLimitPerUser - ownedPurchaseCount) : null;
    const limitMet = remainingPurchases === null || remainingPurchases > 0;
    const inStock = item.maxTotalStock === null || item.soldCount < item.maxTotalStock;
    const eventActive =
      item.durationType !== 'event_based' || !item.eventEndAt || new Date(item.eventEndAt).getTime() > Date.now();

    const reasons: string[] = [];
    if (!vipMet) reasons.push(`Requires VIP Level ${Math.max(1, item.requiredVipLevel)}+`);
    if (!wealthMet) reasons.push(`Requires Wealth Level ${item.minWealthLevel}+`);
    if (!shiningMet) reasons.push(`Requires Shining Level ${item.minShiningLevel}+`);
    if (!honorMet) reasons.push(`Requires Honor Level ${item.minHonorLevel}+`);
    if (!limitMet) reasons.push(`Purchase limit reached (${item.usageLimitPerUser}/${item.usageLimitPerUser})`);
    if (!inStock) reasons.push('Out of stock');
    if (!eventActive) reasons.push('Event period has ended');

    return {
      ...item,
      userEligibility: {
        eligible: reasons.length === 0,
        reasons,
        vipRequired,
        vipMet,
        minWealthLevel: item.minWealthLevel,
        wealthMet,
        minShiningLevel: item.minShiningLevel,
        shiningMet,
        minHonorLevel: item.minHonorLevel,
        honorMet,
        usageLimitPerUser: item.usageLimitPerUser,
        ownedPurchaseCount,
        remainingPurchases,
        inStock,
      },
    };
  });
}

export async function getStoreCatalog(options: {
  categoryId?: string;
  search?: string;
  filter?: 'all' | 'featured' | 'popular' | 'new';
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  userId?: string | null;
}): Promise<{
  categories: StoreCategoryRecord[];
  items: StoreItemRecord[];
  featuredItems: StoreItemRecord[];
  popularItems: StoreItemRecord[];
  newArrivals: StoreItemRecord[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const categoryParam = (options.categoryId || '').trim();
  const search = (options.search || '').trim();
  const filter = options.filter || 'all';
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 24));
  const includeInactive = Boolean(options.includeInactive);

  const ver = await getStoreCacheVersion();
  const cacheKey = `popolive:store:cat:${ver}:${categoryParam}:${search}:${filter}:${page}:${limit}:${includeInactive}`;
  let baseData: {
    categories: StoreCategoryRecord[];
    items: StoreItemRecord[];
    featuredItems: StoreItemRecord[];
    popularItems: StoreItemRecord[];
    newArrivals: StoreItemRecord[];
    totalCount: number;
  } | null = null;

  if (!includeInactive) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        baseData = JSON.parse(cached);
      } catch {
        baseData = null;
      }
    }
  }

  if (!baseData) {
    const categories = await getStoreCategories({ includeInactive });

    const conditions: string[] = [];
    const params: any[] = [];
    let p = 1;

    if (!includeInactive) {
      conditions.push(`i.is_active = TRUE AND i.is_approved = TRUE AND c.is_active = TRUE AND c.is_approved = TRUE`);
    }

    if (categoryParam && categoryParam.toLowerCase() !== 'all') {
      conditions.push(`(i.category_id = $${p} OR c.slug = $${p})`);
      params.push(categoryParam);
      p++;
    }

    if (search) {
      conditions.push(
        `(i.name ILIKE $${p} OR i.name_ur ILIKE $${p} OR i.description ILIKE $${p} OR c.name ILIKE $${p})`
      );
      params.push(`%${search}%`);
      p++;
    }

    if (filter === 'featured') conditions.push('i.is_featured = TRUE');
    else if (filter === 'popular') conditions.push('i.is_popular = TRUE');
    else if (filter === 'new') conditions.push('i.is_new_arrival = TRUE');

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [countRows, itemRows, shelfRows] = await Promise.all([
      query<any>(
        `SELECT COUNT(*)::int AS cnt
         FROM popolive.store_items i
         JOIN popolive.store_categories c ON c.category_id = i.category_id
         ${whereSql}`,
        params
      ),
      query<any>(
        `SELECT i.*,
                c.name AS category_name,
                c.name_ur AS category_name_ur,
                c.short_label AS category_short_label,
                c.short_label_ur AS category_short_label_ur
         FROM popolive.store_items i
         JOIN popolive.store_categories c ON c.category_id = i.category_id
         ${whereSql}
         ORDER BY i.display_order ASC, i.created_at DESC
         LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<any>(
        `SELECT i.*,
                c.name AS category_name,
                c.name_ur AS category_name_ur,
                c.short_label AS category_short_label,
                c.short_label_ur AS category_short_label_ur
         FROM popolive.store_items i
         JOIN popolive.store_categories c ON c.category_id = i.category_id
         WHERE i.is_active = TRUE AND i.is_approved = TRUE AND c.is_active = TRUE AND c.is_approved = TRUE
           AND (i.is_featured = TRUE OR i.is_popular = TRUE OR i.is_new_arrival = TRUE)
         ORDER BY i.display_order ASC`
      ),
    ]);

    const mappedShelf = shelfRows.map(mapItemRow);
    baseData = {
      categories,
      items: itemRows.map(mapItemRow),
      featuredItems: mappedShelf.filter((i) => i.isFeatured),
      popularItems: mappedShelf.filter((i) => i.isPopular),
      newArrivals: mappedShelf.filter((i) => i.isNewArrival),
      totalCount: parseInt(String(countRows[0]?.cnt ?? 0), 10),
    };

    if (!includeInactive) {
      await redisSetWithTtl(cacheKey, JSON.stringify(baseData), 60);
    }
  }

  let items = baseData.items;
  let featuredItems = baseData.featuredItems;
  let popularItems = baseData.popularItems;
  let newArrivals = baseData.newArrivals;

  if (options.userId) {
    const canonicalUserId = await resolveStoreCanonicalUserId(options.userId);
    const allUnique = new Map<string, StoreItemRecord>();
    for (const it of [...items, ...featuredItems, ...popularItems, ...newArrivals]) {
      allUnique.set(it.itemId, it);
    }
    const evaluated = await evaluateUserEligibilityForItems(Array.from(allUnique.values()), canonicalUserId);
    const evalMap = new Map(evaluated.map((i) => [i.itemId, i]));
    items = items.map((i) => evalMap.get(i.itemId) || i);
    featuredItems = featuredItems.map((i) => evalMap.get(i.itemId) || i);
    popularItems = popularItems.map((i) => evalMap.get(i.itemId) || i);
    newArrivals = newArrivals.map((i) => evalMap.get(i.itemId) || i);
  }

  return {
    categories: baseData.categories,
    items,
    featuredItems,
    popularItems,
    newArrivals,
    totalCount: baseData.totalCount,
    page,
    limit,
    hasMore: page * limit < baseData.totalCount,
  };
}

export async function getStoreItemDetail(
  itemId: string,
  options: { includeInactive?: boolean; userId?: string | null } = {}
): Promise<StoreItemRecord> {
  const cleanId = String(itemId || '').trim();
  if (!cleanId) {
    throw new StoreValidationError(400, 'STORE_ITEM_ID_REQUIRED', 'Store item ID is required.');
  }

  const rows = await query<any>(
    `SELECT i.*,
            c.name AS category_name,
            c.name_ur AS category_name_ur,
            c.short_label AS category_short_label,
            c.short_label_ur AS category_short_label_ur,
            c.is_active AS category_active,
            c.is_approved AS category_approved
     FROM popolive.store_items i
     JOIN popolive.store_categories c ON c.category_id = i.category_id
     WHERE i.item_id = $1
     LIMIT 1`,
    [cleanId]
  );

  if (rows.length === 0) {
    throw new StoreValidationError(404, 'STORE_ITEM_NOT_FOUND', 'Store item not found.');
  }

  const row = rows[0];
  if (!options.includeInactive && (!row.is_active || !row.is_approved || !row.category_active || !row.category_approved)) {
    throw new StoreValidationError(404, 'STORE_ITEM_UNAVAILABLE', 'This store item is currently unavailable.');
  }

  const item = mapItemRow(row);
  if (!options.userId) return item;

  const canonicalUserId = await resolveStoreCanonicalUserId(options.userId);
  const [evaluated] = await evaluateUserEligibilityForItems([item], canonicalUserId);
  return evaluated;
}

// =============================================================================
// 3. Atomic Server-Validated Purchase System
// =============================================================================

function computeServerExpiryDate(
  item: StoreItemRecord,
  vipExpiryIso: string | null
): Date | null {
  if (item.durationType === 'permanent' || item.durationUnit === 'permanent') {
    return null;
  }
  const nowMs = Date.now();
  if (item.durationType === 'event_based') {
    if (item.eventEndAt) return new Date(item.eventEndAt);
    const days = item.durationValue || 30;
    return new Date(nowMs + days * 86400 * 1000);
  }
  if (item.durationType === 'membership_based') {
    if (vipExpiryIso) return new Date(vipExpiryIso);
    const days = item.durationValue || 30;
    return new Date(nowMs + days * 86400 * 1000);
  }
  const value = Math.max(1, item.durationValue || 30);
  if (item.durationUnit === 'seconds') return new Date(nowMs + value * 1000);
  if (item.durationUnit === 'hours') return new Date(nowMs + value * 3600 * 1000);
  return new Date(nowMs + value * 86400 * 1000);
}

export async function purchaseStoreItem(params: {
  userId: string;
  itemId: string;
  quantity?: number;
  idempotencyKey?: string | null;
  actorId?: string;
  autoEquip?: boolean;
}): Promise<{
  success: boolean;
  statusCode: number;
  deduplicated?: boolean;
  code?: string;
  error?: string;
  purchase: StorePurchaseRecord | null;
  inventory: UserStoreInventoryRecord | null;
  wallet: any;
}> {
  const cleanItemId = String(params.itemId || '').trim();
  if (!cleanItemId) {
    throw new StoreValidationError(400, 'STORE_ITEM_ID_REQUIRED', 'itemId is required.');
  }

  const quantity = params.quantity === undefined ? 1 : Number(params.quantity);
  if (!Number.isInteger(quantity) || quantity !== 1) {
    throw new StoreValidationError(
      400,
      'INVALID_STORE_QUANTITY',
      'Store item purchases currently require an integer quantity of 1 per transaction.'
    );
  }

  const canonicalUserId = await resolveStoreCanonicalUserId(params.userId);
  const idempKey = (params.idempotencyKey || '').trim() || null;

  return withTransaction(async (client) => {
    const rules = await getFinanceRules(client);

    // 1. Idempotency check BEFORE modifying wallet or inventory
    if (idempKey) {
      const existingRows = await runSql(
        client,
        `SELECT * FROM popolive.store_purchases WHERE idempotency_key = $1 LIMIT 1`,
        [idempKey]
      );
      if (existingRows.length > 0) {
        const existingPurchase = mapPurchaseRow(existingRows[0]);
        if (existingPurchase.userId !== canonicalUserId) {
          throw new StoreValidationError(
            403,
            'IDEMPOTENCY_KEY_CONFLICT',
            'Idempotency key belongs to another account.'
          );
        }
        const walletRow = await ensureWalletLocked(client, canonicalUserId, rules);
        let existingInventory: UserStoreInventoryRecord | null = null;
        if (existingPurchase.inventoryId) {
          const invRows = await runSql(
            client,
            `SELECT inv.*,
                    si.name AS item_name, si.name_ur AS item_name_ur,
                    si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
                    si.visual_style, si.is_equippable, si.duration_type,
                    si.duration_label, si.duration_label_ur,
                    c.name AS category_name, c.name_ur AS category_name_ur
             FROM popolive.user_store_inventory inv
             JOIN popolive.store_items si ON si.item_id = inv.item_id
             JOIN popolive.store_categories c ON c.category_id = inv.category_id
             WHERE inv.inventory_id = $1`,
            [existingPurchase.inventoryId]
          );
          if (invRows[0]) existingInventory = mapInventoryRow(invRows[0]);
        }
        return {
          success: existingPurchase.status === 'completed',
          statusCode: existingPurchase.status === 'completed' ? 200 : 402,
          deduplicated: true,
          code: existingPurchase.status === 'completed' ? undefined : existingPurchase.failureCode || 'INSUFFICIENT_COINS',
          error: existingPurchase.status === 'completed' ? undefined : existingPurchase.failureReason || undefined,
          purchase: existingPurchase,
          inventory: existingInventory,
          wallet: {
            walletId: walletRow.wallet_id,
            userId: canonicalUserId,
            coins: parseInt(String(walletRow.coins), 10),
            points: parseInt(String(walletRow.diamond_points), 10),
          },
        };
      }
    }

    // 2. Sync any expired items first
    await syncExpiredStoreItems(client, canonicalUserId);

    // 3. Lock store item & check availability + approved category
    const itemRows = await runSql(
      client,
      `SELECT i.*,
              c.name AS category_name,
              c.name_ur AS category_name_ur,
              c.short_label AS category_short_label,
              c.short_label_ur AS category_short_label_ur,
              c.is_active AS category_active,
              c.is_approved AS category_approved
       FROM popolive.store_items i
       JOIN popolive.store_categories c ON c.category_id = i.category_id
       WHERE i.item_id = $1
       FOR UPDATE OF i`,
      [cleanItemId]
    );

    if (itemRows.length === 0) {
      throw new StoreValidationError(404, 'STORE_ITEM_NOT_FOUND', 'Selected store item does not exist.');
    }

    const rawItem = itemRows[0];
    const item = mapItemRow(rawItem);
    if (!item.isActive || !item.isApproved || !rawItem.category_active || !rawItem.category_approved) {
      throw new StoreValidationError(
        400,
        'STORE_ITEM_UNAVAILABLE',
        'This item is disabled or pending approval and cannot be purchased.'
      );
    }

    if (item.durationType === 'event_based' && item.eventEndAt && new Date(item.eventEndAt).getTime() <= Date.now()) {
      throw new StoreValidationError(400, 'STORE_EVENT_ENDED', 'This limited-time event item has already ended.');
    }

    // 4. Stock & per-user usage limit validation
    if (item.maxTotalStock !== null && item.soldCount + quantity > item.maxTotalStock) {
      throw new StoreValidationError(409, 'STORE_OUT_OF_STOCK', 'This item is currently out of stock.');
    }

    if (item.usageLimitPerUser !== null) {
      const countRows = await runSql(
        client,
        `SELECT COALESCE(SUM(quantity), 0)::int AS cnt
         FROM popolive.store_purchases
         WHERE user_id = $1 AND item_id = $2 AND status = 'completed'`,
        [canonicalUserId, item.itemId]
      );
      const alreadyBought = parseInt(String(countRows[0]?.cnt ?? 0), 10);
      if (alreadyBought + quantity > item.usageLimitPerUser) {
        throw new StoreValidationError(
          409,
          'STORE_USAGE_LIMIT_REACHED',
          `Purchase limit reached: you can only purchase up to ${item.usageLimitPerUser} of this item.`
        );
      }
    }

    // 5. VIP Eligibility check (live DB state)
    const vipProfile = await resolveActiveUserVipProfile(canonicalUserId);
    if (item.vipOnly || item.requiredVipLevel > 0) {
      const reqVip = Math.max(1, item.requiredVipLevel);
      if (!vipProfile.hasActiveVip || vipProfile.vipLevel < reqVip) {
        throw new StoreValidationError(
          403,
          'STORE_VIP_REQUIRED',
          `Active VIP Level ${reqVip}+ membership is required to purchase "${item.name}".`
        );
      }
    }

    // 6. Wealth, Shining & Honor independent eligibility check
    if (item.minWealthLevel > 1 || item.minShiningLevel > 1 || item.minHonorLevel > 1) {
      const recognition = await getUserRecognitionSummary(canonicalUserId, {
        includePrivate: false,
        skipCache: true,
      });
      if (recognition.wealth.currentLevelNumber < item.minWealthLevel) {
        throw new StoreValidationError(
          403,
          'STORE_WEALTH_LEVEL_REQUIRED',
          `Wealth Level ${item.minWealthLevel}+ is required (current: Lv.${recognition.wealth.currentLevelNumber}).`
        );
      }
      if (recognition.shining.currentLevelNumber < item.minShiningLevel) {
        throw new StoreValidationError(
          403,
          'STORE_SHINING_LEVEL_REQUIRED',
          `Shining Level ${item.minShiningLevel}+ is required (current: Lv.${recognition.shining.currentLevelNumber}).`
        );
      }
      if (recognition.honor.currentLevelNumber < item.minHonorLevel) {
        throw new StoreValidationError(
          403,
          'STORE_HONOR_LEVEL_REQUIRED',
          `Honor Level ${item.minHonorLevel}+ is required (current: Lv.${recognition.honor.currentLevelNumber}).`
        );
      }
    }

    // 7. Server-side authoritative coin pricing & atomic deduction
    const serverTotalCoins = item.coinPrice * quantity;
    const purchaseId = generateStoreId('STR_PUR');
    const actorId = params.actorId || canonicalUserId;

    let coinTxId: string | null = null;
    let updatedWallet: any = null;

    if (serverTotalCoins > 0) {
      const deductRes = await deductCoinsInTx(client, {
        userId: canonicalUserId,
        amount: serverTotalCoins,
        transactionType: 'feature_spend',
        referenceId: purchaseId,
        idempotencyKey: idempKey ? `store_coin:${idempKey}` : undefined,
        description: `Virtual Store Purchase: ${item.name}`,
        createdBy: actorId,
        metadata: {
          storePurchase: true,
          storePurchaseId: purchaseId,
          itemId: item.itemId,
          itemName: item.name,
          categoryId: item.categoryId,
          equipSlot: item.equipSlot,
        },
      });

      if (!deductRes.success) {
        // Record failed purchase attempt WITHOUT creating inventory or deducting coins
        const failPurRows = await runSql(
          client,
          `INSERT INTO popolive.store_purchases (
             purchase_id, idempotency_key, user_id, item_id, category_id, item_name_snapshot,
             quantity, unit_coin_price, total_coins, coin_tx_id, inventory_id, status,
             failure_code, failure_reason, metadata
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, 'failed', $11, $12, $13::jsonb)
           RETURNING *`,
          [
            purchaseId,
            idempKey,
            canonicalUserId,
            item.itemId,
            item.categoryId,
            item.name,
            quantity,
            item.coinPrice,
            serverTotalCoins,
            deductRes.transaction?.transactionId || null,
            deductRes.code || 'INSUFFICIENT_COINS',
            deductRes.error || 'Insufficient coins.',
            JSON.stringify({ slot: item.equipSlot }),
          ]
        );
        const failedPurchase = mapPurchaseRow(failPurRows[0]);
        await emitStoreRealtimeEvent(client, canonicalUserId, 'store:purchase_failed', {
          userId: canonicalUserId,
          purchase: failedPurchase,
          reason: failedPurchase.failureReason,
        });

        return {
          success: false,
          statusCode: 402,
          code: deductRes.code || 'INSUFFICIENT_COINS',
          error: deductRes.error || 'Insufficient coin balance.',
          purchase: failedPurchase,
          inventory: null,
          wallet: deductRes.wallet,
        };
      }

      coinTxId = deductRes.transaction.transactionId;
      updatedWallet = deductRes.wallet;
    } else {
      const walletRow = await ensureWalletLocked(client, canonicalUserId, rules);
      updatedWallet = {
        walletId: walletRow.wallet_id,
        userId: canonicalUserId,
        coins: parseInt(String(walletRow.coins), 10),
        points: parseInt(String(walletRow.diamond_points), 10),
      };
    }

    // 8. Increment item sold_count & create immutable purchase + active inventory
    await runSql(
      client,
      `UPDATE popolive.store_items
       SET sold_count = sold_count + $1, updated_at = NOW()
       WHERE item_id = $2`,
      [quantity, item.itemId]
    );

    const inventoryId = generateStoreId('STR_INV');
    const expiresAtDate = computeServerExpiryDate(item, vipProfile.expiryDate);

    await runSql(
      client,
      `INSERT INTO popolive.store_purchases (
         purchase_id, idempotency_key, user_id, item_id, category_id, item_name_snapshot,
         quantity, unit_coin_price, total_coins, coin_tx_id, inventory_id, status, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed', $12::jsonb)`,
      [
        purchaseId,
        idempKey,
        canonicalUserId,
        item.itemId,
        item.categoryId,
        item.name,
        quantity,
        item.coinPrice,
        serverTotalCoins,
        coinTxId,
        inventoryId,
        JSON.stringify({ equipSlot: item.equipSlot, durationType: item.durationType }),
      ]
    );

    await runSql(
      client,
      `INSERT INTO popolive.user_store_inventory (
         inventory_id, user_id, item_id, category_id, equip_slot, purchase_id,
         quantity, status, is_equipped, granted_by, purchased_at, activated_at, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', FALSE, 'purchase', NOW(), NOW(), $8)`,
      [
        inventoryId,
        canonicalUserId,
        item.itemId,
        item.categoryId,
        item.equipSlot,
        purchaseId,
        quantity,
        expiresAtDate ? expiresAtDate.toISOString() : null,
      ]
    );

    // Optional instant equip if caller asked and slot is valid
    if (params.autoEquip && item.isEquippable && item.equipSlot !== 'none') {
      await equipSlotInTx(client, {
        userId: canonicalUserId,
        inventoryId,
        equipSlot: item.equipSlot,
        itemId: item.itemId,
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
      });
    }

    const [finalPurRows, finalInvRows] = await Promise.all([
      runSql(client, `SELECT * FROM popolive.store_purchases WHERE purchase_id = $1`, [purchaseId]),
      runSql(
        client,
        `SELECT inv.*,
                si.name AS item_name, si.name_ur AS item_name_ur,
                si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
                si.visual_style, si.is_equippable, si.duration_type,
                si.duration_label, si.duration_label_ur,
                c.name AS category_name, c.name_ur AS category_name_ur
         FROM popolive.user_store_inventory inv
         JOIN popolive.store_items si ON si.item_id = inv.item_id
         JOIN popolive.store_categories c ON c.category_id = inv.category_id
         WHERE inv.inventory_id = $1`,
        [inventoryId]
      ),
    ]);

    const purchase = mapPurchaseRow(finalPurRows[0]);
    const inventory = mapInventoryRow(finalInvRows[0]);

    await emitStoreRealtimeEvent(client, canonicalUserId, 'store:purchase_completed', {
      userId: canonicalUserId,
      purchase,
      inventory,
      coinsBalance: updatedWallet.coins,
    });
    await emitStoreRealtimeEvent(client, canonicalUserId, 'store:inventory_updated', {
      userId: canonicalUserId,
      reason: 'purchase_completed',
      inventoryId,
    });

    return {
      success: true,
      statusCode: 201,
      purchase,
      inventory,
      wallet: updatedWallet,
    };
  });
}

// =============================================================================
// 4. Inventory, Slot-Exclusive Equipment & Profile Loadout
// =============================================================================

async function equipSlotInTx(
  client: any,
  params: {
    userId: string;
    inventoryId: string;
    equipSlot: Exclude<StoreEquipSlot, 'none'>;
    itemId: string;
    expiresAt: string | null;
  }
) {
  const { userId, inventoryId, equipSlot, itemId, expiresAt } = params;

  // Unequip previously equipped item in the exact same slot
  const prevRows = await runSql(
    client,
    `UPDATE popolive.user_store_inventory
     SET is_equipped = FALSE, updated_at = NOW()
     WHERE user_id = $1 AND equip_slot = $2 AND is_equipped = TRUE AND inventory_id != $3
     RETURNING inventory_id, item_id`,
    [userId, equipSlot, inventoryId]
  );

  for (const prev of prevRows) {
    await emitStoreRealtimeEvent(client, userId, 'store:item_unequipped', {
      userId,
      inventoryId: prev.inventory_id,
      itemId: prev.item_id,
      equipSlot,
      replacedBy: inventoryId,
    });
  }

  await runSql(
    client,
    `UPDATE popolive.user_store_inventory
     SET is_equipped = TRUE, updated_at = NOW()
     WHERE inventory_id = $1`,
    [inventoryId]
  );

  await runSql(
    client,
    `INSERT INTO popolive.user_store_equipment (user_id, equip_slot, inventory_id, item_id, equipped_at, expires_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
     ON CONFLICT (user_id, equip_slot) DO UPDATE SET
       inventory_id = EXCLUDED.inventory_id,
       item_id = EXCLUDED.item_id,
       equipped_at = NOW(),
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()`,
    [userId, equipSlot, inventoryId, itemId, expiresAt]
  );
}

export async function getUserEquippedStoreLoadout(
  rawUserId: string
): Promise<UserEquippedStoreLoadout> {
  const userId = await resolveStoreCanonicalUserId(rawUserId);
  await syncExpiredStoreItems(undefined, userId);

  const rows = await query<any>(
    `SELECT eq.user_id, eq.equip_slot, eq.inventory_id, eq.item_id, eq.equipped_at, eq.expires_at,
            si.name, si.name_ur, si.thumbnail_url, si.preview_image_url, si.animation_asset_url, si.visual_style
     FROM popolive.user_store_equipment eq
     JOIN popolive.user_store_inventory inv ON inv.inventory_id = eq.inventory_id
     JOIN popolive.store_items si ON si.item_id = eq.item_id
     WHERE eq.user_id = $1
       AND inv.status = 'active'
       AND inv.is_equipped = TRUE
       AND (inv.expires_at IS NULL OR inv.expires_at > NOW())`,
    [userId]
  );

  const loadout = emptyEquippedLoadout();
  for (const r of rows) {
    const slot = String(r.equip_slot) as Exclude<StoreEquipSlot, 'none'>;
    const item: EquippedStoreSlotItem = {
      inventoryId: String(r.inventory_id),
      itemId: String(r.item_id),
      equipSlot: slot,
      name: String(r.name),
      nameUr: String(r.name_ur || r.name),
      thumbnailUrl: String(r.thumbnail_url),
      previewImageUrl: String(r.preview_image_url || r.thumbnail_url),
      animationAssetUrl: r.animation_asset_url ? String(r.animation_asset_url) : null,
      visualStyle: parseJsonField(r.visual_style, {}),
      equippedAt: r.equipped_at ? new Date(r.equipped_at).toISOString() : new Date().toISOString(),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    };
    loadout.itemsBySlot[slot] = item;
    if (slot === 'profile_frame') loadout.profileFrame = item;
    else if (slot === 'name_decoration') loadout.nameDecoration = item;
    else if (slot === 'chat_decoration') loadout.chatDecoration = item;
    else if (slot === 'entrance_effect') loadout.entranceEffect = item;
    else if (slot === 'theme') loadout.theme = item;
    else if (slot === 'special_badge') loadout.specialBadge = item;
    else if (slot === 'accessory') loadout.accessory = item;
  }
  return loadout;
}

export async function getBatchEquippedStoreLoadouts(
  userIds: string[]
): Promise<Map<string, UserEquippedStoreLoadout>> {
  const uniqueIds = Array.from(new Set(userIds.map((u) => String(u || '').trim()).filter(Boolean)));
  const result = new Map<string, UserEquippedStoreLoadout>();
  if (uniqueIds.length === 0) return result;

  // Bulk expire any due items for these users before returning equipped styles
  await query(
    `UPDATE popolive.user_store_inventory inv
     SET status = 'expired', is_equipped = FALSE, updated_at = NOW()
     WHERE inv.user_id = ANY($1)
       AND inv.status = 'active'
       AND inv.expires_at IS NOT NULL
       AND inv.expires_at <= NOW()`,
    [uniqueIds]
  );

  const rows = await query<any>(
    `SELECT eq.user_id, eq.equip_slot, eq.inventory_id, eq.item_id, eq.equipped_at, eq.expires_at,
            si.name, si.name_ur, si.thumbnail_url, si.preview_image_url, si.animation_asset_url, si.visual_style
     FROM popolive.user_store_equipment eq
     JOIN popolive.user_store_inventory inv ON inv.inventory_id = eq.inventory_id
     JOIN popolive.store_items si ON si.item_id = eq.item_id
     WHERE eq.user_id = ANY($1)
       AND inv.status = 'active'
       AND inv.is_equipped = TRUE
       AND (inv.expires_at IS NULL OR inv.expires_at > NOW())`,
    [uniqueIds]
  );

  for (const r of rows) {
    const uid = String(r.user_id);
    const loadout = result.get(uid) || emptyEquippedLoadout();
    const slot = String(r.equip_slot) as Exclude<StoreEquipSlot, 'none'>;
    const item: EquippedStoreSlotItem = {
      inventoryId: String(r.inventory_id),
      itemId: String(r.item_id),
      equipSlot: slot,
      name: String(r.name),
      nameUr: String(r.name_ur || r.name),
      thumbnailUrl: String(r.thumbnail_url),
      previewImageUrl: String(r.preview_image_url || r.thumbnail_url),
      animationAssetUrl: r.animation_asset_url ? String(r.animation_asset_url) : null,
      visualStyle: parseJsonField(r.visual_style, {}),
      equippedAt: r.equipped_at ? new Date(r.equipped_at).toISOString() : new Date().toISOString(),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    };
    loadout.itemsBySlot[slot] = item;
    if (slot === 'profile_frame') loadout.profileFrame = item;
    else if (slot === 'name_decoration') loadout.nameDecoration = item;
    else if (slot === 'chat_decoration') loadout.chatDecoration = item;
    else if (slot === 'entrance_effect') loadout.entranceEffect = item;
    else if (slot === 'theme') loadout.theme = item;
    else if (slot === 'special_badge') loadout.specialBadge = item;
    else if (slot === 'accessory') loadout.accessory = item;
    result.set(uid, loadout);
  }
  return result;
}

export async function getUserStoreInventory(
  rawUserId: string,
  options: { status?: 'all' | 'active' | 'expired' | 'revoked'; slot?: string } = {}
): Promise<{
  userId: string;
  items: UserStoreInventoryRecord[];
  activeItems: UserStoreInventoryRecord[];
  expiredItems: UserStoreInventoryRecord[];
  equipped: UserEquippedStoreLoadout;
  purchaseHistory: StorePurchaseRecord[];
}> {
  const userId = await resolveStoreCanonicalUserId(rawUserId);
  await syncExpiredStoreItems(undefined, userId);

  const [invRows, purRows, equipped] = await Promise.all([
    query<any>(
      `SELECT inv.*,
              si.name AS item_name, si.name_ur AS item_name_ur,
              si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
              si.visual_style, si.is_equippable, si.duration_type,
              si.duration_label, si.duration_label_ur,
              c.name AS category_name, c.name_ur AS category_name_ur
       FROM popolive.user_store_inventory inv
       JOIN popolive.store_items si ON si.item_id = inv.item_id
       JOIN popolive.store_categories c ON c.category_id = inv.category_id
       WHERE inv.user_id = $1
       ORDER BY inv.is_equipped DESC, (inv.status = 'active') DESC, inv.purchased_at DESC`,
      [userId]
    ),
    query<any>(
      `SELECT * FROM popolive.store_purchases
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    ),
    getUserEquippedStoreLoadout(userId),
  ]);

  const allMapped = invRows.map(mapInventoryRow);
  const slotFilter = (options.slot || '').trim();
  const filteredBySlot = slotFilter && slotFilter !== 'all' ? allMapped.filter((i) => i.equipSlot === slotFilter) : allMapped;
  const statusFilter = options.status || 'all';
  const items =
    statusFilter === 'all' ? filteredBySlot : filteredBySlot.filter((i) => i.status === statusFilter);

  return {
    userId,
    items,
    activeItems: allMapped.filter((i) => i.status === 'active'),
    expiredItems: allMapped.filter((i) => i.status === 'expired'),
    equipped,
    purchaseHistory: purRows.map(mapPurchaseRow),
  };
}

export async function equipStoreInventoryItem(params: {
  userId: string;
  inventoryId: string;
  expectedSlot?: string | null;
}): Promise<{
  inventory: UserStoreInventoryRecord;
  equipped: UserEquippedStoreLoadout;
}> {
  const canonicalUserId = await resolveStoreCanonicalUserId(params.userId);
  const cleanInvId = String(params.inventoryId || '').trim();
  if (!cleanInvId) {
    throw new StoreValidationError(400, 'INVENTORY_ID_REQUIRED', 'inventoryId is required.');
  }

  return withTransaction(async (client) => {
    await syncExpiredStoreItems(client, canonicalUserId);

    const rows = await runSql(
      client,
      `SELECT inv.*,
              si.name AS item_name, si.name_ur AS item_name_ur,
              si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
              si.visual_style, si.is_equippable, si.duration_type,
              si.duration_label, si.duration_label_ur,
              si.vip_only, si.required_vip_level,
              c.name AS category_name, c.name_ur AS category_name_ur
       FROM popolive.user_store_inventory inv
       JOIN popolive.store_items si ON si.item_id = inv.item_id
       JOIN popolive.store_categories c ON c.category_id = inv.category_id
       WHERE inv.inventory_id = $1
       FOR UPDATE OF inv`,
      [cleanInvId]
    );

    if (rows.length === 0) {
      throw new StoreValidationError(404, 'INVENTORY_ITEM_NOT_FOUND', 'Inventory item not found.');
    }

    const row = rows[0];
    if (String(row.user_id) !== canonicalUserId) {
      throw new StoreValidationError(
        403,
        'STORE_OWNERSHIP_FORBIDDEN',
        'Forbidden: You do not own this inventory item.'
      );
    }

    if (row.status === 'expired' || (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())) {
      await runSql(
        client,
        `UPDATE popolive.user_store_inventory SET status = 'expired', is_equipped = FALSE, updated_at = NOW() WHERE inventory_id = $1`,
        [cleanInvId]
      );
      throw new StoreValidationError(400, 'STORE_ITEM_EXPIRED', 'Expired store items cannot be equipped.');
    }

    if (row.status !== 'active') {
      throw new StoreValidationError(
        400,
        'STORE_ITEM_NOT_ACTIVE',
        `Cannot equip item with status "${row.status}".`
      );
    }

    if (!row.is_equippable || row.equip_slot === 'none') {
      throw new StoreValidationError(
        400,
        'STORE_ITEM_NOT_EQUIPPABLE',
        'This item does not belong to an equippable slot.'
      );
    }

    const slot = String(row.equip_slot) as Exclude<StoreEquipSlot, 'none'>;
    if (params.expectedSlot && params.expectedSlot !== slot) {
      throw new StoreValidationError(
        400,
        'STORE_INCOMPATIBLE_SLOT',
        `Incompatible equipment slot: "${row.item_name}" belongs to "${slot}", cannot equip in "${params.expectedSlot}".`
      );
    }

    if (row.duration_type === 'membership_based') {
      const vip = await resolveActiveUserVipProfile(canonicalUserId);
      if (!vip.hasActiveVip) {
        throw new StoreValidationError(
          403,
          'STORE_VIP_EXPIRED',
          'Your VIP membership expired, so this VIP-bound item can no longer remain equipped.'
        );
      }
    }

    await equipSlotInTx(client, {
      userId: canonicalUserId,
      inventoryId: cleanInvId,
      equipSlot: slot,
      itemId: String(row.item_id),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    });

    await emitStoreRealtimeEvent(client, canonicalUserId, 'store:item_equipped', {
      userId: canonicalUserId,
      inventoryId: cleanInvId,
      itemId: row.item_id,
      itemName: row.item_name,
      equipSlot: slot,
    });
    await emitStoreRealtimeEvent(client, canonicalUserId, 'store:inventory_updated', {
      userId: canonicalUserId,
      reason: 'item_equipped',
      inventoryId: cleanInvId,
    });

    const refreshed = await runSql(
      client,
      `SELECT inv.*,
              si.name AS item_name, si.name_ur AS item_name_ur,
              si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
              si.visual_style, si.is_equippable, si.duration_type,
              si.duration_label, si.duration_label_ur,
              c.name AS category_name, c.name_ur AS category_name_ur
       FROM popolive.user_store_inventory inv
       JOIN popolive.store_items si ON si.item_id = inv.item_id
       JOIN popolive.store_categories c ON c.category_id = inv.category_id
       WHERE inv.inventory_id = $1`,
      [cleanInvId]
    );

    const inventory = mapInventoryRow(refreshed[0]);
    // Read loadout inside or outside tx
    return {
      inventory,
      equipped: await (async () => {
        const eqRows = await runSql(
          client,
          `SELECT eq.user_id, eq.equip_slot, eq.inventory_id, eq.item_id, eq.equipped_at, eq.expires_at,
                  si.name, si.name_ur, si.thumbnail_url, si.preview_image_url, si.animation_asset_url, si.visual_style
           FROM popolive.user_store_equipment eq
           JOIN popolive.user_store_inventory inv ON inv.inventory_id = eq.inventory_id
           JOIN popolive.store_items si ON si.item_id = eq.item_id
           WHERE eq.user_id = $1 AND inv.status = 'active' AND inv.is_equipped = TRUE`,
          [canonicalUserId]
        );
        const loadout = emptyEquippedLoadout();
        for (const r of eqRows) {
          const s = String(r.equip_slot) as Exclude<StoreEquipSlot, 'none'>;
          const it: EquippedStoreSlotItem = {
            inventoryId: String(r.inventory_id),
            itemId: String(r.item_id),
            equipSlot: s,
            name: String(r.name),
            nameUr: String(r.name_ur || r.name),
            thumbnailUrl: String(r.thumbnail_url),
            previewImageUrl: String(r.preview_image_url || r.thumbnail_url),
            animationAssetUrl: r.animation_asset_url ? String(r.animation_asset_url) : null,
            visualStyle: parseJsonField(r.visual_style, {}),
            equippedAt: r.equipped_at ? new Date(r.equipped_at).toISOString() : new Date().toISOString(),
            expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
          };
          loadout.itemsBySlot[s] = it;
          if (s === 'profile_frame') loadout.profileFrame = it;
          else if (s === 'name_decoration') loadout.nameDecoration = it;
          else if (s === 'chat_decoration') loadout.chatDecoration = it;
          else if (s === 'entrance_effect') loadout.entranceEffect = it;
          else if (s === 'theme') loadout.theme = it;
          else if (s === 'special_badge') loadout.specialBadge = it;
          else if (s === 'accessory') loadout.accessory = it;
        }
        return loadout;
      })(),
    };
  });
}

export async function unequipStoreItem(params: {
  userId: string;
  inventoryId?: string | null;
  slot?: string | null;
}): Promise<{
  unequippedInventoryIds: string[];
  equipped: UserEquippedStoreLoadout;
}> {
  const canonicalUserId = await resolveStoreCanonicalUserId(params.userId);
  const cleanInvId = (params.inventoryId || '').trim();
  const cleanSlot = (params.slot || '').trim();

  if (!cleanInvId && !cleanSlot) {
    throw new StoreValidationError(400, 'UNEQUIP_TARGET_REQUIRED', 'Either inventoryId or slot is required.');
  }

  return withTransaction(async (client) => {
    let targets: any[] = [];
    if (cleanInvId) {
      const checkRows = await runSql(
        client,
        `SELECT inventory_id, user_id, item_id, equip_slot
         FROM popolive.user_store_inventory WHERE inventory_id = $1 FOR UPDATE`,
        [cleanInvId]
      );
      if (checkRows.length === 0) {
        throw new StoreValidationError(404, 'INVENTORY_ITEM_NOT_FOUND', 'Inventory item not found.');
      }
      if (String(checkRows[0].user_id) !== canonicalUserId) {
        throw new StoreValidationError(403, 'STORE_OWNERSHIP_FORBIDDEN', 'Forbidden: Not your inventory item.');
      }
      targets = checkRows;
    } else {
      targets = await runSql(
        client,
        `SELECT inventory_id, user_id, item_id, equip_slot
         FROM popolive.user_store_inventory
         WHERE user_id = $1 AND equip_slot = $2 AND is_equipped = TRUE FOR UPDATE`,
        [canonicalUserId, cleanSlot]
      );
    }

    const ids = targets.map((t) => String(t.inventory_id));
    if (ids.length > 0) {
      await runSql(
        client,
        `UPDATE popolive.user_store_inventory SET is_equipped = FALSE, updated_at = NOW() WHERE inventory_id = ANY($1)`,
        [ids]
      );
      await runSql(
        client,
        `DELETE FROM popolive.user_store_equipment WHERE user_id = $1 AND inventory_id = ANY($2)`,
        [canonicalUserId, ids]
      );
      for (const t of targets) {
        await emitStoreRealtimeEvent(client, canonicalUserId, 'store:item_unequipped', {
          userId: canonicalUserId,
          inventoryId: t.inventory_id,
          itemId: t.item_id,
          equipSlot: t.equip_slot,
        });
      }
      await emitStoreRealtimeEvent(client, canonicalUserId, 'store:inventory_updated', {
        userId: canonicalUserId,
        reason: 'item_unequipped',
      });
    }

    return {
      unequippedInventoryIds: ids,
      equipped: emptyEquippedLoadout(), // populated via getUserEquippedStoreLoadout right after tx or rebuilt cleanly
    };
  }).then(async (res) => ({
    unequippedInventoryIds: res.unequippedInventoryIds,
    equipped: await getUserEquippedStoreLoadout(canonicalUserId),
  }));
}

// =============================================================================
// 5. Admin Store Management & Audited Controls
// =============================================================================

function assertAdminRole(actorRole: string) {
  if (!isAuthorizedFinanceAdmin(actorRole)) {
    throw new StoreValidationError(
      403,
      'STORE_ADMIN_REQUIRED',
      'Forbidden: Only authorized finance_admin or super_admin roles may manage the Store.'
    );
  }
}

export async function adminGetStoreOverview(search: string = '') {
  const cleanSearch = search.trim();
  const searchLike = cleanSearch ? `%${cleanSearch}%` : null;

  const [categories, itemRows, purchaseRows, inventoryRows, auditRows, statsRows] = await Promise.all([
    getStoreCategories({ includeInactive: true }),
    query<any>(
      `SELECT i.*,
              c.name AS category_name,
              c.name_ur AS category_name_ur,
              c.short_label AS category_short_label,
              c.short_label_ur AS category_short_label_ur
       FROM popolive.store_items i
       JOIN popolive.store_categories c ON c.category_id = i.category_id
       ${searchLike ? 'WHERE i.item_id ILIKE $1 OR i.name ILIKE $1 OR c.name ILIKE $1' : ''}
       ORDER BY i.display_order ASC, i.created_at DESC`,
      searchLike ? [searchLike] : []
    ),
    query<any>(
      `SELECT * FROM popolive.store_purchases
       ${searchLike ? 'WHERE purchase_id ILIKE $1 OR user_id ILIKE $1 OR item_id ILIKE $1 OR item_name_snapshot ILIKE $1' : ''}
       ORDER BY created_at DESC LIMIT 50`,
      searchLike ? [searchLike] : []
    ),
    query<any>(
      `SELECT inv.*,
              si.name AS item_name, si.name_ur AS item_name_ur,
              si.thumbnail_url, si.preview_image_url, si.animation_asset_url,
              si.visual_style, si.is_equippable, si.duration_type,
              si.duration_label, si.duration_label_ur,
              c.name AS category_name, c.name_ur AS category_name_ur
       FROM popolive.user_store_inventory inv
       JOIN popolive.store_items si ON si.item_id = inv.item_id
       JOIN popolive.store_categories c ON c.category_id = inv.category_id
       ${searchLike ? 'WHERE inv.inventory_id ILIKE $1 OR inv.user_id ILIKE $1 OR inv.item_id ILIKE $1' : ''}
       ORDER BY inv.purchased_at DESC LIMIT 50`,
      searchLike ? [searchLike] : []
    ),
    query<any>(
      `SELECT * FROM popolive.store_admin_audit_logs ORDER BY created_at DESC LIMIT 40`
    ),
    query<any>(
      `SELECT
         (SELECT COUNT(*)::int FROM popolive.store_categories WHERE is_active = TRUE AND is_approved = TRUE) AS active_categories,
         (SELECT COUNT(*)::int FROM popolive.store_items WHERE is_active = TRUE AND is_approved = TRUE) AS active_items,
         (SELECT COUNT(*)::int FROM popolive.store_purchases WHERE status = 'completed') AS completed_purchases,
         (SELECT COALESCE(SUM(total_coins), 0)::bigint FROM popolive.store_purchases WHERE status = 'completed') AS total_coins_spent,
         (SELECT COUNT(*)::int FROM popolive.user_store_inventory WHERE status = 'active') AS active_inventory_items`
    ),
  ]);

  const s = statsRows[0] || {};
  return {
    summary: {
      activeCategories: parseInt(String(s.active_categories ?? 0), 10),
      activeItems: parseInt(String(s.active_items ?? 0), 10),
      completedPurchases: parseInt(String(s.completed_purchases ?? 0), 10),
      totalCoinsSpent: parseInt(String(s.total_coins_spent ?? 0), 10),
      activeInventoryItems: parseInt(String(s.active_inventory_items ?? 0), 10),
    },
    categories,
    items: itemRows.map(mapItemRow),
    purchases: purchaseRows.map(mapPurchaseRow),
    inventory: inventoryRows.map(mapInventoryRow),
    auditLogs: auditRows,
  };
}

export async function adminUpsertStoreCategory(params: {
  adminId: string;
  actorRole: string;
  categoryId: string;
  slug?: string;
  name: string;
  nameUr?: string;
  shortLabel?: string;
  shortLabelUr?: string;
  description?: string;
  descriptionUr?: string;
  iconKey?: string;
  defaultEquipSlot?: StoreEquipSlot;
  displayOrder?: number;
  isApproved?: boolean;
  isActive?: boolean;
}): Promise<StoreCategoryRecord> {
  assertAdminRole(params.actorRole);
  const categoryId = String(params.categoryId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (!categoryId || !params.name?.trim()) {
    throw new StoreValidationError(400, 'INVALID_CATEGORY', 'categoryId and name are required.');
  }

  const slug = (params.slug || categoryId).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const slot = params.defaultEquipSlot || 'none';

  const rows = await withTransaction(async (client) => {
    const res = await runSql(
      client,
      `INSERT INTO popolive.store_categories (
         category_id, slug, name, name_ur, short_label, short_label_ur,
         description, description_ur, icon_key, default_equip_slot, display_order, is_approved, is_active, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (category_id) DO UPDATE SET
         slug = EXCLUDED.slug,
         name = EXCLUDED.name,
         name_ur = EXCLUDED.name_ur,
         short_label = EXCLUDED.short_label,
         short_label_ur = EXCLUDED.short_label_ur,
         description = EXCLUDED.description,
         description_ur = EXCLUDED.description_ur,
         icon_key = EXCLUDED.icon_key,
         default_equip_slot = EXCLUDED.default_equip_slot,
         display_order = EXCLUDED.display_order,
         is_approved = EXCLUDED.is_approved,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [
        categoryId,
        slug,
        params.name.trim(),
        (params.nameUr || params.name).trim(),
        (params.shortLabel || params.name).trim().slice(0, 48),
        (params.shortLabelUr || params.nameUr || params.shortLabel || params.name).trim().slice(0, 64),
        (params.description || '').trim(),
        (params.descriptionUr || '').trim(),
        (params.iconKey || 'sparkles').trim(),
        slot,
        Number.isFinite(params.displayOrder) ? Number(params.displayOrder) : 50,
        params.isApproved !== false,
        params.isActive !== false,
      ]
    );

    await runSql(
      client,
      `INSERT INTO popolive.store_admin_audit_logs (audit_id, admin_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, $3, 'upsert_category', $4, 'Store category saved', $5::jsonb)`,
      [generateStoreId('STR_AUD'), params.adminId, params.actorRole, categoryId, JSON.stringify({ name: params.name })]
    );

    return res;
  });

  await invalidateStoreCaches();
  return mapCategoryRow(rows[0]);
}

export async function adminUpsertStoreItem(params: {
  adminId: string;
  actorRole: string;
  itemId?: string;
  categoryId: string;
  name: string;
  nameUr?: string;
  description?: string;
  descriptionUr?: string;
  thumbnailUrl: string;
  previewImageUrl?: string;
  animationAssetUrl?: string | null;
  visualStyle?: Record<string, any>;
  coinPrice: number;
  durationType: StoreDurationType;
  durationValue?: number | null;
  durationUnit?: StoreItemRecord['durationUnit'];
  durationLabel?: string;
  durationLabelUr?: string;
  eventEndAt?: string | null;
  equipSlot?: StoreEquipSlot;
  isEquippable?: boolean;
  usageLimitPerUser?: number | null;
  maxTotalStock?: number | null;
  vipOnly?: boolean;
  requiredVipLevel?: number;
  minWealthLevel?: number;
  minShiningLevel?: number;
  minHonorLevel?: number;
  eligibilityRules?: Record<string, any>;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNewArrival?: boolean;
  isApproved?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<StoreItemRecord> {
  assertAdminRole(params.actorRole);

  if (!params.name?.trim() || !params.categoryId?.trim() || !params.thumbnailUrl?.trim()) {
    throw new StoreValidationError(400, 'INVALID_STORE_ITEM', 'categoryId, name, and thumbnailUrl are required.');
  }

  const price = Math.round(Number(params.coinPrice));
  if (!Number.isFinite(price) || price < 0) {
    throw new StoreValidationError(400, 'INVALID_COIN_PRICE', 'coinPrice must be a non-negative integer.');
  }

  const itemId =
    (params.itemId || '').trim() ||
    `item_${params.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${crypto.randomBytes(2).toString('hex')}`;

  const durationType = STORE_DURATION_TYPES.includes(params.durationType) ? params.durationType : 'limited_duration';
  const durationUnit = params.durationUnit || (durationType === 'permanent' ? 'permanent' : durationType === 'membership_based' ? 'vip' : 'days');
  const durationValue =
    durationType === 'permanent' ? null : params.durationValue !== undefined ? params.durationValue : 30;
  const equipSlot: StoreEquipSlot = params.equipSlot || 'none';
  const isEquippable = params.isEquippable !== undefined ? Boolean(params.isEquippable) : equipSlot !== 'none';

  const result = await withTransaction(async (client) => {
    const existingRows = await runSql(
      client,
      `SELECT item_id FROM popolive.store_items WHERE item_id = $1`,
      [itemId]
    );
    const isCreate = existingRows.length === 0;

    const upserted = await runSql(
      client,
      `INSERT INTO popolive.store_items (
         item_id, category_id, name, name_ur, description, description_ur,
         thumbnail_url, preview_image_url, animation_asset_url, visual_style,
         coin_price, duration_type, duration_value, duration_unit, duration_label, duration_label_ur,
         event_end_at, equip_slot, is_equippable, usage_limit_per_user, max_total_stock,
         vip_only, required_vip_level, min_wealth_level, min_shining_level, min_honor_level,
         eligibility_rules, is_featured, is_popular, is_new_arrival, is_approved, is_active,
         display_order, created_by, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,
         $11,$12,$13,$14,$15,$16,
         $17,$18,$19,$20,$21,
         $22,$23,$24,$25,$26,
         $27::jsonb,$28,$29,$30,$31,$32,
         $33,$34,NOW()
       )
       ON CONFLICT (item_id) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         name = EXCLUDED.name,
         name_ur = EXCLUDED.name_ur,
         description = EXCLUDED.description,
         description_ur = EXCLUDED.description_ur,
         thumbnail_url = EXCLUDED.thumbnail_url,
         preview_image_url = EXCLUDED.preview_image_url,
         animation_asset_url = EXCLUDED.animation_asset_url,
         visual_style = EXCLUDED.visual_style,
         coin_price = EXCLUDED.coin_price,
         duration_type = EXCLUDED.duration_type,
         duration_value = EXCLUDED.duration_value,
         duration_unit = EXCLUDED.duration_unit,
         duration_label = EXCLUDED.duration_label,
         duration_label_ur = EXCLUDED.duration_label_ur,
         event_end_at = EXCLUDED.event_end_at,
         equip_slot = EXCLUDED.equip_slot,
         is_equippable = EXCLUDED.is_equippable,
         usage_limit_per_user = EXCLUDED.usage_limit_per_user,
         max_total_stock = EXCLUDED.max_total_stock,
         vip_only = EXCLUDED.vip_only,
         required_vip_level = EXCLUDED.required_vip_level,
         min_wealth_level = EXCLUDED.min_wealth_level,
         min_shining_level = EXCLUDED.min_shining_level,
         min_honor_level = EXCLUDED.min_honor_level,
         eligibility_rules = EXCLUDED.eligibility_rules,
         is_featured = EXCLUDED.is_featured,
         is_popular = EXCLUDED.is_popular,
         is_new_arrival = EXCLUDED.is_new_arrival,
         is_approved = EXCLUDED.is_approved,
         is_active = EXCLUDED.is_active,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()
       RETURNING *`,
      [
        itemId,
        params.categoryId.trim(),
        params.name.trim(),
        (params.nameUr || params.name).trim(),
        (params.description || '').trim(),
        (params.descriptionUr || '').trim(),
        params.thumbnailUrl.trim(),
        (params.previewImageUrl || params.thumbnailUrl).trim(),
        params.animationAssetUrl || null,
        JSON.stringify(params.visualStyle || {}),
        price,
        durationType,
        durationValue,
        durationUnit,
        (params.durationLabel || (durationType === 'permanent' ? 'Permanent' : `${durationValue ?? 30} ${durationUnit}`)).trim(),
        (params.durationLabelUr || (durationType === 'permanent' ? 'مستقل' : `${durationValue ?? 30} دن`)).trim(),
        params.eventEndAt || null,
        equipSlot,
        isEquippable,
        params.usageLimitPerUser ?? null,
        params.maxTotalStock ?? null,
        Boolean(params.vipOnly),
        Math.max(0, Number(params.requiredVipLevel || 0)),
        Math.max(1, Number(params.minWealthLevel || 1)),
        Math.max(1, Number(params.minShiningLevel || 1)),
        Math.max(1, Number(params.minHonorLevel || 1)),
        JSON.stringify(params.eligibilityRules || {}),
        Boolean(params.isFeatured),
        Boolean(params.isPopular),
        Boolean(params.isNewArrival),
        params.isApproved !== false,
        params.isActive !== false,
        Number.isFinite(params.displayOrder) ? Number(params.displayOrder) : 50,
        params.adminId,
      ]
    );

    const mapped = mapItemRow(upserted[0]);
    const eventName = isCreate
      ? 'store:item_created'
      : mapped.isActive && mapped.isApproved
      ? 'store:item_updated'
      : 'store:item_disabled';

    await emitStoreRealtimeEvent(client, '*', eventName, { item: mapped });

    await runSql(
      client,
      `INSERT INTO popolive.store_admin_audit_logs (audit_id, admin_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        generateStoreId('STR_AUD'),
        params.adminId,
        params.actorRole,
        isCreate ? 'create_item' : 'update_item',
        itemId,
        `${isCreate ? 'Created' : 'Updated'} store item ${mapped.name}`,
        JSON.stringify({ coinPrice: price, isActive: mapped.isActive, vipOnly: mapped.vipOnly }),
      ]
    );

    return mapped;
  });

  await invalidateStoreCaches();
  return result;
}

export async function adminToggleStoreItem(params: {
  adminId: string;
  actorRole: string;
  itemId: string;
  isActive: boolean;
  reason?: string;
}): Promise<StoreItemRecord> {
  assertAdminRole(params.actorRole);
  const res = await withTransaction(async (client) => {
    const rows = await runSql(
      client,
      `UPDATE popolive.store_items
       SET is_active = $1, updated_at = NOW()
       WHERE item_id = $2
       RETURNING *`,
      [Boolean(params.isActive), params.itemId]
    );
    if (rows.length === 0) {
      throw new StoreValidationError(404, 'STORE_ITEM_NOT_FOUND', 'Store item not found.');
    }
    const item = mapItemRow(rows[0]);
    await emitStoreRealtimeEvent(
      client,
      '*',
      item.isActive ? 'store:item_updated' : 'store:item_disabled',
      { item }
    );
    await runSql(
      client,
      `INSERT INTO popolive.store_admin_audit_logs (audit_id, admin_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        generateStoreId('STR_AUD'),
        params.adminId,
        params.actorRole,
        item.isActive ? 'enable_item' : 'disable_item',
        params.itemId,
        params.reason || `Toggled item active=${item.isActive}`,
        JSON.stringify({ isActive: item.isActive }),
      ]
    );
    return item;
  });
  await invalidateStoreCaches();
  return res;
}

export async function adminRefundStorePurchase(params: {
  adminId: string;
  actorRole: string;
  purchaseId: string;
  reason: string;
}): Promise<{
  purchase: StorePurchaseRecord;
  refundedCoins: number;
  wallet: any;
}> {
  assertAdminRole(params.actorRole);
  if (!params.reason || params.reason.trim().length < 5) {
    throw new StoreValidationError(400, 'REASON_REQUIRED', 'Audit reason (min 5 chars) is mandatory.');
  }

  return withTransaction(async (client) => {
    const purRows = await runSql(
      client,
      `SELECT * FROM popolive.store_purchases WHERE purchase_id = $1 FOR UPDATE`,
      [params.purchaseId]
    );
    if (purRows.length === 0) {
      throw new StoreValidationError(404, 'PURCHASE_NOT_FOUND', 'Store purchase record not found.');
    }
    const pur = purRows[0];
    if (pur.status === 'refunded' || pur.status === 'reversed') {
      throw new StoreValidationError(400, 'ALREADY_REFUNDED', 'Store purchase has already been refunded.');
    }
    if (pur.status !== 'completed') {
      throw new StoreValidationError(400, 'PURCHASE_NOT_COMPLETED', 'Only completed purchases can be refunded.');
    }

    const refundAmount = parseInt(String(pur.total_coins), 10);
    let walletRes: any = null;

    if (refundAmount > 0) {
      const creditRes = await creditCoinsInTx(client, {
        userId: String(pur.user_id),
        amount: refundAmount,
        transactionType: 'reversal',
        referenceId: `STORE_REFUND:${pur.purchase_id}`,
        relatedTxId: pur.coin_tx_id || undefined,
        description: `Store refund (${pur.item_name_snapshot}): ${params.reason.trim()}`,
        createdBy: params.adminId,
        metadata: {
          storeRefund: true,
          purchaseId: pur.purchase_id,
          itemId: pur.item_id,
          excludeFromWealth: true,
        },
      });
      walletRes = creditRes.wallet;

      if (pur.coin_tx_id) {
        await reverseRecognitionForSourceInTx(client, {
          sourceTxId: String(pur.coin_tx_id),
          reversalReason: params.reason.trim(),
          actorId: params.adminId,
        }).catch(() => undefined);
      }
    }

    if (pur.inventory_id) {
      await runSql(
        client,
        `UPDATE popolive.user_store_inventory
         SET status = 'revoked', is_equipped = FALSE, updated_at = NOW()
         WHERE inventory_id = $1`,
        [pur.inventory_id]
      );
      await runSql(
        client,
        `DELETE FROM popolive.user_store_equipment WHERE inventory_id = $1`,
        [pur.inventory_id]
      );
    }

    const updatedPur = await runSql(
      client,
      `UPDATE popolive.store_purchases
       SET status = 'refunded', updated_at = NOW()
       WHERE purchase_id = $1 RETURNING *`,
      [pur.purchase_id]
    );

    await emitStoreRealtimeEvent(client, String(pur.user_id), 'store:inventory_updated', {
      userId: pur.user_id,
      reason: 'purchase_refunded',
      purchaseId: pur.purchase_id,
      inventoryId: pur.inventory_id,
    });

    await runSql(
      client,
      `INSERT INTO popolive.store_admin_audit_logs (audit_id, admin_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, $3, 'refund_purchase', $4, $5, $6::jsonb)`,
      [
        generateStoreId('STR_AUD'),
        params.adminId,
        params.actorRole,
        pur.purchase_id,
        params.reason.trim(),
        JSON.stringify({ refundedCoins: refundAmount, inventoryId: pur.inventory_id }),
      ]
    );

    return {
      purchase: mapPurchaseRow(updatedPur[0]),
      refundedCoins: refundAmount,
      wallet: walletRes,
    };
  });
}
