import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';
import { checkRateLimit } from '@/lib/auth';
import { bumpAnimationCacheVersion } from '@/lib/animations';
import {
  computeWebhookSignatureDigest,
  listPaymentProviders,
  verifyTopupWebhookSignature,
  type PaymentProviderRecord,
} from '@/lib/topup';
import {
  creditCoinsInTx,
  DEFAULT_DEMO_WALLET_USER_ID,
  deductCoins,
  isAuthorizedFinanceAdmin,
} from '@/lib/wallet';
import { canAccessPrivateWallet, type WalletActorContext } from '@/lib/walletAuth';

// =============================================================================
// Popo Live Phase 7 Module 7.7 — Complete VIP Membership System
// - Backend-configured VIP plans & approved non-financial benefits
// - Shared HMAC-SHA256 webhook verification & provider readiness with Module 7.6
// - Optional admin-approved coin purchase using existing wallet (never invented)
// - Server-time automatic expiry & immediate revocation of benefits & 7.4 entrance
// - Renewals, cancellations, suspensions, verified refunds & immutable audit logs
// =============================================================================

export type VipPlanTier =
  | 'vip_basic'
  | 'vip_silver'
  | 'vip_gold'
  | 'vip_diamond'
  | 'vip_premium';

export type VipMembershipStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'suspended'
  | 'refunded';

export type VipOrderStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export const VIP_FORBIDDEN_OVERRIDE_KEYS = [
  'priceAmount',
  'price',
  'amount',
  'currency',
  'durationDays',
  'vipLevel',
  'status',
  'expiryDate',
  'activationDate',
  'benefits',
  'grantedBenefits',
  'badgeLabel',
  'badgeAssetUrl',
  'profileFrameAssetUrl',
  'coinPrice',
  'coinsCharged',
  'specialEventAccess',
] as const;

export class VipServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface VipBenefitRecord {
  benefitKey: string;
  category: string;
  title: string;
  titleUr: string;
  description: string;
  descriptionUr: string;
  assetUrl: string | null;
  minVipLevel: number;
  isFinancialReward: false;
  isActive: boolean;
  displayOrder: number;
}

export interface VipPlanRecord {
  planId: string;
  planTier: VipPlanTier;
  vipLevel: number;
  planName: string;
  planNameUr: string;
  description: string;
  descriptionUr: string;
  durationDays: number;
  priceAmount: number;
  renewalPriceAmount: number;
  currency: string;
  allowCoinPurchase: boolean;
  coinPrice: number | null;
  badgeLabel: string;
  badgeAssetUrl: string;
  profileFrameAssetUrl: string;
  nameDecorationStyle: string;
  themeKey: string;
  entranceId: string | null;
  entranceAnimationRef: string | null;
  benefitKeys: string[];
  benefits: VipBenefitRecord[];
  benefitsConfig: Record<string, any>;
  specialEventAccess: boolean;
  platformProductIdIos: string | null;
  platformProductIdAndroid: string | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VipOrderRecord {
  orderId: string;
  purchaseId: string;
  idempotencyKey: string | null;
  userId: string;
  planId: string;
  planName: string;
  vipLevel: number;
  orderType: 'purchase' | 'renewal';
  renewalTargetMembershipId: string | null;
  providerKey: string;
  paymentReference: string | null;
  platform: 'web' | 'android' | 'ios';
  amount: number;
  currency: string;
  coinsCharged: number | null;
  durationDays: number;
  autoRenewConsent: boolean;
  status: VipOrderStatus;
  failureReason: string | null;
  verifiedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VipMembershipRecord {
  membershipId: string;
  userId: string;
  nickname?: string | null;
  poppoId?: string | null;
  planId: string;
  planName: string;
  planTier: VipPlanTier;
  vipLevel: number;
  purchaseId: string | null;
  orderId: string | null;
  paymentReference: string | null;
  paymentMethod: string;
  purchaseAmount: number;
  currency: string;
  coinsCharged: number | null;
  durationDays: number;
  status: VipMembershipStatus;
  activationDate: string | null;
  expiryDate: string | null;
  cancelledAt: string | null;
  suspendedAt: string | null;
  refundedAt: string | null;
  renewalReference: string | null;
  autoRenewConsent: boolean;
  autoRenewEnabled: boolean;
  grantedBenefits: string[];
  badgeLabel: string;
  badgeAssetUrl: string | null;
  profileFrameAssetUrl: string | null;
  nameDecorationStyle: string | null;
  themeKey: string | null;
  entranceId: string | null;
  specialEventAccess: boolean;
  statusReason: string | null;
  receiptId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VipReceiptRecord {
  receiptId: string;
  orderId: string;
  membershipId: string;
  userId: string;
  planId: string;
  planName: string;
  receiptType: 'purchase' | 'renewal';
  providerKey: string;
  providerDisplayName: string;
  paymentReference: string;
  amount: number;
  currency: string;
  coinsCharged: number | null;
  durationDays: number;
  activationDate: string;
  expiryDate: string;
  receiptStatus: 'issued' | 'refunded';
  issuedAt: string;
}

export interface ActiveUserVipProfile {
  userId: string;
  hasActiveVip: boolean;
  vipLevel: number;
  vipTier: string;
  status: VipMembershipStatus | 'none';
  membershipId: string | null;
  planId: string | null;
  planName: string | null;
  badgeLabel: string | null;
  badgeAssetUrl: string | null;
  profileFrameAssetUrl: string | null;
  nameDecorationStyle: string | null;
  themeKey: string | null;
  entranceId: string | null;
  specialEventAccess: boolean;
  activationDate: string | null;
  expiryDate: string | null;
  daysRemaining: number;
  autoRenewEnabled: boolean;
  activeBenefits: VipBenefitRecord[];
  activeBenefitKeys: string[];
  vipGiftEffect: {
    enabled: boolean;
    auraStyle: string | null;
    badgeLabel: string | null;
  };
  pendingOrder: VipOrderRecord | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIP_PLANS_CACHE_KEY = 'vip:plans:catalog:v1';

function genVipId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function detectTamperedVipKeys(body: Record<string, any> | null | undefined): string | null {
  if (!body || typeof body !== 'object') return null;
  for (const key of VIP_FORBIDDEN_OVERRIDE_KEYS) {
    if (body[key] !== undefined) return key;
  }
  return null;
}

async function invalidateVipCaches(userId?: string): Promise<void> {
  await redisDel(VIP_PLANS_CACHE_KEY);
  if (userId) {
    await redisDel(`vip:profile:${userId}`);
  }
  await bumpAnimationCacheVersion();
}

export async function emitVipRealtimeEvent(
  client: any | null,
  userId: string,
  eventName:
    | 'vip:purchase_pending'
    | 'vip:purchase_completed'
    | 'vip:membership_activated'
    | 'vip:membership_renewed'
    | 'vip:membership_expired'
    | 'vip:membership_cancelled'
    | 'vip:benefits_updated',
  payload: Record<string, any>
): Promise<void> {
  const exec = client ? (sql: string, args: any[]) => client.query(sql, args) : query;
  await exec(
    `INSERT INTO popolive.vip_realtime_events (user_id, event_name, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventName, JSON.stringify(payload)]
  );
}

function mapBenefitRow(r: any): VipBenefitRecord {
  return {
    benefitKey: r.benefit_key,
    category: r.category,
    title: r.title,
    titleUr: r.title_ur || r.title,
    description: r.description,
    descriptionUr: r.description_ur || r.description,
    assetUrl: r.asset_url || null,
    minVipLevel: parseInt(String(r.min_vip_level ?? 1), 10),
    isFinancialReward: false,
    isActive: Boolean(r.is_active),
    displayOrder: parseInt(String(r.display_order ?? 1), 10),
  };
}

function mapPlanRow(r: any, benefitsByKey: Map<string, VipBenefitRecord>): VipPlanRecord {
  const keys: string[] = Array.isArray(r.benefit_keys)
    ? r.benefit_keys
    : typeof r.benefit_keys === 'string'
    ? JSON.parse(r.benefit_keys || '[]')
    : [];
  const priceAmount = Number(r.price_amount);
  const renewalPriceAmount =
    r.renewal_price_amount !== null && r.renewal_price_amount !== undefined
      ? Number(r.renewal_price_amount)
      : priceAmount;

  return {
    planId: r.plan_id,
    planTier: r.plan_tier,
    vipLevel: parseInt(String(r.vip_level), 10),
    planName: r.plan_name,
    planNameUr: r.plan_name_ur || r.plan_name,
    description: r.description || '',
    descriptionUr: r.description_ur || r.description || '',
    durationDays: parseInt(String(r.duration_days), 10),
    priceAmount,
    renewalPriceAmount,
    currency: String(r.currency || 'USD').toUpperCase(),
    allowCoinPurchase: Boolean(r.allow_coin_purchase),
    coinPrice:
      r.coin_price !== null && r.coin_price !== undefined ? parseInt(String(r.coin_price), 10) : null,
    badgeLabel: r.badge_label,
    badgeAssetUrl: r.badge_asset_url || '/assets/gifts/07_07_vip.png',
    profileFrameAssetUrl: r.profile_frame_asset_url || '/assets/gifts/entrances/entrance_vip.png',
    nameDecorationStyle: r.name_decoration_style || 'gold_shimmer',
    themeKey: r.theme_key || 'cosmic_royale',
    entranceId: r.entrance_id || null,
    entranceAnimationRef: r.entrance_animation_ref || null,
    benefitKeys: keys,
    benefits: keys
      .map((k) => benefitsByKey.get(k))
      .filter((b): b is VipBenefitRecord => Boolean(b && b.isActive)),
    benefitsConfig:
      r.benefits_config && typeof r.benefits_config === 'object' ? r.benefits_config : {},
    specialEventAccess: Boolean(r.special_event_access),
    platformProductIdIos: r.platform_product_id_ios || null,
    platformProductIdAndroid: r.platform_product_id_android || null,
    isPopular: Boolean(r.is_popular),
    isActive: Boolean(r.is_active),
    displayOrder: parseInt(String(r.display_order ?? 1), 10),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapOrderRow(r: any): VipOrderRecord {
  return {
    orderId: r.order_id,
    purchaseId: r.purchase_id,
    idempotencyKey: r.idempotency_key || null,
    userId: r.user_id,
    planId: r.plan_id,
    planName: r.plan_name,
    vipLevel: parseInt(String(r.vip_level), 10),
    orderType: r.order_type === 'renewal' ? 'renewal' : 'purchase',
    renewalTargetMembershipId: r.renewal_target_membership_id || null,
    providerKey: r.provider_key,
    paymentReference: r.payment_reference || null,
    platform: r.platform || 'web',
    amount: Number(r.amount),
    currency: String(r.currency || 'USD').toUpperCase(),
    coinsCharged:
      r.coins_charged !== null && r.coins_charged !== undefined
        ? parseInt(String(r.coins_charged), 10)
        : null,
    durationDays: parseInt(String(r.duration_days), 10),
    autoRenewConsent: Boolean(r.auto_renew_consent),
    status: r.status,
    failureReason: r.failure_reason || null,
    verifiedAt: r.verified_at ? new Date(r.verified_at).toISOString() : null,
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : new Date().toISOString(),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapMembershipRow(r: any): VipMembershipRecord {
  const granted: string[] = Array.isArray(r.granted_benefits)
    ? r.granted_benefits
    : typeof r.granted_benefits === 'string'
    ? JSON.parse(r.granted_benefits || '[]')
    : [];
  return {
    membershipId: r.membership_id,
    userId: r.user_id,
    nickname: r.nickname || null,
    poppoId: r.poppo_id || null,
    planId: r.plan_id,
    planName: r.plan_name,
    planTier: r.plan_tier,
    vipLevel: parseInt(String(r.vip_level), 10),
    purchaseId: r.purchase_id || null,
    orderId: r.order_id || null,
    paymentReference: r.payment_reference || null,
    paymentMethod: r.payment_method,
    purchaseAmount: Number(r.purchase_amount),
    currency: String(r.currency || 'USD').toUpperCase(),
    coinsCharged:
      r.coins_charged !== null && r.coins_charged !== undefined
        ? parseInt(String(r.coins_charged), 10)
        : null,
    durationDays: parseInt(String(r.duration_days), 10),
    status: r.status,
    activationDate: r.activation_date ? new Date(r.activation_date).toISOString() : null,
    expiryDate: r.expiry_date ? new Date(r.expiry_date).toISOString() : null,
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
    suspendedAt: r.suspended_at ? new Date(r.suspended_at).toISOString() : null,
    refundedAt: r.refunded_at ? new Date(r.refunded_at).toISOString() : null,
    renewalReference: r.renewal_reference || null,
    autoRenewConsent: Boolean(r.auto_renew_consent),
    autoRenewEnabled: Boolean(r.auto_renew_enabled),
    grantedBenefits: granted,
    badgeLabel: r.badge_label,
    badgeAssetUrl: r.badge_asset_url || null,
    profileFrameAssetUrl: r.profile_frame_asset_url || null,
    nameDecorationStyle: r.name_decoration_style || null,
    themeKey: r.theme_key || null,
    entranceId: r.entrance_id || null,
    specialEventAccess: Boolean(r.special_event_access),
    statusReason: r.status_reason || null,
    receiptId: r.receipt_id || null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapReceiptRow(r: any): VipReceiptRecord {
  return {
    receiptId: r.receipt_id,
    orderId: r.order_id,
    membershipId: r.membership_id,
    userId: r.user_id,
    planId: r.plan_id,
    planName: r.plan_name,
    receiptType: r.receipt_type === 'renewal' ? 'renewal' : 'purchase',
    providerKey: r.provider_key,
    providerDisplayName: r.provider_display_name,
    paymentReference: r.payment_reference,
    amount: Number(r.amount),
    currency: String(r.currency || 'USD').toUpperCase(),
    coinsCharged:
      r.coins_charged !== null && r.coins_charged !== undefined
        ? parseInt(String(r.coins_charged), 10)
        : null,
    durationDays: parseInt(String(r.duration_days), 10),
    activationDate: r.activation_date ? new Date(r.activation_date).toISOString() : '',
    expiryDate: r.expiry_date ? new Date(r.expiry_date).toISOString() : '',
    receiptStatus: r.receipt_status === 'refunded' ? 'refunded' : 'issued',
    issuedAt: r.issued_at ? new Date(r.issued_at).toISOString() : new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// 1. Canonical User Resolution & Plan/Benefit Queries
// -----------------------------------------------------------------------------
export async function resolveCanonicalVipUserId(identifier: string): Promise<string> {
  const clean = (identifier || '').trim();
  if (!clean) return clean;
  if (clean === 'user_wallet_demo_701' || clean.startsWith('test_')) return clean;

  if (UUID_REGEX.test(clean)) {
    const rows = await query<{ id: string }>(
      `SELECT id::text AS id FROM popolive.users WHERE id = $1 LIMIT 1`,
      [clean]
    );
    return rows[0]?.id || clean;
  }

  const rows = await query<{ id: string }>(
    `SELECT id::text AS id FROM popolive.users WHERE id::text = $1 OR poppo_id = $1 LIMIT 1`,
    [clean]
  );
  return rows[0]?.id || clean;
}

export async function listVipBenefitCatalog(includeInactive = false): Promise<VipBenefitRecord[]> {
  const rows = await query<any>(
    `SELECT * FROM popolive.vip_benefit_catalog
     ${includeInactive ? '' : 'WHERE is_active = TRUE'}
     ORDER BY display_order ASC`
  );
  return rows.map(mapBenefitRow);
}

export async function listVipPlans(options?: { includeInactive?: boolean }): Promise<VipPlanRecord[]> {
  const includeInactive = Boolean(options?.includeInactive);
  if (!includeInactive) {
    const cachedRaw = await redisGet(VIP_PLANS_CACHE_KEY);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Ignore stale cache
      }
    }
  }

  const [benefits, planRows] = await Promise.all([
    listVipBenefitCatalog(true),
    query<any>(
      `SELECT * FROM popolive.vip_plans
       ${includeInactive ? '' : 'WHERE is_active = TRUE'}
       ORDER BY display_order ASC, vip_level ASC`
    ),
  ]);

  const byKey = new Map<string, VipBenefitRecord>();
  for (const b of benefits) byKey.set(b.benefitKey, b);
  const plans = planRows.map((r: any) => mapPlanRow(r, byKey));

  if (!includeInactive) {
    await redisSetWithTtl(VIP_PLANS_CACHE_KEY, JSON.stringify(plans), 60);
  }
  return plans;
}

export async function getVipPlanById(
  planId: string,
  options?: { includeInactive?: boolean }
): Promise<VipPlanRecord> {
  const plans = await listVipPlans({ includeInactive: options?.includeInactive ?? true });
  const plan = plans.find((p) => p.planId === planId);
  if (!plan) {
    throw new VipServiceError(404, 'VIP_PLAN_NOT_FOUND', `VIP plan "${planId}" was not found.`);
  }
  if (!options?.includeInactive && !plan.isActive) {
    throw new VipServiceError(403, 'VIP_PLAN_INACTIVE', `VIP plan "${plan.planName}" is currently inactive.`);
  }
  return plan;
}

// -----------------------------------------------------------------------------
// 2. Server-Time Expiry Enforcement & Synchronization with Module 7.4
// -----------------------------------------------------------------------------
async function syncUserVipToAnimationsTableInTx(
  client: any,
  params: {
    userId: string;
    active: boolean;
    membershipId: string;
    vipLevel?: number;
    vipTier?: string;
    badgeLabel?: string;
    specialEventAccess?: boolean;
    status?: 'active' | 'expired' | 'revoked';
    expiresAt?: Date | string;
    actor?: string;
  }
): Promise<void> {
  if (!params.active) {
    await client.query(
      `UPDATE popolive.user_vip_memberships
       SET vip_level = 0,
           vip_tier = 'none',
           badge_label = 'NONE',
           special_event_access = FALSE,
           status = $2,
           granted_by = $3,
           expires_at = LEAST(expires_at, NOW()),
           updated_at = NOW()
       WHERE user_id = $1`,
      [params.userId, params.status || 'revoked', params.actor || 'vip_system']
    );
    return;
  }

  await client.query(
    `INSERT INTO popolive.user_vip_memberships (
       membership_id, user_id, vip_level, vip_tier, badge_label,
       special_event_access, status, granted_by, expires_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       membership_id = EXCLUDED.membership_id,
       vip_level = EXCLUDED.vip_level,
       vip_tier = EXCLUDED.vip_tier,
       badge_label = EXCLUDED.badge_label,
       special_event_access = EXCLUDED.special_event_access,
       status = 'active',
       granted_by = EXCLUDED.granted_by,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()`,
    [
      params.membershipId,
      params.userId,
      params.vipLevel ?? 1,
      params.vipTier || 'vip_basic',
      params.badgeLabel || 'VIP',
      Boolean(params.specialEventAccess),
      params.actor || 'vip_system',
      params.expiresAt || new Date(Date.now() + 30 * 86400_000),
    ]
  );
}

export async function syncExpiredVipMemberships(targetUserId?: string): Promise<number> {
  return withTransaction(async (client) => {
    const expiredRecords = (
      await client.query(
        targetUserId
          ? `UPDATE popolive.vip_membership_records
             SET status = 'expired',
                 status_reason = COALESCE(status_reason, 'Membership reached server expiry timestamp'),
                 updated_at = NOW()
             WHERE user_id = $1 AND status = 'active' AND expiry_date <= NOW()
             RETURNING membership_id, user_id, plan_id, plan_name, expiry_date`
          : `UPDATE popolive.vip_membership_records
             SET status = 'expired',
                 status_reason = COALESCE(status_reason, 'Membership reached server expiry timestamp'),
                 updated_at = NOW()
             WHERE status = 'active' AND expiry_date <= NOW()
             RETURNING membership_id, user_id, plan_id, plan_name, expiry_date`,
        targetUserId ? [targetUserId] : []
      )
    ).rows;

    await client.query(
      targetUserId
        ? `UPDATE popolive.vip_membership_orders
           SET status = 'expired', updated_at = NOW()
           WHERE user_id = $1 AND status = 'pending' AND expires_at <= NOW()`
        : `UPDATE popolive.vip_membership_orders
           SET status = 'expired', updated_at = NOW()
           WHERE status = 'pending' AND expires_at <= NOW()`,
      targetUserId ? [targetUserId] : []
    );

    if (expiredRecords.length > 0) {
      const affectedUsers: string[] = Array.from(new Set<string>(expiredRecords.map((r: any) => String(r.user_id))));
      for (const uid of affectedUsers) {
        const remainingActive = (
          await client.query(
            `SELECT * FROM popolive.vip_membership_records
             WHERE user_id = $1 AND status = 'active' AND expiry_date > NOW()
             ORDER BY vip_level DESC, expiry_date DESC LIMIT 1`,
            [uid]
          )
        ).rows[0];

        if (!remainingActive) {
          await syncUserVipToAnimationsTableInTx(client, {
            userId: uid,
            active: false,
            membershipId: expiredRecords.find((r: any) => r.user_id === uid)?.membership_id || 'EXPIRED',
            status: 'expired',
            actor: 'server_expiry_clock',
          });
        }

        for (const rec of expiredRecords.filter((r: any) => r.user_id === uid)) {
          await emitVipRealtimeEvent(client, uid, 'vip:membership_expired', {
            membershipId: rec.membership_id,
            planId: rec.plan_id,
            planName: rec.plan_name,
            expiryDate: rec.expiry_date,
          });
        }
        await emitVipRealtimeEvent(client, uid, 'vip:benefits_updated', {
          userId: uid,
          hasActiveVip: Boolean(remainingActive),
          vipLevel: remainingActive ? parseInt(String(remainingActive.vip_level), 10) : 0,
        });
      }
      await invalidateVipCaches(targetUserId);
    }

    return expiredRecords.length;
  });
}

export async function resolveActiveUserVipProfile(
  rawIdentifier: string,
  options?: { includePendingOrder?: boolean }
): Promise<ActiveUserVipProfile> {
  const userId = await resolveCanonicalVipUserId(rawIdentifier);
  if (!userId) {
    return {
      userId: '',
      hasActiveVip: false,
      vipLevel: 0,
      vipTier: 'none',
      status: 'none',
      membershipId: null,
      planId: null,
      planName: null,
      badgeLabel: null,
      badgeAssetUrl: null,
      profileFrameAssetUrl: null,
      nameDecorationStyle: null,
      themeKey: null,
      entranceId: null,
      specialEventAccess: false,
      activationDate: null,
      expiryDate: null,
      daysRemaining: 0,
      autoRenewEnabled: false,
      activeBenefits: [],
      activeBenefitKeys: [],
      vipGiftEffect: { enabled: false, auraStyle: null, badgeLabel: null },
      pendingOrder: null,
    };
  }

  await syncExpiredVipMemberships(userId);

  const [records, benefitCatalog, pendingRows] = await Promise.all([
    query<any>(
      `SELECT * FROM popolive.vip_membership_records
       WHERE user_id = $1
       ORDER BY (status = 'active' AND expiry_date > NOW()) DESC, vip_level DESC, created_at DESC
       LIMIT 2`,
      [userId]
    ),
    listVipBenefitCatalog(false),
    options?.includePendingOrder
      ? query<any>(
          `SELECT * FROM popolive.vip_membership_orders
           WHERE user_id = $1 AND status = 'pending' AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
      : Promise.resolve([]),
  ]);

  const benefitMap = new Map<string, VipBenefitRecord>();
  for (const b of benefitCatalog) benefitMap.set(b.benefitKey, b);

  const activeRow = records.find(
    (r: any) =>
      r.status === 'active' &&
      r.expiry_date &&
      new Date(r.expiry_date).getTime() > Date.now()
  );

  const latestRow = activeRow || records[0] || null;
  const pendingOrder = pendingRows[0] ? mapOrderRow(pendingRows[0]) : null;

  if (!activeRow) {
    return {
      userId,
      hasActiveVip: false,
      vipLevel: 0,
      vipTier: 'none',
      status: latestRow ? (latestRow.status as VipMembershipStatus) : pendingOrder ? 'pending' : 'none',
      membershipId: latestRow?.membership_id || null,
      planId: latestRow?.plan_id || null,
      planName: latestRow?.plan_name || null,
      badgeLabel: null,
      badgeAssetUrl: null,
      profileFrameAssetUrl: null,
      nameDecorationStyle: null,
      themeKey: null,
      entranceId: null,
      specialEventAccess: false,
      activationDate: latestRow?.activation_date ? new Date(latestRow.activation_date).toISOString() : null,
      expiryDate: latestRow?.expiry_date ? new Date(latestRow.expiry_date).toISOString() : null,
      daysRemaining: 0,
      autoRenewEnabled: false,
      activeBenefits: [],
      activeBenefitKeys: [],
      vipGiftEffect: { enabled: false, auraStyle: null, badgeLabel: null },
      pendingOrder,
    };
  }

  const benefitKeys: string[] = Array.isArray(activeRow.granted_benefits)
    ? activeRow.granted_benefits
    : JSON.parse(activeRow.granted_benefits || '[]');
  const activeBenefits = benefitKeys
    .map((k) => benefitMap.get(k))
    .filter((b): b is VipBenefitRecord => Boolean(b));

  const expiryMs = new Date(activeRow.expiry_date).getTime();
  const daysRemaining = Math.max(0, Math.ceil((expiryMs - Date.now()) / 86400_000));
  const hasGiftEffect = benefitKeys.includes('vip_gift_effects');

  return {
    userId,
    hasActiveVip: true,
    vipLevel: parseInt(String(activeRow.vip_level), 10),
    vipTier: activeRow.plan_tier,
    status: 'active',
    membershipId: activeRow.membership_id,
    planId: activeRow.plan_id,
    planName: activeRow.plan_name,
    badgeLabel: activeRow.badge_label,
    badgeAssetUrl: activeRow.badge_asset_url || '/assets/gifts/07_07_vip.png',
    profileFrameAssetUrl: activeRow.profile_frame_asset_url || null,
    nameDecorationStyle: activeRow.name_decoration_style || null,
    themeKey: activeRow.theme_key || null,
    entranceId: activeRow.entrance_id || null,
    specialEventAccess: Boolean(activeRow.special_event_access),
    activationDate: activeRow.activation_date ? new Date(activeRow.activation_date).toISOString() : null,
    expiryDate: activeRow.expiry_date ? new Date(activeRow.expiry_date).toISOString() : null,
    daysRemaining,
    autoRenewEnabled: Boolean(activeRow.auto_renew_enabled),
    activeBenefits,
    activeBenefitKeys: benefitKeys,
    vipGiftEffect: {
      enabled: hasGiftEffect,
      auraStyle: hasGiftEffect ? activeRow.name_decoration_style || 'gold_shimmer' : null,
      badgeLabel: hasGiftEffect ? activeRow.badge_label : null,
    },
    pendingOrder,
  };
}

// -----------------------------------------------------------------------------
// 3. Purchase & Renewal Settlement Helpers
// -----------------------------------------------------------------------------
async function settleVerifiedVipOrderInTx(
  client: any,
  params: {
    orderRow: any;
    plan: VipPlanRecord;
    providerDisplayName: string;
    paymentReference: string;
    coinsCharged?: number | null;
  }
): Promise<{
  membership: VipMembershipRecord;
  receipt: VipReceiptRecord;
  order: VipOrderRecord;
}> {
  const { orderRow, plan, providerDisplayName, paymentReference } = params;
  const userId = String(orderRow.user_id);
  const now = new Date();

  const existingActive = (
    await client.query(
      `SELECT * FROM popolive.vip_membership_records
       WHERE user_id = $1 AND status = 'active'
       ORDER BY vip_level DESC, expiry_date DESC LIMIT 1
       FOR UPDATE`,
      [userId]
    )
  ).rows[0];

  let targetRenewalRow: any = null;
  if (orderRow.order_type === 'renewal') {
    if (orderRow.renewal_target_membership_id) {
      targetRenewalRow = (
        await client.query(
          `SELECT * FROM popolive.vip_membership_records WHERE membership_id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`,
          [orderRow.renewal_target_membership_id, userId]
        )
      ).rows[0];
    }
    if (!targetRenewalRow) {
      targetRenewalRow = existingActive || null;
    }
  }

  let activationDate = now;
  let baseExpiryStart = now;
  if (
    orderRow.order_type === 'renewal' &&
    targetRenewalRow &&
    targetRenewalRow.status === 'active' &&
    targetRenewalRow.expiry_date &&
    new Date(targetRenewalRow.expiry_date).getTime() > now.getTime()
  ) {
    activationDate = targetRenewalRow.activation_date ? new Date(targetRenewalRow.activation_date) : now;
    baseExpiryStart = new Date(targetRenewalRow.expiry_date);
  }

  const expiryDate = new Date(baseExpiryStart.getTime() + plan.durationDays * 86400_000);
  const membershipId = genVipId('VIPM');

  // Archive any prior active row cleanly so the user has one single canonical active VIP tier at a time
  if (existingActive) {
    await client.query(
      `UPDATE popolive.vip_membership_records
       SET status = 'expired',
           status_reason = $2,
           updated_at = NOW()
       WHERE membership_id = $1`,
      [
        existingActive.membership_id,
        orderRow.order_type === 'renewal'
          ? `Renewed into ${membershipId}`
          : `Upgraded/replaced by ${membershipId}`,
      ]
    );
  }

  const updatedOrderRow = (
    await client.query(
      `UPDATE popolive.vip_membership_orders
       SET status = 'verified',
           payment_reference = $2,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE order_id = $1
       RETURNING *`,
      [orderRow.order_id, paymentReference]
    )
  ).rows[0];

  const insertedMembershipRow = (
    await client.query(
      `INSERT INTO popolive.vip_membership_records (
         membership_id, user_id, plan_id, plan_name, plan_tier, vip_level,
         purchase_id, order_id, payment_reference, payment_method,
         purchase_amount, currency, coins_charged, duration_days, status,
         activation_date, expiry_date, renewal_reference,
         auto_renew_consent, auto_renew_enabled, granted_benefits,
         badge_label, badge_asset_url, profile_frame_asset_url,
         name_decoration_style, theme_key, entrance_id, special_event_access, status_reason
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,$13,$14,'active',
         $15,$16,$17,
         $18,$19,$20::jsonb,
         $21,$22,$23,
         $24,$25,$26,$27,$28
       ) RETURNING *`,
      [
        membershipId,
        userId,
        plan.planId,
        plan.planName,
        plan.planTier,
        plan.vipLevel,
        orderRow.purchase_id,
        orderRow.order_id,
        paymentReference,
        orderRow.provider_key,
        Number(orderRow.amount),
        orderRow.currency,
        params.coinsCharged ?? null,
        plan.durationDays,
        activationDate,
        expiryDate,
        targetRenewalRow?.membership_id || existingActive?.membership_id || null,
        Boolean(orderRow.auto_renew_consent),
        Boolean(orderRow.auto_renew_consent),
        JSON.stringify(plan.benefitKeys),
        plan.badgeLabel,
        plan.badgeAssetUrl,
        plan.profileFrameAssetUrl,
        plan.nameDecorationStyle,
        plan.themeKey,
        plan.entranceId,
        Boolean(plan.specialEventAccess),
        orderRow.order_type === 'renewal' ? 'Verified renewal payment' : 'Verified purchase payment',
      ]
    )
  ).rows[0];

  await syncUserVipToAnimationsTableInTx(client, {
    userId,
    active: true,
    membershipId,
    vipLevel: plan.vipLevel,
    vipTier: plan.planTier,
    badgeLabel: plan.badgeLabel,
    specialEventAccess: plan.specialEventAccess,
    expiresAt: expiryDate,
    actor: `vip_${orderRow.provider_key}`,
  });

  const receiptId = genVipId('VIPRCP');
  const receiptRow = (
    await client.query(
      `INSERT INTO popolive.vip_receipts (
         receipt_id, order_id, membership_id, user_id, plan_id, plan_name,
         receipt_type, provider_key, provider_display_name, payment_reference,
         amount, currency, coins_charged, duration_days, activation_date, expiry_date
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        receiptId,
        orderRow.order_id,
        membershipId,
        userId,
        plan.planId,
        plan.planName,
        orderRow.order_type,
        orderRow.provider_key,
        providerDisplayName,
        paymentReference,
        Number(orderRow.amount),
        orderRow.currency,
        params.coinsCharged ?? null,
        plan.durationDays,
        activationDate,
        expiryDate,
      ]
    )
  ).rows[0];

  const membership = mapMembershipRow(insertedMembershipRow);
  const receipt = mapReceiptRow(receiptRow);
  const order = mapOrderRow(updatedOrderRow);

  await emitVipRealtimeEvent(client, userId, 'vip:purchase_completed', {
    orderId: order.orderId,
    purchaseId: order.purchaseId,
    membershipId: membership.membershipId,
    receiptId: receipt.receiptId,
    planId: plan.planId,
    planName: plan.planName,
    amount: order.amount,
    currency: order.currency,
  });

  await emitVipRealtimeEvent(
    client,
    userId,
    orderRow.order_type === 'renewal' ? 'vip:membership_renewed' : 'vip:membership_activated',
    {
      membershipId: membership.membershipId,
      planId: plan.planId,
      planName: plan.planName,
      vipLevel: plan.vipLevel,
      badgeLabel: plan.badgeLabel,
      activationDate: membership.activationDate,
      expiryDate: membership.expiryDate,
      renewalReference: membership.renewalReference,
    }
  );

  await emitVipRealtimeEvent(client, userId, 'vip:benefits_updated', {
    userId,
    hasActiveVip: true,
    vipLevel: plan.vipLevel,
    badgeLabel: plan.badgeLabel,
    benefitKeys: plan.benefitKeys,
    profileFrameAssetUrl: plan.profileFrameAssetUrl,
    nameDecorationStyle: plan.nameDecorationStyle,
    themeKey: plan.themeKey,
    entranceId: plan.entranceId,
  });

  return { membership, receipt, order };
}

// -----------------------------------------------------------------------------
// 4. Create Purchase or Renewal Order (Strict Readiness & Tamper Guard)
// -----------------------------------------------------------------------------
export async function createVipPurchaseOrder(params: {
  userId: string;
  planId: string;
  providerKey: string;
  orderType?: 'purchase' | 'renewal';
  targetMembershipId?: string | null;
  platform?: 'web' | 'android' | 'ios';
  autoRenewConsent?: boolean;
  idempotencyKey?: string | null;
  rawBody?: Record<string, any> | null;
}): Promise<{
  deduplicated: boolean;
  activatedImmediately: boolean;
  order: VipOrderRecord;
  plan: VipPlanRecord;
  provider: PaymentProviderRecord | { providerKey: 'wallet_coins'; displayName: string; isSandbox: false };
  membership?: VipMembershipRecord | null;
  receipt?: VipReceiptRecord | null;
  message: string;
}> {
  const tamperedKey = detectTamperedVipKeys(params.rawBody);
  if (tamperedKey) {
    throw new VipServiceError(
      403,
      'CLIENT_VIP_OVERRIDE_FORBIDDEN',
      `Security violation: Client cannot override protected field "${tamperedKey}".`
    );
  }

  const userId = await resolveCanonicalVipUserId(params.userId);
  if (!userId) {
    throw new VipServiceError(401, 'AUTH_REQUIRED', 'Authentication is required to purchase VIP.');
  }

  const rl = await checkRateLimit(`vip_order_${userId}`, 30, 60);
  if (!rl.allowed) {
    throw new VipServiceError(429, 'RATE_LIMITED', 'Too many VIP order requests. Please wait.');
  }

  const cleanIdem = (params.idempotencyKey || '').trim() || null;
  if (cleanIdem) {
    const existingRows = await query<any>(
      `SELECT * FROM popolive.vip_membership_orders WHERE idempotency_key = $1 LIMIT 1`,
      [cleanIdem]
    );
    if (existingRows.length > 0) {
      const existingOrder = mapOrderRow(existingRows[0]);
      if (existingOrder.userId !== userId) {
        throw new VipServiceError(403, 'FORBIDDEN', 'Idempotency key belongs to another account.');
      }
      const plan = await getVipPlanById(existingOrder.planId, { includeInactive: true });
      const memRows = await query<any>(
        `SELECT * FROM popolive.vip_membership_records WHERE order_id = $1 LIMIT 1`,
        [existingOrder.orderId]
      );
      const rcpRows = await query<any>(
        `SELECT * FROM popolive.vip_receipts WHERE order_id = $1 LIMIT 1`,
        [existingOrder.orderId]
      );
      return {
        deduplicated: true,
        activatedImmediately: existingOrder.status === 'verified',
        order: existingOrder,
        plan,
        provider: { providerKey: 'wallet_coins', displayName: existingOrder.providerKey, isSandbox: false },
        membership: memRows[0] ? mapMembershipRow(memRows[0]) : null,
        receipt: rcpRows[0] ? mapReceiptRow(rcpRows[0]) : null,
        message: 'Duplicate VIP order prevented cleanly (idempotent replay).',
      };
    }
  }

  const plan = await getVipPlanById(params.planId, { includeInactive: false });
  const orderType = params.orderType === 'renewal' ? 'renewal' : 'purchase';
  const platform =
    params.platform === 'ios' || params.platform === 'android' ? params.platform : 'web';

  let renewalTargetId: string | null = params.targetMembershipId || null;
  if (orderType === 'renewal') {
    const memRows = await query<any>(
      renewalTargetId
        ? `SELECT * FROM popolive.vip_membership_records WHERE membership_id = $1 AND user_id = $2 LIMIT 1`
        : `SELECT * FROM popolive.vip_membership_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      renewalTargetId ? [renewalTargetId, userId] : [userId]
    );
    const targetMem = memRows[0];
    if (!targetMem) {
      throw new VipServiceError(
        404,
        'NO_MEMBERSHIP_TO_RENEW',
        'No eligible VIP membership found on this account to renew.'
      );
    }
    if (targetMem.status === 'refunded' || targetMem.status === 'suspended') {
      throw new VipServiceError(
        403,
        'MEMBERSHIP_CANNOT_RENEW',
        `Cannot renew a ${targetMem.status} VIP membership.`
      );
    }
    renewalTargetId = targetMem.membership_id;
  }

  // Optional Coin-Based VIP Purchase — strictly disabled unless Finance Admin approves a coin price
  if (params.providerKey === 'wallet_coins') {
    if (!plan.allowCoinPurchase || !plan.coinPrice || plan.coinPrice <= 0) {
      throw new VipServiceError(
        403,
        'COIN_VIP_PURCHASE_NOT_APPROVED',
        'Coin-based purchase is not approved for this VIP plan. Use an approved payment provider.'
      );
    }

    const orderId = genVipId('ORD_VIP');
    const purchaseId = genVipId('PUR_VIP');
    const deduction = await deductCoins({
      userId,
      amount: plan.coinPrice,
      transactionType: 'feature_spend',
      referenceId: purchaseId,
      idempotencyKey: cleanIdem ? `vip_coin_${cleanIdem}` : `vip_coin_${orderId}`,
      description: `VIP ${orderType}: ${plan.planName} (${plan.durationDays}d)`,
      metadata: {
        module: '7.7',
        planId: plan.planId,
        orderType,
        vipLevel: plan.vipLevel,
      },
    });

    if (!deduction.success) {
      throw new VipServiceError(
        400,
        deduction.code || 'INSUFFICIENT_COINS',
        deduction.error || 'Insufficient coins in existing wallet.'
      );
    }

    const settled = await withTransaction(async (client) => {
      const ordRow = (
        await client.query(
          `INSERT INTO popolive.vip_membership_orders (
             order_id, purchase_id, idempotency_key, user_id, plan_id, plan_name, vip_level,
             order_type, renewal_target_membership_id, provider_key, platform,
             amount, currency, coins_charged, duration_days, auto_renew_consent, status
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'wallet_coins',$10,0,'USD',$11,$12,FALSE,'pending')
           RETURNING *`,
          [
            orderId,
            purchaseId,
            cleanIdem,
            userId,
            plan.planId,
            plan.planName,
            plan.vipLevel,
            orderType,
            renewalTargetId,
            platform,
            plan.coinPrice,
            plan.durationDays,
          ]
        )
      ).rows[0];

      return settleVerifiedVipOrderInTx(client, {
        orderRow: ordRow,
        plan,
        providerDisplayName: 'Popo Coins Wallet',
        paymentReference: deduction.transaction.transactionId,
        coinsCharged: plan.coinPrice,
      });
    });

    await invalidateVipCaches(userId);
    return {
      deduplicated: false,
      activatedImmediately: true,
      order: settled.order,
      plan,
      provider: { providerKey: 'wallet_coins', displayName: 'Popo Coins Wallet', isSandbox: false },
      membership: settled.membership,
      receipt: settled.receipt,
      message: `${plan.planName} activated using approved wallet coin deduction.`,
    };
  }

  // Real-currency provider check (shared with Module 7.6 payment_provider_configs)
  const providers = await listPaymentProviders();
  const provider = providers.find((p) => p.providerKey === params.providerKey && p.isActive);
  if (!provider) {
    throw new VipServiceError(404, 'PAYMENT_PROVIDER_NOT_FOUND', 'Selected payment provider is unavailable.');
  }

  if (!provider.isReadyForPayment || provider.configurationStatus === 'credentials_pending') {
    throw new VipServiceError(
      503,
      'PROVIDER_CREDENTIALS_PENDING',
      `${provider.displayName} requires live merchant gateway credentials before real VIP charges can be processed.`
    );
  }

  const orderId = genVipId('ORD_VIP');
  const purchaseId = genVipId('PUR_VIP');
  const chargeAmount = orderType === 'renewal' ? plan.renewalPriceAmount : plan.priceAmount;
  const allowAutoRenew = Boolean(params.autoRenewConsent && !provider.isSandbox);

  const inserted = await withTransaction(async (client) => {
    const row = (
      await client.query(
        `INSERT INTO popolive.vip_membership_orders (
           order_id, purchase_id, idempotency_key, user_id, plan_id, plan_name, vip_level,
           order_type, renewal_target_membership_id, provider_key, platform,
           amount, currency, duration_days, auto_renew_consent, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')
         RETURNING *`,
        [
          orderId,
          purchaseId,
          cleanIdem,
          userId,
          plan.planId,
          plan.planName,
          plan.vipLevel,
          orderType,
          renewalTargetId,
          provider.providerKey,
          platform,
          chargeAmount.toFixed(2),
          plan.currency,
          plan.durationDays,
          allowAutoRenew || Boolean(params.autoRenewConsent),
        ]
      )
    ).rows[0];

    await emitVipRealtimeEvent(client, userId, 'vip:purchase_pending', {
      orderId,
      purchaseId,
      planId: plan.planId,
      planName: plan.planName,
      orderType,
      amount: chargeAmount,
      currency: plan.currency,
      providerKey: provider.providerKey,
      status: 'pending',
    });

    return mapOrderRow(row);
  });

  await invalidateVipCaches(userId);
  return {
    deduplicated: false,
    activatedImmediately: false,
    order: inserted,
    plan,
    provider,
    membership: null,
    receipt: null,
    message: `VIP order ${orderId} created as pending. Complete verified provider payment to activate.`,
  };
}

// -----------------------------------------------------------------------------
// 5. Verified Webhook Handler & Sandbox Simulator
// -----------------------------------------------------------------------------
export async function handleVipWebhook(params: {
  providerKey: string;
  eventId: string;
  eventType: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled';
  orderId: string;
  paymentReference: string;
  amount: number | string;
  currency: string;
  signature: string | null | undefined;
}): Promise<{
  success: boolean;
  deduplicated: boolean;
  status: string;
  order: VipOrderRecord;
  membership: VipMembershipRecord | null;
  receipt: VipReceiptRecord | null;
  message: string;
}> {
  const providerKey = (params.providerKey || '').trim();
  const eventId = (params.eventId || '').trim();
  const orderId = (params.orderId || '').trim();
  const paymentReference = (params.paymentReference || '').trim() || `REF_${eventId}`;
  const currency = String(params.currency || 'USD').toUpperCase();
  const numericAmount = Number(params.amount);

  if (!providerKey || !eventId || !orderId || !Number.isFinite(numericAmount)) {
    throw new VipServiceError(400, 'INVALID_WEBHOOK_PAYLOAD', 'Missing required VIP webhook fields.');
  }

  const validSig = verifyTopupWebhookSignature(
    {
      providerKey,
      eventId,
      orderId,
      eventType: params.eventType,
      amount: numericAmount,
      currency,
    },
    params.signature
  );
  if (!validSig) {
    throw new VipServiceError(
      403,
      'INVALID_WEBHOOK_SIGNATURE',
      'Rejected VIP webhook: Cryptographic HMAC signature missing or invalid.'
    );
  }

  const providers = await listPaymentProviders();
  const provider = providers.find((p) => p.providerKey === providerKey);
  if (!provider) {
    throw new VipServiceError(404, 'PAYMENT_PROVIDER_NOT_FOUND', 'Unknown payment provider.');
  }
  if (!provider.isReadyForPayment || provider.configurationStatus === 'credentials_pending') {
    throw new VipServiceError(
      503,
      'PROVIDER_CREDENTIALS_PENDING',
      `Live webhook blocked: ${provider.displayName} credentials are pending configuration.`
    );
  }

  const result = await withTransaction(async (client) => {
    const digest = crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');
    const insertedEvent = (
      await client.query(
        `INSERT INTO popolive.vip_webhook_events (event_id, provider_key, order_id, payload_digest, processing_status)
         VALUES ($1, $2, $3, $4, 'processing')
         ON CONFLICT (provider_key, event_id) DO NOTHING
         RETURNING event_id`,
        [eventId, providerKey, orderId, digest]
      )
    ).rows;

    const orderRows = (
      await client.query(
        `SELECT * FROM popolive.vip_membership_orders WHERE order_id = $1 LIMIT 1 FOR UPDATE`,
        [orderId]
      )
    ).rows;
    const orderRow = orderRows[0];
    if (!orderRow) {
      throw new VipServiceError(404, 'VIP_ORDER_NOT_FOUND', `VIP order "${orderId}" was not found.`);
    }

    if (orderRow.provider_key !== providerKey) {
      throw new VipServiceError(400, 'PROVIDER_MISMATCH', 'Webhook provider does not match VIP order.');
    }

    if (insertedEvent.length === 0 || orderRow.status === 'verified') {
      const memRow = (
        await client.query(`SELECT * FROM popolive.vip_membership_records WHERE order_id = $1 LIMIT 1`, [
          orderId,
        ])
      ).rows[0];
      const rcpRow = (
        await client.query(`SELECT * FROM popolive.vip_receipts WHERE order_id = $1 LIMIT 1`, [
          orderId,
        ])
      ).rows[0];
      return {
        success: orderRow.status === 'verified',
        deduplicated: true,
        status: orderRow.status,
        order: mapOrderRow(orderRow),
        membership: memRow ? mapMembershipRow(memRow) : null,
        receipt: rcpRow ? mapReceiptRow(rcpRow) : null,
        message: 'Duplicate VIP webhook ignored (idempotent replay protection).',
      };
    }

    if (params.eventType === 'payment_failed' || params.eventType === 'payment_cancelled') {
      const nextStatus = params.eventType === 'payment_cancelled' ? 'cancelled' : 'failed';
      const failedRow = (
        await client.query(
          `UPDATE popolive.vip_membership_orders
           SET status = $2,
               failure_reason = $3,
               payment_reference = $4,
               updated_at = NOW()
           WHERE order_id = $1
           RETURNING *`,
          [orderId, nextStatus, `Provider reported ${params.eventType}`, paymentReference]
        )
      ).rows[0];

      await client.query(
        `UPDATE popolive.vip_webhook_events SET processing_status = 'processed' WHERE provider_key = $1 AND event_id = $2`,
        [providerKey, eventId]
      );

      await emitVipRealtimeEvent(client, String(orderRow.user_id), 'vip:benefits_updated', {
        userId: String(orderRow.user_id),
        orderId,
        orderStatus: nextStatus,
        hasActiveVip: false,
      });

      return {
        success: false,
        deduplicated: false,
        status: nextStatus,
        order: mapOrderRow(failedRow),
        membership: null,
        receipt: null,
        message: `VIP payment ${nextStatus}; ZERO VIP membership or benefits activated.`,
      };
    }

    // Strict Amount & Currency Validation
    const expectedAmount = Number(orderRow.amount);
    const expectedCurrency = String(orderRow.currency || 'USD').toUpperCase();
    if (Math.abs(expectedAmount - numericAmount) > 0.009 || expectedCurrency !== currency) {
      throw new VipServiceError(
        400,
        'AMOUNT_OR_CURRENCY_MISMATCH',
        `Expected ${expectedAmount.toFixed(2)} ${expectedCurrency}, got ${numericAmount.toFixed(2)} ${currency}.`
      );
    }

    if (orderRow.expires_at && new Date(orderRow.expires_at).getTime() < Date.now()) {
      throw new VipServiceError(410, 'VIP_ORDER_EXPIRED', 'VIP checkout order has expired.');
    }

    const plan = await getVipPlanById(orderRow.plan_id, { includeInactive: true });
    const settled = await settleVerifiedVipOrderInTx(client, {
      orderRow,
      plan,
      providerDisplayName: provider.displayName,
      paymentReference,
    });

    await client.query(
      `UPDATE popolive.vip_webhook_events SET processing_status = 'processed' WHERE provider_key = $1 AND event_id = $2`,
      [providerKey, eventId]
    );

    return {
      success: true,
      deduplicated: false,
      status: 'verified',
      order: settled.order,
      membership: settled.membership,
      receipt: settled.receipt,
      message: `${plan.planName} verified & activated until ${settled.membership.expiryDate}.`,
    };
  });

  await invalidateVipCaches(result.order.userId);
  return result;
}

export async function triggerVipSandboxAction(params: {
  orderId: string;
  userId: string;
  outcome: 'succeed' | 'fail';
}): Promise<ReturnType<typeof handleVipWebhook>> {
  const canonicalUserId = await resolveCanonicalVipUserId(params.userId);
  const rows = await query<any>(
    `SELECT * FROM popolive.vip_membership_orders WHERE order_id = $1 LIMIT 1`,
    [params.orderId]
  );
  const orderRow = rows[0];
  if (!orderRow) {
    throw new VipServiceError(404, 'VIP_ORDER_NOT_FOUND', 'VIP order not found.');
  }
  if (orderRow.user_id !== canonicalUserId) {
    throw new VipServiceError(403, 'FORBIDDEN', 'You cannot modify another user VIP checkout order.');
  }
  if (orderRow.provider_key !== 'sandbox_verified') {
    throw new VipServiceError(
      403,
      'SANDBOX_ONLY',
      'Sandbox trigger strictly applies only to sandbox_verified orders.'
    );
  }

  const eventId = `EVT_VIP_${params.outcome.toUpperCase()}_${orderRow.order_id}_${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
  const eventType = params.outcome === 'fail' ? 'payment_failed' : 'payment_succeeded';
  const sig = computeWebhookSignatureDigest({
    providerKey: 'sandbox_verified',
    eventId,
    orderId: orderRow.order_id,
    eventType,
    amount: orderRow.amount,
    currency: orderRow.currency,
  });

  return handleVipWebhook({
    providerKey: 'sandbox_verified',
    eventId,
    eventType,
    orderId: orderRow.order_id,
    paymentReference: `SBX_VIP_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    amount: orderRow.amount,
    currency: orderRow.currency,
    signature: sig,
  });
}

// -----------------------------------------------------------------------------
// 6. User Cancel, Paginated History & Receipts
// -----------------------------------------------------------------------------
export async function cancelUserVipMembership(params: {
  actor: WalletActorContext;
  userId: string;
  membershipId?: string | null;
  cancelMode?: 'immediate' | 'auto_renew_only';
  reason?: string;
}): Promise<{ membership: VipMembershipRecord; statusProfile: ActiveUserVipProfile }> {
  const targetUserId = await resolveCanonicalVipUserId(params.userId);
  if (!canAccessPrivateWallet(params.actor, targetUserId, false) && !params.actor.isFinanceAdmin) {
    throw new VipServiceError(403, 'FORBIDDEN', 'You can only manage your own VIP membership.');
  }

  const membership = await withTransaction(async (client) => {
    const rows = (
      await client.query(
        params.membershipId
          ? `SELECT * FROM popolive.vip_membership_records WHERE membership_id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`
          : `SELECT * FROM popolive.vip_membership_records WHERE user_id = $1 AND status = 'active' ORDER BY vip_level DESC LIMIT 1 FOR UPDATE`,
        params.membershipId ? [params.membershipId, targetUserId] : [targetUserId]
      )
    ).rows;

    const current = rows[0];
    if (!current) {
      throw new VipServiceError(404, 'VIP_MEMBERSHIP_NOT_FOUND', 'Active VIP membership not found.');
    }

    if (params.cancelMode === 'auto_renew_only') {
      const upd = (
        await client.query(
          `UPDATE popolive.vip_membership_records
           SET auto_renew_enabled = FALSE,
               updated_at = NOW()
           WHERE membership_id = $1
           RETURNING *`,
          [current.membership_id]
        )
      ).rows[0];
      return mapMembershipRow(upd);
    }

    const upd = (
      await client.query(
        `UPDATE popolive.vip_membership_records
         SET status = 'cancelled',
             auto_renew_enabled = FALSE,
             cancelled_at = NOW(),
             status_reason = $2,
             updated_at = NOW()
         WHERE membership_id = $1
         RETURNING *`,
        [current.membership_id, params.reason || 'Cancelled by account owner']
      )
    ).rows[0];

    await syncUserVipToAnimationsTableInTx(client, {
      userId: targetUserId,
      active: false,
      membershipId: current.membership_id,
      status: 'revoked',
      actor: params.actor.actorId || targetUserId,
    });

    await emitVipRealtimeEvent(client, targetUserId, 'vip:membership_cancelled', {
      membershipId: current.membership_id,
      planId: current.plan_id,
      planName: current.plan_name,
      status: 'cancelled',
    });

    await emitVipRealtimeEvent(client, targetUserId, 'vip:benefits_updated', {
      userId: targetUserId,
      hasActiveVip: false,
      vipLevel: 0,
      status: 'cancelled',
    });

    return mapMembershipRow(upd);
  });

  await invalidateVipCaches(targetUserId);
  const statusProfile = await resolveActiveUserVipProfile(targetUserId);
  return { membership, statusProfile };
}

export async function getVipMembershipHistory(params: {
  actor: WalletActorContext;
  userId: string;
  statusFilter?: string;
  page?: number;
  limit?: number;
  isPreviewDemo?: boolean;
}): Promise<{
  records: VipMembershipRecord[];
  orders: VipOrderRecord[];
  total: number;
  page: number;
  limit: number;
}> {
  const targetUserId = await resolveCanonicalVipUserId(params.userId);
  if (!canAccessPrivateVipRecord(params.actor, targetUserId, Boolean(params.isPreviewDemo))) {
    throw new VipServiceError(403, 'FORBIDDEN', 'Cannot view another user VIP membership history.');
  }

  await syncExpiredVipMemberships(targetUserId);

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;
  const cleanStatus =
    params.statusFilter && params.statusFilter !== 'all' ? params.statusFilter.trim().toLowerCase() : null;

  const whereParts = ['m.user_id = $1'];
  const vals: any[] = [targetUserId];
  if (cleanStatus) {
    vals.push(cleanStatus);
    whereParts.push(`m.status = $${vals.length}`);
  }
  const whereClause = whereParts.join(' AND ');

  const [countRes, rows, orderRows] = await Promise.all([
    query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM popolive.vip_membership_records m WHERE ${whereClause}`,
      vals
    ),
    query<any>(
      `SELECT m.*, r.receipt_id
       FROM popolive.vip_membership_records m
       LEFT JOIN popolive.vip_receipts r ON r.membership_id = m.membership_id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
      [...vals, limit, offset]
    ),
    query<any>(
      `SELECT * FROM popolive.vip_membership_orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [targetUserId]
    ),
  ]);

  return {
    records: rows.map(mapMembershipRow),
    orders: orderRows.map(mapOrderRow),
    total: countRes[0]?.total || 0,
    page,
    limit,
  };
}

export async function getVipReceiptById(params: {
  actor: WalletActorContext;
  receiptId: string;
  isPreviewDemo?: boolean;
}): Promise<VipReceiptRecord> {
  const rows = await query<any>(
    `SELECT * FROM popolive.vip_receipts WHERE receipt_id = $1 OR order_id = $1 LIMIT 1`,
    [params.receiptId]
  );
  if (!rows[0]) {
    throw new VipServiceError(404, 'VIP_RECEIPT_NOT_FOUND', 'VIP receipt not found.');
  }
  const receipt = mapReceiptRow(rows[0]);
  if (!canAccessPrivateVipRecord(params.actor, receipt.userId, Boolean(params.isPreviewDemo))) {
    throw new VipServiceError(403, 'FORBIDDEN', 'Cannot view another user VIP receipt.');
  }
  return receipt;
}

// -----------------------------------------------------------------------------
// 7. Finance Admin VIP Management (Plans, Assets, Status Overrides, Refunds)
// -----------------------------------------------------------------------------
export async function adminUpsertVipPlan(params: {
  actorRole: string;
  actorId: string;
  ipAddress?: string | null;
  planId?: string;
  planTier: VipPlanTier;
  vipLevel: number;
  planName: string;
  planNameUr?: string;
  description?: string;
  descriptionUr?: string;
  durationDays: number;
  priceAmount: number;
  renewalPriceAmount?: number | null;
  currency?: string;
  allowCoinPurchase?: boolean;
  coinPrice?: number | null;
  badgeLabel: string;
  badgeAssetUrl?: string;
  profileFrameAssetUrl?: string;
  nameDecorationStyle?: string;
  themeKey?: string;
  entranceId?: string | null;
  entranceAnimationRef?: string | null;
  benefitKeys?: string[];
  benefitsConfig?: Record<string, any>;
  specialEventAccess?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<VipPlanRecord> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new VipServiceError(
      403,
      'FINANCE_ADMIN_REQUIRED',
      'Forbidden: Only authorized finance administrators may configure VIP plans & pricing.'
    );
  }

  if (
    !params.planName?.trim() ||
    !Number.isInteger(params.durationDays) ||
    params.durationDays <= 0 ||
    !(Number(params.priceAmount) > 0)
  ) {
    throw new VipServiceError(400, 'INVALID_VIP_PLAN_INPUT', 'Valid planName, durationDays, and priceAmount are required.');
  }

  const slug =
    params.planId?.trim() ||
    `vip_${params.planName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 32)}_${Date.now().toString().slice(-4)}`;

  const saved = await withTransaction(async (client) => {
    const before = (
      await client.query(`SELECT * FROM popolive.vip_plans WHERE plan_id = $1 LIMIT 1`, [slug])
    ).rows[0];

    const row = (
      await client.query(
        `INSERT INTO popolive.vip_plans (
           plan_id, plan_tier, vip_level, plan_name, plan_name_ur, description, description_ur,
           duration_days, price_amount, renewal_price_amount, currency, allow_coin_purchase, coin_price,
           badge_label, badge_asset_url, profile_frame_asset_url, name_decoration_style, theme_key,
           entrance_id, entrance_animation_ref, benefit_keys, benefits_config,
           special_event_access, is_popular, is_active, display_order, created_by, updated_by
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,
           $8,$9,$10,$11,$12,$13,
           $14,$15,$16,$17,$18,
           $19,$20,$21::jsonb,$22::jsonb,
           $23,$24,$25,$26,$27,$27
         )
         ON CONFLICT (plan_id) DO UPDATE SET
           plan_tier = EXCLUDED.plan_tier,
           vip_level = EXCLUDED.vip_level,
           plan_name = EXCLUDED.plan_name,
           plan_name_ur = EXCLUDED.plan_name_ur,
           description = EXCLUDED.description,
           description_ur = EXCLUDED.description_ur,
           duration_days = EXCLUDED.duration_days,
           price_amount = EXCLUDED.price_amount,
           renewal_price_amount = EXCLUDED.renewal_price_amount,
           currency = EXCLUDED.currency,
           allow_coin_purchase = EXCLUDED.allow_coin_purchase,
           coin_price = EXCLUDED.coin_price,
           badge_label = EXCLUDED.badge_label,
           badge_asset_url = EXCLUDED.badge_asset_url,
           profile_frame_asset_url = EXCLUDED.profile_frame_asset_url,
           name_decoration_style = EXCLUDED.name_decoration_style,
           theme_key = EXCLUDED.theme_key,
           entrance_id = EXCLUDED.entrance_id,
           entrance_animation_ref = EXCLUDED.entrance_animation_ref,
           benefit_keys = EXCLUDED.benefit_keys,
           benefits_config = EXCLUDED.benefits_config,
           special_event_access = EXCLUDED.special_event_access,
           is_popular = EXCLUDED.is_popular,
           is_active = EXCLUDED.is_active,
           display_order = EXCLUDED.display_order,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
         RETURNING *`,
        [
          slug,
          params.planTier,
          Math.max(1, Math.min(10, Math.round(params.vipLevel))),
          params.planName.trim(),
          (params.planNameUr || params.planName).trim(),
          params.description || '',
          params.descriptionUr || params.description || '',
          params.durationDays,
          Number(params.priceAmount).toFixed(2),
          params.renewalPriceAmount && Number(params.renewalPriceAmount) > 0
            ? Number(params.renewalPriceAmount).toFixed(2)
            : Number(params.priceAmount).toFixed(2),
          (params.currency || 'USD').toUpperCase(),
          Boolean(params.allowCoinPurchase && params.coinPrice && params.coinPrice > 0),
          params.allowCoinPurchase && params.coinPrice && params.coinPrice > 0
            ? Math.round(params.coinPrice)
            : null,
          params.badgeLabel.trim(),
          params.badgeAssetUrl || before?.badge_asset_url || '/assets/gifts/07_07_vip.png',
          params.profileFrameAssetUrl ||
            before?.profile_frame_asset_url ||
            '/assets/gifts/entrances/entrance_vip.png',
          params.nameDecorationStyle || before?.name_decoration_style || 'gold_shimmer',
          params.themeKey || before?.theme_key || 'cosmic_royale',
          params.entranceId !== undefined ? params.entranceId : before?.entrance_id || 'ent_vip',
          params.entranceAnimationRef ||
            before?.entrance_animation_ref ||
            '/assets/gifts/entrances/entrance_vip.json',
          JSON.stringify(
            Array.isArray(params.benefitKeys) && params.benefitKeys.length > 0
              ? params.benefitKeys
              : before?.benefit_keys || ['vip_profile_badge', 'special_chat_badge']
          ),
          JSON.stringify(params.benefitsConfig || before?.benefits_config || {}),
          Boolean(params.specialEventAccess),
          Boolean(params.isPopular),
          params.isActive !== undefined ? Boolean(params.isActive) : true,
          params.displayOrder ?? before?.display_order ?? 10,
          params.actorId,
        ]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.vip_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1,'vip_plan',$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9)`,
      [
        genVipId('VIPAUD'),
        slug,
        before ? 'update_vip_plan' : 'create_vip_plan',
        params.actorId,
        params.actorRole,
        `${before ? 'Updated' : 'Created'} VIP plan ${params.planName} ($${Number(params.priceAmount).toFixed(2)} / ${params.durationDays}d)`,
        before ? JSON.stringify(before) : null,
        JSON.stringify(row),
        params.ipAddress || null,
      ]
    );
    return row;
  });

  await invalidateVipCaches();
  return getVipPlanById(saved.plan_id, { includeInactive: true });
}

export async function adminToggleVipPlanStatus(params: {
  actorRole: string;
  actorId: string;
  planId: string;
  isActive: boolean;
  ipAddress?: string | null;
}): Promise<VipPlanRecord> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new VipServiceError(403, 'FINANCE_ADMIN_REQUIRED', 'Finance admin access required.');
  }

  await withTransaction(async (client) => {
    const before = (
      await client.query(`SELECT * FROM popolive.vip_plans WHERE plan_id = $1 LIMIT 1`, [params.planId])
    ).rows[0];
    if (!before) {
      throw new VipServiceError(404, 'VIP_PLAN_NOT_FOUND', 'VIP plan not found.');
    }
    const after = (
      await client.query(
        `UPDATE popolive.vip_plans SET is_active = $2, updated_by = $3, updated_at = NOW() WHERE plan_id = $1 RETURNING *`,
        [params.planId, Boolean(params.isActive), params.actorId]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.vip_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1,'vip_plan',$2,'toggle_vip_plan_status',$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,
      [
        genVipId('VIPAUD'),
        params.planId,
        params.actorId,
        params.actorRole,
        `${params.isActive ? 'Activated' : 'Deactivated'} VIP plan ${params.planId}`,
        JSON.stringify({ is_active: before.is_active }),
        JSON.stringify({ is_active: after.is_active }),
        params.ipAddress || null,
      ]
    );
  });

  await invalidateVipCaches();
  return getVipPlanById(params.planId, { includeInactive: true });
}

export async function adminQueryVipMemberships(params: {
  actorRole: string;
  userId?: string;
  status?: string;
  limit?: number;
}): Promise<{
  memberships: VipMembershipRecord[];
  orders: VipOrderRecord[];
  auditLogs: any[];
  summary: {
    activeCount: number;
    expiredCount: number;
    cancelledCount: number;
    suspendedCount: number;
    refundedCount: number;
    totalVerifiedUsd: number;
  };
}> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new VipServiceError(
      403,
      'FINANCE_ADMIN_REQUIRED',
      'Forbidden: Only authorized finance administrators may manage VIP records & orders.'
    );
  }

  await syncExpiredVipMemberships();

  const limit = Math.min(100, Math.max(1, params.limit || 40));
  const whereParts: string[] = [];
  const vals: any[] = [];

  if (params.userId && params.userId.trim()) {
    vals.push(`%${params.userId.trim()}%`);
    whereParts.push(`(m.user_id ILIKE $${vals.length} OR u.poppo_id ILIKE $${vals.length} OR u.nickname ILIKE $${vals.length})`);
  }
  if (params.status && params.status !== 'all') {
    vals.push(params.status.trim().toLowerCase());
    whereParts.push(`m.status = $${vals.length}`);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
  const [memRows, ordRows, auditRows, summaryRows] = await Promise.all([
    query<any>(
      `SELECT m.*, u.nickname, u.poppo_id, r.receipt_id
       FROM popolive.vip_membership_records m
       LEFT JOIN popolive.users u ON u.id::text = m.user_id
       LEFT JOIN popolive.vip_receipts r ON r.membership_id = m.membership_id
       ${whereClause}
       ORDER BY m.updated_at DESC
       LIMIT $${vals.length + 1}`,
      [...vals, limit]
    ),
    query<any>(
      `SELECT * FROM popolive.vip_membership_orders
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    ),
    query<any>(
      `SELECT * FROM popolive.vip_admin_audit_logs ORDER BY created_at DESC LIMIT 30`
    ),
    query<any>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')::int AS active_cnt,
         COUNT(*) FILTER (WHERE status = 'expired')::int AS expired_cnt,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_cnt,
         COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended_cnt,
         COUNT(*) FILTER (WHERE status = 'refunded')::int AS refunded_cnt
       FROM popolive.vip_membership_records`
    ),
  ]);

  const revRes = await query<any>(
    `SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS verified_usd
     FROM popolive.vip_membership_orders WHERE status = 'verified'`
  );

  return {
    memberships: memRows.map(mapMembershipRow),
    orders: ordRows.map(mapOrderRow),
    auditLogs: auditRows,
    summary: {
      activeCount: summaryRows[0]?.active_cnt || 0,
      expiredCount: summaryRows[0]?.expired_cnt || 0,
      cancelledCount: summaryRows[0]?.cancelled_cnt || 0,
      suspendedCount: summaryRows[0]?.suspended_cnt || 0,
      refundedCount: summaryRows[0]?.refunded_cnt || 0,
      totalVerifiedUsd: Number(revRes[0]?.verified_usd || 0),
    },
  };
}

export async function adminUpdateMembershipStatus(params: {
  actorRole: string;
  actorId: string;
  membershipId: string;
  action: 'suspend' | 'expire' | 'cancel' | 'reactivate';
  reason?: string;
  ipAddress?: string | null;
}): Promise<VipMembershipRecord> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new VipServiceError(403, 'FINANCE_ADMIN_REQUIRED', 'Finance admin access required.');
  }

  let affectedUserId = '';
  const updated = await withTransaction(async (client) => {
    const rows = (
      await client.query(`SELECT * FROM popolive.vip_membership_records WHERE membership_id = $1 LIMIT 1 FOR UPDATE`, [
        params.membershipId,
      ])
    ).rows;
    const prev = rows[0];
    if (!prev) {
      throw new VipServiceError(404, 'VIP_MEMBERSHIP_NOT_FOUND', 'VIP membership record not found.');
    }
    affectedUserId = String(prev.user_id);

    const statusMap: Record<string, VipMembershipStatus> = {
      suspend: 'suspended',
      expire: 'expired',
      cancel: 'cancelled',
      reactivate: 'active',
    };
    const nextStatus = statusMap[params.action] || 'suspended';

    const upd = (
      await client.query(
        `UPDATE popolive.vip_membership_records
         SET status = $2::text,
             suspended_at = CASE WHEN $2::text = 'suspended' THEN NOW() ELSE suspended_at END,
             cancelled_at = CASE WHEN $2::text = 'cancelled' THEN NOW() ELSE cancelled_at END,
             expiry_date = CASE
               WHEN $2::text = 'expired' THEN LEAST(COALESCE(expiry_date, NOW()), NOW())
               WHEN $2::text = 'active' AND (expiry_date IS NULL OR expiry_date <= NOW()) THEN NOW() + ($3 || ' days')::interval
               ELSE expiry_date
             END,
             status_reason = $4,
             updated_at = NOW()
         WHERE membership_id = $1
         RETURNING *`,
        [
          params.membershipId,
          nextStatus,
          String(prev.duration_days || 30),
          params.reason || `Admin action: ${params.action}`,
        ]
      )
    ).rows[0];

    await syncUserVipToAnimationsTableInTx(client, {
      userId: affectedUserId,
      active: nextStatus === 'active',
      membershipId: prev.membership_id,
      vipLevel: prev.vip_level,
      vipTier: prev.plan_tier,
      badgeLabel: prev.badge_label,
      specialEventAccess: prev.special_event_access,
      status: nextStatus === 'active' ? 'active' : nextStatus === 'expired' ? 'expired' : 'revoked',
      expiresAt: upd.expiry_date,
      actor: params.actorId,
    });

    await client.query(
      `INSERT INTO popolive.vip_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1,'vip_membership',$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9)`,
      [
        genVipId('VIPAUD'),
        params.membershipId,
        `admin_${params.action}_membership`,
        params.actorId,
        params.actorRole,
        params.reason || `Admin set status to ${nextStatus}`,
        JSON.stringify({ status: prev.status, expiry_date: prev.expiry_date }),
        JSON.stringify({ status: upd.status, expiry_date: upd.expiry_date }),
        params.ipAddress || null,
      ]
    );

    if (nextStatus === 'expired') {
      await emitVipRealtimeEvent(client, affectedUserId, 'vip:membership_expired', {
        membershipId: params.membershipId,
        status: 'expired',
      });
    } else if (nextStatus === 'cancelled' || nextStatus === 'suspended') {
      await emitVipRealtimeEvent(client, affectedUserId, 'vip:membership_cancelled', {
        membershipId: params.membershipId,
        status: nextStatus,
      });
    } else if (nextStatus === 'active') {
      await emitVipRealtimeEvent(client, affectedUserId, 'vip:membership_activated', {
        membershipId: params.membershipId,
        status: 'active',
        expiryDate: upd.expiry_date,
      });
    }
    await emitVipRealtimeEvent(client, affectedUserId, 'vip:benefits_updated', {
      userId: affectedUserId,
      hasActiveVip: nextStatus === 'active',
      vipLevel: nextStatus === 'active' ? parseInt(String(upd.vip_level), 10) : 0,
      status: nextStatus,
    });

    return mapMembershipRow(upd);
  });

  await invalidateVipCaches(affectedUserId);
  return updated;
}

export async function adminRefundVipOrder(params: {
  actorRole: string;
  actorId: string;
  orderId: string;
  reason?: string;
  ipAddress?: string | null;
}): Promise<{ order: VipOrderRecord; membership: VipMembershipRecord | null }> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw new VipServiceError(403, 'FINANCE_ADMIN_REQUIRED', 'Finance admin access required.');
  }

  let affectedUserId = '';
  const result = await withTransaction(async (client) => {
    const orderRow = (
      await client.query(`SELECT * FROM popolive.vip_membership_orders WHERE order_id = $1 LIMIT 1 FOR UPDATE`, [
        params.orderId,
      ])
    ).rows[0];
    if (!orderRow) {
      throw new VipServiceError(404, 'VIP_ORDER_NOT_FOUND', 'VIP order not found.');
    }
    if (orderRow.status === 'refunded') {
      throw new VipServiceError(409, 'ALREADY_REFUNDED', 'VIP order has already been refunded.');
    }
    if (orderRow.status !== 'verified') {
      throw new VipServiceError(400, 'ORDER_NOT_VERIFIED', 'Only verified VIP orders can be refunded.');
    }

    affectedUserId = String(orderRow.user_id);

    // If paid with approved coin purchase, refund coins back to existing wallet (0 host points)
    if (orderRow.provider_key === 'wallet_coins' && orderRow.coins_charged > 0) {
      await creditCoinsInTx(client, {
        userId: affectedUserId,
        amount: parseInt(String(orderRow.coins_charged), 10),
        transactionType: 'reversal',
        referenceId: orderRow.order_id,
        idempotencyKey: `vip_coin_refund_${orderRow.order_id}`,
        description: `Refund VIP ${orderRow.plan_name}: ${params.reason || 'Admin refund'}`,
        createdBy: params.actorId,
      });
    }

    const updOrder = (
      await client.query(
        `UPDATE popolive.vip_membership_orders
         SET status = 'refunded', updated_at = NOW()
         WHERE order_id = $1 RETURNING *`,
        [orderRow.order_id]
      )
    ).rows[0];

    const updMem = (
      await client.query(
        `UPDATE popolive.vip_membership_records
         SET status = 'refunded',
             auto_renew_enabled = FALSE,
             refunded_at = NOW(),
             status_reason = $2,
             updated_at = NOW()
         WHERE order_id = $1
         RETURNING *`,
        [orderRow.order_id, params.reason || 'Verified VIP refund processed']
      )
    ).rows[0];

    await client.query(
      `UPDATE popolive.vip_receipts SET receipt_status = 'refunded' WHERE order_id = $1`,
      [orderRow.order_id]
    );

    await syncUserVipToAnimationsTableInTx(client, {
      userId: affectedUserId,
      active: false,
      membershipId: updMem?.membership_id || orderRow.order_id,
      status: 'revoked',
      actor: params.actorId,
    });

    await client.query(
      `INSERT INTO popolive.vip_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1,'vip_order',$2,'refund_vip_order',$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,
      [
        genVipId('VIPAUD'),
        orderRow.order_id,
        params.actorId,
        params.actorRole,
        params.reason || 'Finance admin refunded VIP purchase',
        JSON.stringify({ orderStatus: orderRow.status }),
        JSON.stringify({ orderStatus: 'refunded', membershipId: updMem?.membership_id || null }),
        params.ipAddress || null,
      ]
    );

    await emitVipRealtimeEvent(client, affectedUserId, 'vip:membership_cancelled', {
      orderId: orderRow.order_id,
      membershipId: updMem?.membership_id || null,
      status: 'refunded',
    });
    await emitVipRealtimeEvent(client, affectedUserId, 'vip:benefits_updated', {
      userId: affectedUserId,
      hasActiveVip: false,
      vipLevel: 0,
      status: 'refunded',
    });

    return {
      order: mapOrderRow(updOrder),
      membership: updMem ? mapMembershipRow(updMem) : null,
    };
  });

  await invalidateVipCaches(affectedUserId);
  return result;
}

export function canAccessPrivateVipRecord(
  actor: WalletActorContext,
  targetUserId: string,
  isPreviewDemo = false
): boolean {
  if (actor.isFinanceAdmin) return true;
  if (actor.user) {
    return actor.user.id === targetUserId || actor.user.poppo_id === targetUserId;
  }
  return canAccessPrivateWallet(actor, targetUserId, isPreviewDemo);
}

export function resolveVipTargetUser(
  actor: WalletActorContext,
  requestedUserId: string | null | undefined,
  isPreviewDemo: boolean
): { allowed: boolean; statusCode: number; errorCode?: string; error?: string; userId: string } {
  const reqId = (requestedUserId || '').trim();
  if (actor.user) {
    if (reqId && reqId !== actor.user.id && reqId !== actor.user.poppo_id && !actor.isFinanceAdmin) {
      return {
        allowed: false,
        statusCode: 403,
        errorCode: 'UNAUTHORIZED_VIP_USER',
        error: 'Cannot access or modify another user VIP membership.',
        userId: actor.user.id,
      };
    }
    return { allowed: true, statusCode: 200, userId: reqId || actor.user.id };
  }

  const candidateId =
    reqId ||
    (actor.actorId !== 'anonymous' ? actor.actorId : '') ||
    (isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : '');

  if (!candidateId || !canAccessPrivateWallet(actor, candidateId, isPreviewDemo)) {
    return {
      allowed: false,
      statusCode: actor.actorId === 'anonymous' && !isPreviewDemo ? 401 : 403,
      errorCode: 'VIP_ACCESS_DENIED',
      error: 'Authentication or active preview demo session is required.',
      userId: '',
    };
  }

  return { allowed: true, statusCode: 200, userId: candidateId };
}

export async function getVipOrderAndReceipt(params: {
  actor: WalletActorContext;
  orderId: string;
}): Promise<{ order: VipOrderRecord; receipt: VipReceiptRecord | null }> {
  const rows = await query<any>(
    `SELECT * FROM popolive.vip_membership_orders WHERE order_id = $1 LIMIT 1`,
    [params.orderId]
  );
  if (!rows[0]) {
    throw new VipServiceError(404, 'VIP_ORDER_NOT_FOUND', 'VIP order not found.');
  }
  const order = mapOrderRow(rows[0]);
  if (!canAccessPrivateVipRecord(params.actor, order.userId, false)) {
    throw new VipServiceError(403, 'FORBIDDEN', 'Cannot view another user VIP order.');
  }
  const rcpRows = await query<any>(
    `SELECT * FROM popolive.vip_receipts WHERE order_id = $1 LIMIT 1`,
    [order.orderId]
  );
  return {
    order,
    receipt: rcpRows[0] ? mapReceiptRow(rcpRows[0]) : null,
  };
}

