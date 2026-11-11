import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisGet, redisSetWithTtl } from '@/lib/redis';
import type { SupportedGiftAssetType } from '@/lib/giftAssets';
import { FALLBACK_GIFT_IMAGE_URL, FALLBACK_GIFT_THUMBNAIL_URL } from '@/lib/giftAssets';

// =============================================================================
// Popo Live Phase 7 Module 7.2 — Central Virtual Gift Catalog Engine
// PostgreSQL + Redis versioned cache + Admin Audit Logs + SSE Realtime Events
// =============================================================================

const CACHE_TTL_SECONDS = 300;
const CATALOG_VERSION_KEY = 'gift_catalog:cache_version';

export interface GiftCategoryRecord {
  categoryId: string;
  name: string;
  nameUr: string;
  shortName: string;
  shortNameUr: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  isVirtualFilter: boolean;
  giftCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCatalogItem {
  id: string;
  giftId: string;
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  coinPrice: number;
  categoryId: string;
  categoryName?: string;
  categoryNameUr?: string;
  thumbnailUrl: string;
  imageUrl: string;
  animationUrl: string | null;
  assetType: SupportedGiftAssetType;
  giftType: string;
  usageCount: number;
  isPopular: boolean;
  isNew: boolean;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  maxQuantity: number;
  allowedQuantities: number[];
  fallbackImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftAuditLogRecord {
  auditId: string;
  targetType: 'gift' | 'category' | 'asset' | 'catalog';
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

export function isAuthorizedGiftAdmin(role?: string | null): boolean {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'super_admin' || normalized === 'finance_admin';
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function slugifyGiftId(name: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return `gift_${clean || 'item'}_${crypto.randomBytes(2).toString('hex')}`;
}

async function getCacheVersion(): Promise<string> {
  const v = await redisGet(CATALOG_VERSION_KEY);
  return v || '1';
}

export async function bumpCacheVersion(): Promise<void> {
  await redisSetWithTtl(CATALOG_VERSION_KEY, String(Date.now()), 86400);
}

function mapCategoryRow(row: any): GiftCategoryRecord {
  return {
    categoryId: row.category_id,
    name: row.name,
    nameUr: row.name_ur,
    shortName: row.short_name,
    shortNameUr: row.short_name_ur,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    displayOrder: parseInt(String(row.display_order ?? '1'), 10),
    isActive: Boolean(row.is_active),
    isVirtualFilter: Boolean(row.is_virtual_filter),
    giftCount: row.gift_count !== undefined ? parseInt(String(row.gift_count), 10) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };
}

function mapGiftRow(row: any): GiftCatalogItem {
  return {
    id: row.id,
    giftId: row.gift_id,
    name: row.name,
    nameUr: row.name_ur,
    description: row.description,
    descriptionUr: row.description_ur,
    coinPrice: parseInt(String(row.coin_price ?? '0'), 10),
    categoryId: row.category_id,
    categoryName: row.category_name || undefined,
    categoryNameUr: row.category_name_ur || undefined,
    thumbnailUrl: row.thumbnail_url || FALLBACK_GIFT_THUMBNAIL_URL,
    imageUrl: row.image_url || FALLBACK_GIFT_IMAGE_URL,
    animationUrl: row.animation_url || null,
    assetType: (row.asset_type || 'png') as SupportedGiftAssetType,
    giftType: row.gift_type || 'standard',
    usageCount: parseInt(String(row.usage_count ?? '0'), 10),
    isPopular: Boolean(row.is_popular),
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
    displayOrder: parseInt(String(row.display_order ?? '100'), 10),
    isActive: Boolean(row.is_active),
    maxQuantity: parseInt(String(row.max_quantity ?? '99'), 10),
    allowedQuantities:
      Array.isArray(row.allowed_quantities) && row.allowed_quantities.length > 0
        ? row.allowed_quantities
            .map((v: any) => parseInt(String(v), 10))
            .filter((n: number) => Number.isFinite(n) && n > 0)
        : [1, 5, 10, 66, 99],
    fallbackImageUrl: FALLBACK_GIFT_IMAGE_URL,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };
}

export async function emitGiftCatalogRealtimeEvent(
  client: any,
  eventType: string,
  payload: Record<string, any>
): Promise<void> {
  const runner = client
    ? (sql: string, params: any[]) => client.query(sql, params)
    : (sql: string, params: any[]) => query(sql, params).then((rows) => ({ rows }));

  await runner(
    `INSERT INTO popolive.gift_catalog_realtime_events (event_type, payload)
     VALUES ($1, $2::jsonb)`,
    [eventType, JSON.stringify({ ...payload, emittedAt: new Date().toISOString() })]
  );
}

/**
 * Retrieves backend-managed gift categories with live active gift counts.
 */
export async function getGiftCategories(options?: {
  includeInactive?: boolean;
}): Promise<GiftCategoryRecord[]> {
  const includeInactive = Boolean(options?.includeInactive);
  const ver = await getCacheVersion();
  const cacheKey = `gift_catalog:v${ver}:categories:${includeInactive ? 'all' : 'active'}`;

  if (!includeInactive) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
  }

  const whereClause = includeInactive ? '1=1' : 'c.is_active = true';
  const rows = await query<any>(
    `SELECT c.*,
            CASE
              WHEN c.category_id = 'all' THEN (
                SELECT COUNT(*)::int FROM popolive.gift_catalog g
                JOIN popolive.gift_categories gc ON gc.category_id = g.category_id
                WHERE g.is_active = true AND gc.is_active = true
              )
              WHEN c.category_id = 'popular' THEN (
                SELECT COUNT(*)::int FROM popolive.gift_catalog g
                JOIN popolive.gift_categories gc ON gc.category_id = g.category_id
                WHERE g.is_active = true AND gc.is_active = true AND (g.is_popular = true OR g.usage_count >= 5000)
              )
              ELSE (
                SELECT COUNT(*)::int FROM popolive.gift_catalog g
                WHERE g.category_id = c.category_id AND g.is_active = true
              )
            END AS gift_count
     FROM popolive.gift_categories c
     WHERE ${whereClause}
     ORDER BY c.display_order ASC, c.created_at ASC`
  );

  const mapped = rows.map(mapCategoryRow);
  if (!includeInactive) {
    await redisSetWithTtl(cacheKey, JSON.stringify(mapped), CACHE_TTL_SECONDS);
  }
  return mapped;
}

/**
 * Fetches paginated, searchable, category-filtered virtual gifts.
 * Public views automatically hide disabled gifts and disabled categories.
 */
export async function getGiftCatalog(params?: {
  categoryId?: string;
  search?: string;
  giftType?: string;
  popularOnly?: boolean;
  newOnly?: boolean;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}): Promise<{
  gifts: GiftCatalogItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const {
    categoryId = 'all',
    search = '',
    giftType = '',
    popularOnly = false,
    newOnly = false,
    featuredOnly = false,
    page = 1,
    limit = 24,
    includeInactive = false,
  } = params || {};

  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? limit : 24));
  const offset = (safePage - 1) * safeLimit;

  const ver = await getCacheVersion();
  const cacheKey = `gift_catalog:v${ver}:q:${JSON.stringify({
    categoryId,
    search: search.trim().toLowerCase(),
    giftType,
    popularOnly,
    newOnly,
    featuredOnly,
    safePage,
    safeLimit,
    includeInactive,
  })}`;

  if (!includeInactive) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
  }

  const conditions: string[] = ['1=1'];
  const values: any[] = [];

  if (!includeInactive) {
    conditions.push('g.is_active = true');
    conditions.push('c.is_active = true');
  }

  const cat = (categoryId || 'all').trim();
  if (cat && cat !== 'all') {
    if (cat === 'popular') {
      conditions.push('(g.is_popular = true OR g.usage_count >= 5000)');
    } else {
      values.push(cat);
      conditions.push(`(g.category_id = $${values.length} OR LOWER(c.slug) = LOWER($${values.length}))`);
    }
  }

  if (popularOnly) {
    conditions.push('(g.is_popular = true OR g.usage_count >= 5000)');
  }
  if (newOnly) {
    conditions.push('g.is_new = true');
  }
  if (featuredOnly) {
    conditions.push('g.is_featured = true');
  }

  if (giftType && giftType.trim()) {
    values.push(giftType.trim().toLowerCase());
    conditions.push(`LOWER(g.gift_type) = $${values.length}`);
  }

  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    const pIdx = values.length;
    conditions.push(
      `(g.name ILIKE $${pIdx} OR g.name_ur ILIKE $${pIdx} OR g.description ILIKE $${pIdx} OR g.gift_type ILIKE $${pIdx} OR c.name ILIKE $${pIdx} OR c.short_name ILIKE $${pIdx})`
    );
  }

  const whereClause = conditions.join(' AND ');
  const orderClause =
    cat === 'popular' || popularOnly
      ? 'g.usage_count DESC, g.display_order ASC'
      : newOnly
      ? 'g.created_at DESC, g.display_order ASC'
      : 'g.display_order ASC, g.created_at DESC';

  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM popolive.gift_catalog g
     JOIN popolive.gift_categories c ON c.category_id = g.category_id
     WHERE ${whereClause}`,
    values
  );
  const total = countRows[0]?.total ?? 0;

  const rows = await query<any>(
    `SELECT g.*, c.name AS category_name, c.name_ur AS category_name_ur
     FROM popolive.gift_catalog g
     JOIN popolive.gift_categories c ON c.category_id = g.category_id
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, safeLimit, offset]
  );

  // Deduplicate defensively by gift_id
  const seen = new Map<string, GiftCatalogItem>();
  for (const row of rows) {
    const mapped = mapGiftRow(row);
    if (!seen.has(mapped.giftId)) {
      seen.set(mapped.giftId, mapped);
    }
  }

  const result = {
    gifts: Array.from(seen.values()),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };

  if (!includeInactive) {
    await redisSetWithTtl(cacheKey, JSON.stringify(result), CACHE_TTL_SECONDS);
  }

  return result;
}

export async function getGiftDetails(
  giftId: string,
  options?: { includeInactive?: boolean }
): Promise<GiftCatalogItem | null> {
  const rows = await query<any>(
    `SELECT g.*, c.name AS category_name, c.name_ur AS category_name_ur, c.is_active AS category_is_active
     FROM popolive.gift_catalog g
     JOIN popolive.gift_categories c ON c.category_id = g.category_id
     WHERE g.gift_id = $1 OR g.id::text = $1
     LIMIT 1`,
    [giftId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  const isAvailable = Boolean(row.is_active) && Boolean(row.category_is_active);
  if (!options?.includeInactive && !isAvailable) {
    // Still return mapped with isActive=false so caller can clearly distinguish disabled from 404 if requested,
    // or caller endpoint can reject disabled gifts
    return {
      ...mapGiftRow(row),
      isActive: false,
    };
  }

  return mapGiftRow(row);
}

export async function getPopularGifts(limit: number = 12): Promise<GiftCatalogItem[]> {
  const res = await getGiftCatalog({ popularOnly: true, page: 1, limit });
  return res.gifts;
}

export async function getNewGifts(limit: number = 12): Promise<GiftCatalogItem[]> {
  const res = await getGiftCatalog({ newOnly: true, page: 1, limit });
  return res.gifts;
}

export async function getFeaturedGifts(limit: number = 12): Promise<GiftCatalogItem[]> {
  const res = await getGiftCatalog({ featuredOnly: true, page: 1, limit });
  return res.gifts;
}

function validateCoinPrice(coinPrice: unknown): number {
  const parsed = Number(coinPrice);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 100000000) {
    throw Object.assign(
      new Error('Approved coinPrice must be a positive integer between 1 and 100,000,000.'),
      { code: 'INVALID_COIN_PRICE', status: 400 }
    );
  }
  return parsed;
}

export async function createGiftItem(params: {
  giftId?: string;
  name: string;
  nameUr?: string;
  description: string;
  descriptionUr?: string;
  coinPrice: number;
  categoryId: string;
  thumbnailUrl?: string;
  imageUrl: string;
  animationUrl?: string | null;
  assetType?: SupportedGiftAssetType;
  giftType?: string;
  isPopular?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  actorId: string;
  actorRole: string;
  ipAddress?: string;
}): Promise<GiftCatalogItem> {
  if (!isAuthorizedGiftAdmin(params.actorRole)) {
    throw Object.assign(
      new Error('Forbidden: Only authorized administrators can create catalog gifts.'),
      { code: 'ADMIN_ACCESS_REQUIRED', status: 403 }
    );
  }

  const name = (params.name || '').trim();
  const description = (params.description || '').trim();
  if (name.length < 2 || description.length < 4) {
    throw Object.assign(
      new Error('Gift name (min 2 chars) and description (min 4 chars) are required.'),
      { code: 'INVALID_GIFT_INPUT', status: 400 }
    );
  }

  const coinPrice = validateCoinPrice(params.coinPrice);
  const categoryId = (params.categoryId || '').trim();
  if (!categoryId || categoryId === 'all' || categoryId === 'popular') {
    throw Object.assign(
      new Error('Please assign a concrete gift category (e.g. basic, love, luxury, special_event).'),
      { code: 'INVALID_CATEGORY', status: 400 }
    );
  }

  const allowedAssets: SupportedGiftAssetType[] = ['png', 'webp', 'gif', 'lottie', 'video'];
  const assetType: SupportedGiftAssetType = allowedAssets.includes(params.assetType || 'png')
    ? (params.assetType || 'png')
    : 'png';

  const finalGiftId = (params.giftId || '').trim() || slugifyGiftId(name);
  const imageUrl = (params.imageUrl || '').trim() || FALLBACK_GIFT_IMAGE_URL;
  const thumbnailUrl = (params.thumbnailUrl || '').trim() || imageUrl || FALLBACK_GIFT_THUMBNAIL_URL;

  const created = await withTransaction(async (client) => {
    const catCheck = await client.query(
      `SELECT category_id FROM popolive.gift_categories WHERE category_id = $1`,
      [categoryId]
    );
    if (catCheck.rows.length === 0) {
      throw Object.assign(new Error(`Category "${categoryId}" does not exist.`), {
        code: 'CATEGORY_NOT_FOUND',
        status: 404,
      });
    }

    const dupCheck = await client.query(
      `SELECT gift_id FROM popolive.gift_catalog
       WHERE gift_id = $1 OR (LOWER(name) = LOWER($2) AND category_id = $3)`,
      [finalGiftId, name, categoryId]
    );
    if (dupCheck.rows.length > 0) {
      throw Object.assign(
        new Error(`A gift named "${name}" or ID "${finalGiftId}" already exists in this category.`),
        { code: 'DUPLICATE_GIFT', status: 409 }
      );
    }

    const rows = (
      await client.query(
        `INSERT INTO popolive.gift_catalog (
           gift_id, name, name_ur, description, description_ur, coin_price, category_id,
           thumbnail_url, image_url, animation_url, asset_type, gift_type,
           is_popular, is_new, is_featured, display_order, is_active
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          finalGiftId,
          name,
          (params.nameUr || name).trim(),
          description,
          (params.descriptionUr || description).trim(),
          coinPrice,
          categoryId,
          thumbnailUrl,
          imageUrl,
          params.animationUrl || null,
          assetType,
          (params.giftType || 'standard').trim(),
          Boolean(params.isPopular),
          params.isNew !== undefined ? Boolean(params.isNew) : true,
          Boolean(params.isFeatured),
          Number.isInteger(params.displayOrder) ? params.displayOrder : 50,
          params.isActive !== undefined ? Boolean(params.isActive) : true,
        ]
      )
    ).rows;

    const mapped = mapGiftRow(rows[0]);

    await client.query(
      `INSERT INTO popolive.gift_catalog_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data, ip_address
       ) VALUES ($1, 'gift', $2, 'create_gift', $3, $4, $5, $6::jsonb, $7)`,
      [
        generateId('GAUDIT'),
        mapped.giftId,
        params.actorId,
        params.actorRole,
        `Created virtual gift ${mapped.name} (${mapped.coinPrice} coins)`,
        JSON.stringify(mapped),
        params.ipAddress || null,
      ]
    );

    await emitGiftCatalogRealtimeEvent(client, 'gift_catalog:gift_published', {
      gift: mapped,
    });

    return mapped;
  });

  await bumpCacheVersion();
  return created;
}

export async function updateGiftItem(params: {
  giftId: string;
  updates: Partial<{
    name: string;
    nameUr: string;
    description: string;
    descriptionUr: string;
    coinPrice: number;
    categoryId: string;
    thumbnailUrl: string;
    imageUrl: string;
    animationUrl: string | null;
    assetType: SupportedGiftAssetType;
    giftType: string;
    isPopular: boolean;
    isNew: boolean;
    isFeatured: boolean;
    displayOrder: number;
    isActive: boolean;
  }>;
  reason?: string;
  actorId: string;
  actorRole: string;
  ipAddress?: string;
}): Promise<GiftCatalogItem> {
  if (!isAuthorizedGiftAdmin(params.actorRole)) {
    throw Object.assign(
      new Error('Forbidden: Only authorized administrators can update catalog gifts.'),
      { code: 'ADMIN_ACCESS_REQUIRED', status: 403 }
    );
  }

  const updated = await withTransaction(async (client) => {
    const existingRows = (
      await client.query(`SELECT * FROM popolive.gift_catalog WHERE gift_id = $1 FOR UPDATE`, [
        params.giftId,
      ])
    ).rows;
    if (existingRows.length === 0) {
      throw Object.assign(new Error(`Gift "${params.giftId}" not found.`), {
        code: 'GIFT_NOT_FOUND',
        status: 404,
      });
    }

    const before = mapGiftRow(existingRows[0]);
    const u = params.updates;

    const nextName = u.name !== undefined ? u.name.trim() : before.name;
    const nextPrice = u.coinPrice !== undefined ? validateCoinPrice(u.coinPrice) : before.coinPrice;
    const nextCategory = u.categoryId !== undefined ? u.categoryId.trim() : before.categoryId;

    if (nextCategory === 'all' || nextCategory === 'popular') {
      throw Object.assign(new Error('Gifts cannot be placed directly in virtual filter categories.'), {
        code: 'INVALID_CATEGORY',
        status: 400,
      });
    }

    if (nextCategory !== before.categoryId) {
      const catCheck = await client.query(
        `SELECT category_id FROM popolive.gift_categories WHERE category_id = $1`,
        [nextCategory]
      );
      if (catCheck.rows.length === 0) {
        throw Object.assign(new Error(`Category "${nextCategory}" not found.`), {
          code: 'CATEGORY_NOT_FOUND',
          status: 404,
        });
      }
    }

    const rows = (
      await client.query(
        `UPDATE popolive.gift_catalog
         SET name = $1,
             name_ur = $2,
             description = $3,
             description_ur = $4,
             coin_price = $5,
             category_id = $6,
             thumbnail_url = $7,
             image_url = $8,
             animation_url = $9,
             asset_type = $10,
             gift_type = $11,
             is_popular = $12,
             is_new = $13,
             is_featured = $14,
             display_order = $15,
             is_active = $16,
             updated_at = NOW()
         WHERE gift_id = $17
         RETURNING *`,
        [
          nextName,
          u.nameUr !== undefined ? u.nameUr.trim() : before.nameUr,
          u.description !== undefined ? u.description.trim() : before.description,
          u.descriptionUr !== undefined ? u.descriptionUr.trim() : before.descriptionUr,
          nextPrice,
          nextCategory,
          u.thumbnailUrl !== undefined ? u.thumbnailUrl : before.thumbnailUrl,
          u.imageUrl !== undefined ? u.imageUrl : before.imageUrl,
          u.animationUrl !== undefined ? u.animationUrl : before.animationUrl,
          u.assetType !== undefined ? u.assetType : before.assetType,
          u.giftType !== undefined ? u.giftType : before.giftType,
          u.isPopular !== undefined ? Boolean(u.isPopular) : before.isPopular,
          u.isNew !== undefined ? Boolean(u.isNew) : before.isNew,
          u.isFeatured !== undefined ? Boolean(u.isFeatured) : before.isFeatured,
          u.displayOrder !== undefined ? Number(u.displayOrder) : before.displayOrder,
          u.isActive !== undefined ? Boolean(u.isActive) : before.isActive,
          params.giftId,
        ]
      )
    ).rows;

    const after = mapGiftRow(rows[0]);

    await client.query(
      `INSERT INTO popolive.gift_catalog_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1, 'gift', $2, 'update_gift', $3, $4, $5, $6::jsonb, $7::jsonb, $8)`,
      [
        generateId('GAUDIT'),
        after.giftId,
        params.actorId,
        params.actorRole,
        params.reason || `Updated gift ${after.name}`,
        JSON.stringify(before),
        JSON.stringify(after),
        params.ipAddress || null,
      ]
    );

    if (before.isActive !== after.isActive) {
      await emitGiftCatalogRealtimeEvent(client, 'gift_catalog:gift_status_changed', {
        giftId: after.giftId,
        isActive: after.isActive,
        gift: after,
      });
    } else if (before.isFeatured !== after.isFeatured) {
      await emitGiftCatalogRealtimeEvent(client, 'gift_catalog:featured_changed', {
        giftId: after.giftId,
        isFeatured: after.isFeatured,
        gift: after,
      });
    } else {
      await emitGiftCatalogRealtimeEvent(client, 'gift_catalog:gift_updated', {
        gift: after,
      });
    }

    return after;
  });

  await bumpCacheVersion();
  return updated;
}

export async function createOrUpdateCategory(params: {
  mode: 'create' | 'update';
  categoryId: string;
  name?: string;
  nameUr?: string;
  shortName?: string;
  shortNameUr?: string;
  slug?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  actorId: string;
  actorRole: string;
  ipAddress?: string;
}): Promise<GiftCategoryRecord> {
  if (!isAuthorizedGiftAdmin(params.actorRole)) {
    throw Object.assign(
      new Error('Forbidden: Only authorized administrators can manage gift categories.'),
      { code: 'ADMIN_ACCESS_REQUIRED', status: 403 }
    );
  }

  const saved = await withTransaction(async (client) => {
    const existingRows = (
      await client.query(`SELECT * FROM popolive.gift_categories WHERE category_id = $1 FOR UPDATE`, [
        params.categoryId,
      ])
    ).rows;

    if (params.mode === 'create' && existingRows.length > 0) {
      throw Object.assign(new Error(`Category "${params.categoryId}" already exists.`), {
        code: 'DUPLICATE_CATEGORY',
        status: 409,
      });
    }
    if (params.mode === 'update' && existingRows.length === 0) {
      throw Object.assign(new Error(`Category "${params.categoryId}" not found.`), {
        code: 'CATEGORY_NOT_FOUND',
        status: 404,
      });
    }

    let resultRow: any;
    if (params.mode === 'create') {
      const name = (params.name || params.categoryId).trim();
      const slug = (params.slug || params.categoryId)
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
      resultRow = (
        await client.query(
          `INSERT INTO popolive.gift_categories (
             category_id, name, name_ur, short_name, short_name_ur, slug, description, icon, display_order, is_active
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [
            params.categoryId.trim(),
            name,
            (params.nameUr || name).trim(),
            (params.shortName || name).trim(),
            (params.shortNameUr || name).trim(),
            slug,
            (params.description || `${name} virtual gifts`).trim(),
            params.icon || 'gift',
            params.displayOrder ?? 20,
            params.isActive !== undefined ? Boolean(params.isActive) : true,
          ]
        )
      ).rows[0];
    } else {
      const before = existingRows[0];
      resultRow = (
        await client.query(
          `UPDATE popolive.gift_categories
           SET name = $1,
               name_ur = $2,
               short_name = $3,
               short_name_ur = $4,
               description = $5,
               icon = $6,
               display_order = $7,
               is_active = $8,
               updated_at = NOW()
           WHERE category_id = $9
           RETURNING *`,
          [
            params.name !== undefined ? params.name.trim() : before.name,
            params.nameUr !== undefined ? params.nameUr.trim() : before.name_ur,
            params.shortName !== undefined ? params.shortName.trim() : before.short_name,
            params.shortNameUr !== undefined ? params.shortNameUr.trim() : before.short_name_ur,
            params.description !== undefined ? params.description.trim() : before.description,
            params.icon !== undefined ? params.icon : before.icon,
            params.displayOrder !== undefined ? params.displayOrder : before.display_order,
            params.isActive !== undefined ? Boolean(params.isActive) : before.is_active,
            params.categoryId,
          ]
        )
      ).rows[0];
    }

    const mapped = mapCategoryRow(resultRow);

    await client.query(
      `INSERT INTO popolive.gift_catalog_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1, 'category', $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        generateId('GAUDIT'),
        mapped.categoryId,
        params.mode === 'create' ? 'create_category' : 'update_category',
        params.actorId,
        params.actorRole,
        `${params.mode} category ${mapped.name}`,
        existingRows[0] ? JSON.stringify(mapCategoryRow(existingRows[0])) : null,
        JSON.stringify(mapped),
        params.ipAddress || null,
      ]
    );

    await emitGiftCatalogRealtimeEvent(client, 'gift_catalog:category_updated', {
      category: mapped,
    });

    return mapped;
  });

  await bumpCacheVersion();
  return saved;
}

export async function queryGiftAuditLogs(limit: number = 50): Promise<GiftAuditLogRecord[]> {
  const safeLimit = Math.min(200, Math.max(1, limit));
  const rows = await query<any>(
    `SELECT * FROM popolive.gift_catalog_audit_logs ORDER BY created_at DESC LIMIT $1`,
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
