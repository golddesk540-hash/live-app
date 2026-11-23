import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge, checkRateLimit, isStaffMember } from '@/lib/auth';
import { getOrCreateUserWallet } from '@/lib/economyApiService';

/**
 * POPO LIVE — PHASE 7 (P7-P9)
 * STORE, BAG & REDEEM MODULE CENTRAL SERVICE & LOCKED RULES ENGINE
 * 
 * Authoritative single service enforcing:
 * - Locked Rule 1: Age 18+ to purchase from store or redeem codes.
 * - Locked Rule 2: Atomic coin debit via P7-P7 ledger (non-negative, coin_transactions row).
 * - Locked Rule 3: Idempotent purchases and redemptions.
 * - Locked Rule 4: user_inventory row inserted with unique active ownership.
 * - Locked Rule 5: One-slot-per-category equip enforcement.
 * - Locked Rule 6: Redeem code is one-time per user (uq_redeem_user_code).
 * - Locked Rule 7: Reject expired or inactive redeem codes.
 * - Locked Rule 8: Redeem success credits coins via P7-P7 ledger atomically.
 * - Locked Rule 9: Invalid code shows invalid sheet — zero DB mutations.
 * - Locked Rule 10: No lucky gifts, paid video calls, direct APK, or real payments.
 */

export const USE_STORE_API: boolean = process.env.NEXT_PUBLIC_USE_STORE_API === 'true';

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
 * Reject access to store purchases and voucher code redemptions for users under 18.
 */
export function assertAdultStore(user: AuthUser, actionName: string = 'access store or redeem vouchers'): void {
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

export interface StoreCategoryItem {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameUr: string;
  shortLabel: string;
  shortLabelUr: string;
  description: string;
  descriptionUr: string;
  iconKey: string;
  defaultEquipSlot: string;
  displayOrder: number;
  isActive: boolean;
}

export interface StoreProductItem {
  id: string;
  itemId: string;
  categoryId: string;
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  thumbnailUrl: string;
  previewImageUrl: string;
  animationAssetUrl: string | null;
  coinPrice: number;
  durationType: string;
  durationValue: number | null;
  durationUnit: string;
  durationLabel: string;
  durationLabelUr: string;
  equipSlot: string;
  isEquippable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  displayOrder: number;
}

export interface BagItemRecord {
  inventoryId: string;
  userId: string;
  itemId: string;
  categoryId: string;
  equipSlot: string;
  purchaseId: string | null;
  quantity: number;
  status: string;
  isEquipped: boolean;
  grantedBy: string;
  purchasedAt: string;
  activatedAt: string;
  expiresAt: string | null;
  item: {
    name: string;
    nameUr: string;
    description: string;
    thumbnailUrl: string;
    previewImageUrl: string;
    durationLabel: string;
    isEquippable: boolean;
    equipSlot: string;
  };
}

export interface EquippedLoadoutMap {
  profile_frame?: any;
  name_decoration?: any;
  chat_decoration?: any;
  entrance_effect?: any;
  theme?: any;
  special_badge?: any;
  accessory?: any;
}

// -----------------------------------------------------------------------------
// 1. STORE CATEGORIES & PRODUCTS
// -----------------------------------------------------------------------------

/**
 * Returns all active store categories ordered by display order
 */
export async function getStoreCategories(): Promise<StoreCategoryItem[]> {
  const rows = await query<any>(
    `SELECT category_id, slug, name, name_ur, short_label, short_label_ur,
            description, description_ur, icon_key, default_equip_slot, display_order, is_active
     FROM popolive.store_categories
     WHERE is_active = true
     ORDER BY display_order ASC`
  );

  return rows.map((r) => ({
    id: r.category_id,
    categoryId: r.category_id,
    slug: r.slug,
    name: r.name,
    nameUr: r.name_ur,
    shortLabel: r.short_label,
    shortLabelUr: r.short_label_ur,
    description: r.description,
    descriptionUr: r.description_ur,
    iconKey: r.icon_key,
    defaultEquipSlot: r.default_equip_slot,
    displayOrder: Number(r.display_order),
    isActive: Boolean(r.is_active),
  }));
}

/**
 * Returns store products with optional category, filter, and search parameters
 */
export async function getStoreProducts(params: {
  category?: string;
  filter?: string;
  search?: string;
}): Promise<StoreProductItem[]> {
  const conditions: string[] = ['is_active = true', 'is_approved = true'];
  const values: any[] = [];
  let valIdx = 1;

  if (params.category && params.category !== 'all') {
    conditions.push(`category_id = $${valIdx++}`);
    values.push(params.category);
  }

  if (params.filter) {
    if (params.filter === 'featured') conditions.push('is_featured = true');
    else if (params.filter === 'popular') conditions.push('is_popular = true');
    else if (params.filter === 'new') conditions.push('is_new_arrival = true');
  }

  if (params.search && params.search.trim().length > 0) {
    conditions.push(`(name ILIKE $${valIdx} OR name_ur ILIKE $${valIdx})`);
    values.push(`%${params.search.trim()}%`);
    valIdx++;
  }

  const sql = `
    SELECT item_id, category_id, name, name_ur, description, description_ur,
           thumbnail_url, preview_image_url, animation_asset_url, coin_price,
           duration_type, duration_value, duration_unit, duration_label, duration_label_ur,
           equip_slot, is_equippable, is_featured, is_popular, is_new_arrival, display_order
    FROM popolive.store_items
    WHERE ${conditions.join(' AND ')}
    ORDER BY display_order ASC
  `;

  const rows = await query<any>(sql, values);

  return rows.map((r) => ({
    id: r.item_id,
    itemId: r.item_id,
    categoryId: r.category_id,
    name: r.name,
    nameUr: r.name_ur,
    description: r.description,
    descriptionUr: r.description_ur,
    thumbnailUrl: r.thumbnail_url,
    previewImageUrl: r.preview_image_url,
    animationAssetUrl: r.animation_asset_url,
    coinPrice: Number(r.coin_price),
    durationType: r.duration_type,
    durationValue: r.duration_value !== null ? Number(r.duration_value) : null,
    durationUnit: r.duration_unit,
    durationLabel: r.duration_label,
    durationLabelUr: r.duration_label_ur,
    equipSlot: r.equip_slot,
    isEquippable: Boolean(r.is_equippable),
    isFeatured: Boolean(r.is_featured),
    isPopular: Boolean(r.is_popular),
    isNewArrival: Boolean(r.is_new_arrival),
    displayOrder: Number(r.display_order),
  }));
}

/**
 * Returns single product detail by ID
 */
export async function getStoreProductDetail(productId: string): Promise<StoreProductItem | null> {
  const rows = await query<any>(
    `SELECT item_id, category_id, name, name_ur, description, description_ur,
            thumbnail_url, preview_image_url, animation_asset_url, coin_price,
            duration_type, duration_value, duration_unit, duration_label, duration_label_ur,
            equip_slot, is_equippable, is_featured, is_popular, is_new_arrival, display_order
     FROM popolive.store_items
     WHERE item_id = $1 AND is_active = true
     LIMIT 1`,
    [productId]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    id: r.item_id,
    itemId: r.item_id,
    categoryId: r.category_id,
    name: r.name,
    nameUr: r.name_ur,
    description: r.description,
    descriptionUr: r.description_ur,
    thumbnailUrl: r.thumbnail_url,
    previewImageUrl: r.preview_image_url,
    animationAssetUrl: r.animation_asset_url,
    coinPrice: Number(r.coin_price),
    durationType: r.duration_type,
    durationValue: r.duration_value !== null ? Number(r.duration_value) : null,
    durationUnit: r.duration_unit,
    durationLabel: r.duration_label,
    durationLabelUr: r.duration_label_ur,
    equipSlot: r.equip_slot,
    isEquippable: Boolean(r.is_equippable),
    isFeatured: Boolean(r.is_featured),
    isPopular: Boolean(r.is_popular),
    isNewArrival: Boolean(r.is_new_arrival),
    displayOrder: Number(r.display_order),
  };
}

// -----------------------------------------------------------------------------
// 2. ATOMIC STORE PURCHASE ENGINE
// -----------------------------------------------------------------------------

/**
 * Executes atomic store purchase with:
 * - Locked Rule 1: Age 18+ check
 * - Locked Rule 2: Atomic coin debit via P7-P7 ledger
 * - Locked Rule 3: Idempotency enforcement
 * - Locked Rule 4: Unique active product ownership (no duplicate active items)
 * - Locked Rule 5: Optional auto-equip with one-slot-per-category enforcement
 */
export async function buyStoreProductAtomic({
  user,
  productId,
  autoEquip = false,
  idempotencyKey,
}: {
  user: AuthUser;
  productId: string;
  autoEquip?: boolean;
  idempotencyKey?: string | null;
}): Promise<{
  success: boolean;
  deduplicated?: boolean;
  purchase: any;
  inventory: any;
  wallet: { coins: number; totalSpentCoins: number };
}> {
  // 1. Age 18+ enforcement
  assertAdultStore(user, 'purchase store items');

  const cleanItemId = (productId || '').trim();
  if (!cleanItemId) {
    const error: any = new Error('PRODUCT_ID_REQUIRED: Product ID is required.');
    error.code = 'PRODUCT_ID_REQUIRED';
    error.status = 400;
    throw error;
  }

  const idempKey = (idempotencyKey || '').trim() || null;

  // 2. Fast idempotency check before locking
  if (idempKey) {
    const existingPurchases = await query<any>(
      `SELECT sp.*, usi.inventory_id, usi.is_equipped
       FROM popolive.store_purchases sp
       LEFT JOIN popolive.user_store_inventory usi ON sp.inventory_id = usi.inventory_id
       WHERE sp.idempotency_key = $1
       LIMIT 1`,
      [idempKey]
    );

    if (existingPurchases.length > 0) {
      const p = existingPurchases[0];
      if (p.user_id !== user.id) {
        const error: any = new Error('IDEMPOTENCY_CONFLICT: Idempotency key belongs to another user.');
        error.code = 'IDEMPOTENCY_CONFLICT';
        error.status = 403;
        throw error;
      }
      const wallet = await getOrCreateUserWallet(user.id);
      return {
        success: p.status === 'completed',
        deduplicated: true,
        purchase: {
          purchaseId: p.purchase_id,
          itemId: p.item_id,
          categoryId: p.category_id,
          itemName: p.item_name_snapshot,
          unitCoinPrice: Number(p.unit_coin_price),
          totalCoins: Number(p.total_coins),
          status: p.status,
          coinTxId: p.coin_tx_id,
          inventoryId: p.inventory_id,
          createdAt: p.created_at,
        },
        inventory: p.inventory_id ? {
          inventoryId: p.inventory_id,
          userId: user.id,
          itemId: p.item_id,
          isEquipped: Boolean(p.is_equipped),
        } : null,
        wallet: {
          coins: wallet.coins,
          totalSpentCoins: wallet.totalSpentCoins,
        },
      };
    }
  }

  // 3. Locked Rule 4: Unique constraint check — no duplicate ownership of active product
  const existingActive = await query<any>(
    `SELECT inventory_id, item_id, status, expires_at
     FROM popolive.user_store_inventory
     WHERE user_id = $1 AND item_id = $2 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [user.id, cleanItemId]
  );

  if (existingActive.length > 0) {
    const error: any = new Error(
      `DUPLICATE_OWNERSHIP: You already own an active "${cleanItemId}". You cannot purchase a duplicate item.`
    );
    error.code = 'DUPLICATE_OWNERSHIP';
    error.status = 409;
    throw error;
  }

  // 4. Atomic Transaction: Debit Wallet + Write Ledger + Insert Inventory + Audit Purchase
  return withTransaction(async (client) => {
    // A. Query & lock item
    const itemRes = await client.query(
      `SELECT * FROM popolive.store_items WHERE item_id = $1 AND is_active = true FOR SHARE`,
      [cleanItemId]
    );

    if (itemRes.rows.length === 0) {
      const error: any = new Error(`PRODUCT_NOT_FOUND: Store product "${cleanItemId}" does not exist.`);
      error.code = 'PRODUCT_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    const item = itemRes.rows[0];
    const coinPrice = Number(item.coin_price);

    // B. Query & lock user wallet
    const walletRes = await client.query(
      `SELECT wallet_id, user_id, coins, total_spent_coins, is_frozen
       FROM popolive.user_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [user.id]
    );

    let wallet = walletRes.rows[0];
    if (!wallet) {
      // Initialize wallet in tx if not exists
      const initRes = await client.query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0, false)
         RETURNING wallet_id, user_id, coins, total_spent_coins, is_frozen`,
        [user.id]
      );
      wallet = initRes.rows[0];
    }

    if (wallet.is_frozen) {
      const error: any = new Error('WALLET_FROZEN: Your wallet is frozen. Transactions cannot be processed.');
      error.code = 'WALLET_FROZEN';
      error.status = 403;
      throw error;
    }

    const currentCoins = Number(wallet.coins) || 0;
    if (currentCoins < coinPrice) {
      const error: any = new Error(
        `INSUFFICIENT_COINS: User balance (${currentCoins} coins) is insufficient for item price (${coinPrice} coins).`
      );
      error.code = 'INSUFFICIENT_COINS';
      error.status = 400;
      throw error;
    }

    const newCoins = currentCoins - coinPrice;
    const newTotalSpent = Number(wallet.total_spent_coins) + coinPrice;

    // C. Debit coins in wallet
    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, total_spent_coins = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newCoins, newTotalSpent, user.id]
    );

    // D. Write ledger in coin_transactions (reusing P7-P7 ledger)
    const txId = `TXN_STORE_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const purchaseId = `PUR_STR_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const inventoryId = `INV_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

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
        cleanItemId,
        idempKey,
        `Store purchase: ${item.name}`,
        JSON.stringify({ purchaseId, inventoryId, itemId: cleanItemId, equipSlot: item.equip_slot }),
      ]
    );

    // E. Calculate expiry
    let expiresAt: Date | null = null;
    if (item.duration_type === 'limited_duration' && item.duration_value) {
      const val = Number(item.duration_value);
      const unit = (item.duration_unit || 'days').toLowerCase();
      const ms = unit.startsWith('day')
        ? val * 24 * 60 * 60 * 1000
        : unit.startsWith('hour')
        ? val * 60 * 60 * 1000
        : val * 30 * 24 * 60 * 60 * 1000;
      expiresAt = new Date(Date.now() + ms);
    }

    const shouldEquip = Boolean(autoEquip) && Boolean(item.is_equippable) && item.equip_slot !== 'none';

    // F. Insert store_purchases audit row
    await client.query(
      `INSERT INTO popolive.store_purchases (
        purchase_id, idempotency_key, user_id, item_id, category_id, item_name_snapshot,
        quantity, unit_coin_price, total_coins, coin_tx_id, inventory_id, status, metadata,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        1, $7, $8, $9, $10, 'completed', $11::jsonb,
        NOW(), NOW()
      )`,
      [
        purchaseId,
        idempKey,
        user.id,
        item.item_id,
        item.category_id,
        item.name,
        coinPrice,
        coinPrice,
        txId,
        inventoryId,
        JSON.stringify({ autoEquip: shouldEquip, equipSlot: item.equip_slot }),
      ]
    );

    // G. Insert user_store_inventory row (references store_purchases.purchase_id)
    await client.query(
      `INSERT INTO popolive.user_store_inventory (
        inventory_id, user_id, item_id, category_id, equip_slot, purchase_id,
        quantity, status, is_equipped, granted_by, purchased_at, activated_at, expires_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        1, 'active', $7, 'purchase', NOW(), NOW(), $8, NOW()
      )`,
      [
        inventoryId,
        user.id,
        item.item_id,
        item.category_id,
        item.equip_slot,
        purchaseId,
        shouldEquip,
        expiresAt,
      ]
    );

    // H. Increment item sold_count
    await client.query(
      `UPDATE popolive.store_items SET sold_count = sold_count + 1, updated_at = NOW() WHERE item_id = $1`,
      [cleanItemId]
    );

    // I. Handle Auto-Equip (Locked Rule 5: One-slot-per-category)
    if (shouldEquip) {
      // Un-equip previous active item in the same slot for this user
      await client.query(
        `UPDATE popolive.user_store_inventory
         SET is_equipped = false, updated_at = NOW()
         WHERE user_id = $1 AND equip_slot = $2 AND inventory_id != $3`,
        [user.id, item.equip_slot, inventoryId]
      );

      // Upsert into user_store_equipment
      await client.query(
        `INSERT INTO popolive.user_store_equipment (
          user_id, equip_slot, inventory_id, item_id, equipped_at, expires_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, NOW(), $5, NOW()
        ) ON CONFLICT (user_id, equip_slot) DO UPDATE SET
          inventory_id = EXCLUDED.inventory_id,
          item_id = EXCLUDED.item_id,
          equipped_at = NOW(),
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()`,
        [user.id, item.equip_slot, inventoryId, item.item_id, expiresAt]
      );
    }

    return {
      success: true,
      deduplicated: false,
      purchase: {
        purchaseId,
        itemId: item.item_id,
        categoryId: item.category_id,
        itemName: item.name,
        unitCoinPrice: coinPrice,
        totalCoins: coinPrice,
        status: 'completed',
        coinTxId: txId,
        inventoryId,
        createdAt: new Date().toISOString(),
      },
      inventory: {
        inventoryId,
        userId: user.id,
        itemId: item.item_id,
        categoryId: item.category_id,
        equipSlot: item.equip_slot,
        isEquipped: shouldEquip,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      },
      wallet: {
        coins: newCoins,
        totalSpentCoins: newTotalSpent,
      },
    };
  });
}

// -----------------------------------------------------------------------------
// 3. BAG & INVENTORY MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Returns user's owned inventory items with product metadata
 */
export async function getBagItems(userId: string): Promise<BagItemRecord[]> {
  const rows = await query<any>(
    `SELECT inv.inventory_id, inv.user_id, inv.item_id, inv.category_id, inv.equip_slot,
            inv.purchase_id, inv.quantity, inv.status, inv.is_equipped, inv.granted_by,
            inv.purchased_at, inv.activated_at, inv.expires_at,
            si.name AS item_name, si.name_ur AS item_name_ur, si.description,
            si.thumbnail_url, si.preview_image_url, si.duration_label, si.is_equippable
     FROM popolive.user_store_inventory inv
     JOIN popolive.store_items si ON inv.item_id = si.item_id
     WHERE inv.user_id = $1 AND inv.status = 'active'
       AND (inv.expires_at IS NULL OR inv.expires_at > NOW())
     ORDER BY inv.purchased_at DESC`,
    [userId]
  );

  return rows.map((r) => ({
    inventoryId: r.inventory_id,
    userId: r.user_id,
    itemId: r.item_id,
    categoryId: r.category_id,
    equipSlot: r.equip_slot,
    purchaseId: r.purchase_id,
    quantity: Number(r.quantity),
    status: r.status,
    isEquipped: Boolean(r.is_equipped),
    grantedBy: r.granted_by,
    purchasedAt: r.purchased_at ? new Date(r.purchased_at).toISOString() : '',
    activatedAt: r.activated_at ? new Date(r.activated_at).toISOString() : '',
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    item: {
      name: r.item_name,
      nameUr: r.item_name_ur || r.item_name,
      description: r.description || '',
      thumbnailUrl: r.thumbnail_url,
      previewImageUrl: r.preview_image_url,
      durationLabel: r.duration_label,
      isEquippable: Boolean(r.is_equippable),
      equipSlot: r.equip_slot,
    },
  }));
}

/**
 * Equips an owned inventory item.
 * LOCKED RULE 5: One-slot-per-category enforcement on server.
 */
export async function equipBagItem(user: AuthUser, inventoryId: string): Promise<{
  success: boolean;
  equipSlot: string;
  inventoryId: string;
  itemId: string;
  equippedAt: string;
}> {
  return withTransaction(async (client) => {
    // 1. Fetch inventory item with ownership check
    const invRes = await client.query(
      `SELECT inv.*, si.is_equippable
       FROM popolive.user_store_inventory inv
       JOIN popolive.store_items si ON inv.item_id = si.item_id
       WHERE inv.inventory_id = $1 AND inv.user_id = $2
       LIMIT 1`,
      [inventoryId, user.id]
    );

    if (invRes.rows.length === 0) {
      const error: any = new Error('INVENTORY_ITEM_NOT_FOUND: Item not found in your bag.');
      error.code = 'INVENTORY_ITEM_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const inv = invRes.rows[0];
    if (inv.status !== 'active' || (inv.expires_at && new Date(inv.expires_at) <= new Date())) {
      const error: any = new Error('ITEM_EXPIRED: This item has expired and cannot be equipped.');
      error.code = 'ITEM_EXPIRED';
      error.status = 400;
      throw error;
    }

    if (!inv.is_equippable || inv.equip_slot === 'none') {
      const error: any = new Error('NOT_EQUIPPABLE: This item cannot be equipped.');
      error.code = 'NOT_EQUIPPABLE';
      error.status = 400;
      throw error;
    }

    const slot = inv.equip_slot;

    // 2. Mark any previously equipped item in the same slot as unequipped
    await client.query(
      `UPDATE popolive.user_store_inventory
       SET is_equipped = false, updated_at = NOW()
       WHERE user_id = $1 AND equip_slot = $2 AND inventory_id != $3`,
      [user.id, slot, inventoryId]
    );

    // 3. Mark target inventory item as equipped
    await client.query(
      `UPDATE popolive.user_store_inventory
       SET is_equipped = true, updated_at = NOW()
       WHERE inventory_id = $1`,
      [inventoryId]
    );

    // 4. Upsert in user_store_equipment (Primary key: user_id, equip_slot)
    await client.query(
      `INSERT INTO popolive.user_store_equipment (
        user_id, equip_slot, inventory_id, item_id, equipped_at, expires_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), $5, NOW()
      ) ON CONFLICT (user_id, equip_slot) DO UPDATE SET
        inventory_id = EXCLUDED.inventory_id,
        item_id = EXCLUDED.item_id,
        equipped_at = NOW(),
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()`,
      [user.id, slot, inventoryId, inv.item_id, inv.expires_at]
    );

    return {
      success: true,
      equipSlot: slot,
      inventoryId,
      itemId: inv.item_id,
      equippedAt: new Date().toISOString(),
    };
  });
}

/**
 * Unequips an owned inventory item.
 */
export async function unequipBagItem(user: AuthUser, inventoryId: string): Promise<{
  success: boolean;
  inventoryId: string;
  equipSlot: string;
}> {
  return withTransaction(async (client) => {
    // 1. Fetch inventory item
    const invRes = await client.query(
      `SELECT inventory_id, user_id, equip_slot, item_id, is_equipped
       FROM popolive.user_store_inventory
       WHERE inventory_id = $1 AND user_id = $2
       LIMIT 1`,
      [inventoryId, user.id]
    );

    if (invRes.rows.length === 0) {
      const error: any = new Error('INVENTORY_ITEM_NOT_FOUND: Item not found in your bag.');
      error.code = 'INVENTORY_ITEM_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const inv = invRes.rows[0];

    // 2. Mark item as unequipped in inventory
    await client.query(
      `UPDATE popolive.user_store_inventory
       SET is_equipped = false, updated_at = NOW()
       WHERE inventory_id = $1`,
      [inventoryId]
    );

    // 3. Delete from active equipment table
    await client.query(
      `DELETE FROM popolive.user_store_equipment
       WHERE user_id = $1 AND equip_slot = $2 AND inventory_id = $3`,
      [user.id, inv.equip_slot, inventoryId]
    );

    return {
      success: true,
      inventoryId,
      equipSlot: inv.equip_slot,
    };
  });
}

// -----------------------------------------------------------------------------
// 4. REDEEM CODE VALIDATION & ATOMIC REDEMPTION ENGINE
// -----------------------------------------------------------------------------

/**
 * Validates a redeem code without mutating the database.
 * LOCKED RULE 9: Invalid code shows invalid sheet — zero DB mutations.
 */
export async function validateRedeemCode(user: AuthUser, rawCode: string): Promise<{
  isValid: boolean;
  code?: string;
  title?: string;
  rewardType?: string;
  coinReward?: number;
  bonusItem?: string | null;
  message: string;
  error?: string;
}> {
  // Age 18+ enforcement
  assertAdultStore(user, 'redeem voucher codes');

  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      isValid: false,
      message: 'Redeem code cannot be empty.',
      error: 'EMPTY_CODE',
    };
  }

  // Read-only query to redeem_codes
  const codeRows = await query<any>(
    `SELECT id, code, title, description, reward_type, coin_reward, bonus_item,
            max_uses, current_uses, is_active, expires_at
     FROM popolive.redeem_codes
     WHERE UPPER(code) = $1
     LIMIT 1`,
    [cleanCode]
  );

  if (codeRows.length === 0) {
    return {
      isValid: false,
      message: 'Invalid redeem code. Please check the voucher code and try again.',
      error: 'INVALID_CODE',
    };
  }

  const row = codeRows[0];

  // Check inactive status (Locked Rule 7)
  if (!row.is_active) {
    return {
      isValid: false,
      message: 'This voucher code is currently inactive or disabled.',
      error: 'CODE_INACTIVE',
    };
  }

  // Check expiry (Locked Rule 7)
  if (row.expires_at && new Date(row.expires_at) <= new Date()) {
    return {
      isValid: false,
      message: 'This voucher code has expired.',
      error: 'CODE_EXPIRED',
    };
  }

  // Check max uses if configured
  if (row.max_uses !== null && row.current_uses >= row.max_uses) {
    return {
      isValid: false,
      message: 'This voucher code has reached its maximum global redemptions.',
      error: 'CODE_MAX_USES_REACHED',
    };
  }

  // Check one-time per user enforcement (Locked Rule 6)
  const historyRows = await query<any>(
    `SELECT id, redeemed_at
     FROM popolive.redeem_history
     WHERE user_id = $1 AND code_id = $2
     LIMIT 1`,
    [user.id, row.id]
  );

  if (historyRows.length > 0) {
    return {
      isValid: false,
      message: 'You have already redeemed this voucher code. Codes are strictly one-time per user.',
      error: 'ALREADY_REDEEMED',
    };
  }

  return {
    isValid: true,
    code: row.code,
    title: row.title,
    rewardType: row.reward_type,
    coinReward: Number(row.coin_reward),
    bonusItem: row.bonus_item,
    message: 'Voucher code is valid and ready to redeem!',
  };
}

/**
 * Atomically redeems a code, crediting coins via P7-P7 wallet ledger.
 * LOCKED RULE 6: One-time per user enforcement.
 * LOCKED RULE 8: Atomic coin credit via coin_transactions ledger.
 */
export async function redeemCodeAtomic({
  user,
  rawCode,
  idempotencyKey,
}: {
  user: AuthUser;
  rawCode: string;
  idempotencyKey?: string | null;
}): Promise<{
  success: boolean;
  deduplicated?: boolean;
  code: string;
  coinReward: number;
  bonusItem: string | null;
  newBalance: number;
  transactionId: string;
  redeemedAt: string;
}> {
  // 1. Age 18+ enforcement
  assertAdultStore(user, 'redeem voucher codes');

  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    const error: any = new Error('CODE_REQUIRED: Redeem code is required.');
    error.code = 'CODE_REQUIRED';
    error.status = 400;
    throw error;
  }

  const idempKey = (idempotencyKey || '').trim() || null;

  // 2. Check Idempotency before transaction
  if (idempKey) {
    const existing = await query<any>(
      `SELECT rh.*, cw.coins
       FROM popolive.redeem_history rh
       JOIN popolive.user_wallets cw ON rh.user_id = cw.user_id
       WHERE rh.idempotency_key = $1
       LIMIT 1`,
      [idempKey]
    );

    if (existing.length > 0) {
      const rec = existing[0];
      if (rec.user_id !== user.id) {
        const error: any = new Error('IDEMPOTENCY_CONFLICT: Idempotency key belongs to another user.');
        error.code = 'IDEMPOTENCY_CONFLICT';
        error.status = 403;
        throw error;
      }
      return {
        success: true,
        deduplicated: true,
        code: rec.code,
        coinReward: Number(rec.coin_reward),
        bonusItem: rec.bonus_item,
        newBalance: Number(rec.coins),
        transactionId: rec.coin_tx_id || '',
        redeemedAt: new Date(rec.redeemed_at).toISOString(),
      };
    }
  }

  // 3. Atomic Transaction: Validate & Lock Code -> Credit Coins in Ledger -> Record History
  return withTransaction(async (client) => {
    // A. Query & lock code row
    const codeRes = await client.query(
      `SELECT * FROM popolive.redeem_codes WHERE UPPER(code) = $1 FOR UPDATE`,
      [cleanCode]
    );

    if (codeRes.rows.length === 0) {
      const error: any = new Error('INVALID_CODE: Invalid redeem code. Please verify and try again.');
      error.code = 'INVALID_CODE';
      error.status = 400;
      throw error;
    }

    const codeRow = codeRes.rows[0];

    // Status checks
    if (!codeRow.is_active) {
      const error: any = new Error('CODE_INACTIVE: This voucher code is inactive or disabled.');
      error.code = 'CODE_INACTIVE';
      error.status = 400;
      throw error;
    }

    if (codeRow.expires_at && new Date(codeRow.expires_at) <= new Date()) {
      const error: any = new Error('CODE_EXPIRED: This voucher code has expired.');
      error.code = 'CODE_EXPIRED';
      error.status = 400;
      throw error;
    }

    if (codeRow.max_uses !== null && codeRow.current_uses >= codeRow.max_uses) {
      const error: any = new Error('CODE_MAX_USES_REACHED: Voucher code has reached max redemption limit.');
      error.code = 'CODE_MAX_USES_REACHED';
      error.status = 400;
      throw error;
    }

    // B. Check one-time per user (Locked Rule 6)
    const historyRes = await client.query(
      `SELECT id FROM popolive.redeem_history WHERE user_id = $1 AND code_id = $2 FOR UPDATE`,
      [user.id, codeRow.id]
    );

    if (historyRes.rows.length > 0) {
      const error: any = new Error('ALREADY_REDEEMED: You have already redeemed this voucher code.');
      error.code = 'ALREADY_REDEEMED';
      error.status = 409;
      throw error;
    }

    // C. Lock & update user wallet
    const walletRes = await client.query(
      `SELECT wallet_id, user_id, coins, is_frozen
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
         RETURNING wallet_id, user_id, coins, is_frozen`,
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

    const rewardCoins = Number(codeRow.coin_reward) || 0;
    const currentCoins = Number(wallet.coins) || 0;
    const newCoins = currentCoins + rewardCoins;

    // Credit coins
    await client.query(
      `UPDATE popolive.user_wallets SET coins = $1, updated_at = NOW() WHERE user_id = $2`,
      [newCoins, user.id]
    );

    // D. Insert into coin_transactions (Locked Rule 8: atomic ledger entry)
    const txId = `TXN_RDM_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await client.query(
      `INSERT INTO popolive.coin_transactions (
        id, transaction_id, wallet_id, user_id, transaction_type, direction,
        coin_amount, previous_balance, new_balance, status, reference_id,
        idempotency_key, description, metadata, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'topup', 'credit',
        $4, $5, $6, 'completed', $7,
        $8, $9, $10, 'system', NOW(), NOW()
      )`,
      [
        txId,
        wallet.wallet_id,
        user.id,
        rewardCoins,
        currentCoins,
        newCoins,
        codeRow.code,
        idempKey,
        `Voucher redeemed: ${codeRow.title}`,
        JSON.stringify({ codeId: codeRow.id, bonusItem: codeRow.bonus_item }),
      ]
    );

    // E. Increment usage count
    await client.query(
      `UPDATE popolive.redeem_codes SET current_uses = current_uses + 1, updated_at = NOW() WHERE id = $1`,
      [codeRow.id]
    );

    // F. Record in redeem_history
    const historyId = crypto.randomUUID();
    const redeemedAt = new Date();

    await client.query(
      `INSERT INTO popolive.redeem_history (
        id, code_id, code, user_id, coin_reward, bonus_item, coin_tx_id, idempotency_key, redeemed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )`,
      [
        historyId,
        codeRow.id,
        codeRow.code,
        user.id,
        rewardCoins,
        codeRow.bonus_item,
        txId,
        idempKey,
        redeemedAt,
      ]
    );

    return {
      success: true,
      deduplicated: false,
      code: codeRow.code,
      coinReward: rewardCoins,
      bonusItem: codeRow.bonus_item,
      newBalance: newCoins,
      transactionId: txId,
      redeemedAt: redeemedAt.toISOString(),
    };
  });
}

// -----------------------------------------------------------------------------
// 5. EQUIPPED PROFILE LOADOUT DISPLAY (READ-ONLY)
// -----------------------------------------------------------------------------

/**
 * Returns currently equipped store items for profile display
 */
export async function getEquippedProfileLoadout(userId: string): Promise<EquippedLoadoutMap> {
  const rows = await query<any>(
    `SELECT eq.equip_slot, eq.inventory_id, eq.item_id, eq.equipped_at, eq.expires_at,
            si.name, si.name_ur, si.thumbnail_url, si.preview_image_url, si.animation_asset_url
     FROM popolive.user_store_equipment eq
     JOIN popolive.store_items si ON eq.item_id = si.item_id
     WHERE eq.user_id = $1
       AND (eq.expires_at IS NULL OR eq.expires_at > NOW())`,
    [userId]
  );

  const loadout: EquippedLoadoutMap = {};
  for (const r of rows) {
    loadout[r.equip_slot as keyof EquippedLoadoutMap] = {
      slot: r.equip_slot,
      inventoryId: r.inventory_id,
      itemId: r.item_id,
      name: r.name,
      nameUr: r.name_ur,
      thumbnailUrl: r.thumbnail_url,
      previewImageUrl: r.preview_image_url,
      animationAssetUrl: r.animation_asset_url,
      equippedAt: r.equipped_at ? new Date(r.equipped_at).toISOString() : '',
    };
  }

  return loadout;
}
