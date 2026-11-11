import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';
import { checkRateLimit } from '@/lib/auth';
import {
  creditCoinsInTx,
  emitWalletRealtimeEvent,
  ensureWalletLocked,
  generateTxId,
  getFinanceRules,
  getWalletSummary,
  isAuthorizedFinanceAdmin,
  logWalletAudit,
  mapWalletRow,
} from '@/lib/wallet';
import type { WalletActorContext } from '@/lib/walletAuth';
import { canAccessPrivateWallet } from '@/lib/walletAuth';

// =============================================================================
// Popo Live Phase 7 Module 7.6 — Complete Coins Top-up & Recharge Engine
// - Server-configured packages & pricing (NO client price/bonus override)
// - Honest multi-provider readiness (real credentials required vs HMAC Sandbox)
// - Cryptographic HMAC-SHA256 webhook verification + replay guard
// - Atomic coin crediting via creditCoinsInTx (NEVER credits host points)
// - Itemized receipts + order lifecycle + finance admin refund & audit logging
// =============================================================================

export type TopupOrderStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'reversed';

export type TopupPlatform = 'web' | 'android' | 'ios';

export const TOPUP_FORBIDDEN_OVERRIDE_KEYS = [
  'amount',
  'priceAmount',
  'price',
  'currency',
  'baseCoins',
  'bonusCoins',
  'totalCoins',
  'coins',
  'status',
  'verified',
  'forceSuccess',
  'receiptId',
  'coinTransactionId',
  'hostPoints',
  'pointsCredited',
];

const PACKAGES_CACHE_KEY = 'topup:packages:public:v1';

export interface CoinPackageRecord {
  packageId: string;
  packageName: string;
  packageNameUr: string | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceAmount: number;
  currency: string;
  iconUrl: string;
  badgeText: string | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  platformProductIdIos: string | null;
  platformProductIdAndroid: string | null;
  updatedAt: string;
}

export interface PaymentProviderRecord {
  providerKey: string;
  displayName: string;
  displayNameUr: string | null;
  providerType: string;
  supportedPlatforms: string[];
  configurationStatus: 'ready_sandbox' | 'live_configured' | 'credentials_pending';
  isReadyForPayment: boolean;
  isSandbox: boolean;
  isActive: boolean;
  displayOrder: number;
  notes: string | null;
}

export interface TopupOrderRecord {
  orderId: string;
  userId: string;
  packageId: string;
  packageName: string;
  providerKey: string;
  platform: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  status: TopupOrderStatus;
  providerPaymentRef: string | null;
  checkoutToken: string | null;
  idempotencyKey: string | null;
  coinTransactionId: string | null;
  receiptId: string | null;
  failureCode: string | null;
  failureReason: string | null;
  refundReference: string | null;
  refundReason: string | null;
  refundedBy: string | null;
  metadata: Record<string, any>;
  verifiedAt: string | null;
  expiresAt: string;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopupReceiptRecord {
  receiptId: string;
  orderId: string;
  userId: string;
  packageId: string;
  packageName: string;
  providerKey: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  coinTransactionId: string;
  providerPaymentRef: string | null;
  status: 'issued' | 'refunded' | 'voided';
  issuedAt: string;
}

function getTopupWebhookSecret(): string {
  return (
    process.env.TOPUP_WEBHOOK_SECRET ||
    process.env.WALLET_TOPUP_SECRET ||
    'popo_live_phase7_topup_secret_key_prod'
  );
}

export function computeWebhookSignatureDigest(params: {
  providerKey: string;
  eventId: string;
  orderId: string;
  eventType: string;
  amount: number | string;
  currency: string;
}): string {
  const canonical = `${params.providerKey}:${params.eventId}:${params.orderId}:${params.eventType}:${Number(
    params.amount
  ).toFixed(2)}:${String(params.currency || 'USD').toUpperCase()}`;
  return crypto.createHmac('sha256', getTopupWebhookSecret()).update(canonical).digest('hex');
}

export function verifyTopupWebhookSignature(
  params: {
    providerKey: string;
    eventId: string;
    orderId: string;
    eventType: string;
    amount: number | string;
    currency: string;
  },
  providedSig: string | null | undefined
): boolean {
  if (!providedSig || typeof providedSig !== 'string') return false;
  const expected = computeWebhookSignatureDigest(params);
  try {
    return crypto.timingSafeEqual(Buffer.from(providedSig.trim()), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function detectTamperedTopupKeys(body: Record<string, any> | null | undefined): string | null {
  if (!body || typeof body !== 'object') return null;
  for (const key of TOPUP_FORBIDDEN_OVERRIDE_KEYS) {
    if (body[key] !== undefined) return key;
  }
  return null;
}

export function mapCoinPackageRow(row: any): CoinPackageRecord {
  return {
    packageId: row.package_id,
    packageName: row.package_name,
    packageNameUr: row.package_name_ur || null,
    baseCoins: parseInt(String(row.base_coins), 10),
    bonusCoins: parseInt(String(row.bonus_coins || 0), 10),
    totalCoins: parseInt(String(row.total_coins), 10),
    priceAmount: Number(row.price_amount),
    currency: row.currency || 'USD',
    iconUrl: row.icon_url || '/assets/gifts/07_06_top_up.png',
    badgeText: row.badge_text || null,
    isPopular: Boolean(row.is_popular),
    isActive: Boolean(row.is_active),
    displayOrder: parseInt(String(row.display_order || 100), 10),
    platformProductIdIos: row.platform_product_id_ios || null,
    platformProductIdAndroid: row.platform_product_id_android || null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function mapTopupOrderRow(row: any): TopupOrderRecord {
  return {
    orderId: row.order_id,
    userId: row.user_id,
    packageId: row.package_id,
    packageName: row.package_name,
    providerKey: row.provider_key,
    platform: row.platform || 'web',
    baseCoins: parseInt(String(row.base_coins), 10),
    bonusCoins: parseInt(String(row.bonus_coins || 0), 10),
    totalCoins: parseInt(String(row.total_coins), 10),
    amount: Number(row.amount),
    currency: row.currency || 'USD',
    status: row.status,
    providerPaymentRef: row.provider_payment_ref || null,
    checkoutToken: row.checkout_token || null,
    idempotencyKey: row.idempotency_key || null,
    coinTransactionId: row.coin_transaction_id || null,
    receiptId: row.receipt_id || null,
    failureCode: row.failure_code || null,
    failureReason: row.failure_reason || null,
    refundReference: row.refund_reference || null,
    refundReason: row.refund_reason || null,
    refundedBy: row.refunded_by || null,
    metadata: row.metadata || {},
    verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : new Date().toISOString(),
    refundedAt: row.refunded_at ? new Date(row.refunded_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function mapTopupReceiptRow(row: any): TopupReceiptRecord {
  return {
    receiptId: row.receipt_id,
    orderId: row.order_id,
    userId: row.user_id,
    packageId: row.package_id,
    packageName: row.package_name,
    providerKey: row.provider_key,
    baseCoins: parseInt(String(row.base_coins), 10),
    bonusCoins: parseInt(String(row.bonus_coins || 0), 10),
    totalCoins: parseInt(String(row.total_coins), 10),
    amount: Number(row.amount),
    currency: row.currency || 'USD',
    coinTransactionId: row.coin_transaction_id,
    providerPaymentRef: row.provider_payment_ref || null,
    status: row.status,
    issuedAt: row.issued_at ? new Date(row.issued_at).toISOString() : new Date().toISOString(),
  };
}

function resolveEnvProviderCredentials(providerKey: string): boolean {
  switch (providerKey) {
    case 'sandbox_verified':
      return true;
    case 'stripe_card':
      return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    case 'apple_iap':
      return Boolean(process.env.APP_STORE_SHARED_SECRET || process.env.APPLE_IAP_ISSUER_ID);
    case 'google_play':
      return Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
    case 'paypal':
      return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    case 'local_wallet':
      return Boolean(process.env.LOCAL_WALLET_API_KEY && process.env.LOCAL_WALLET_WEBHOOK_SECRET);
    default:
      return false;
  }
}

export function mapProviderConfigRow(row: any): PaymentProviderRecord {
  const isSandbox = Boolean(row.is_sandbox);
  const envConfigured = resolveEnvProviderCredentials(row.provider_key);
  const configStatus: PaymentProviderRecord['configurationStatus'] = isSandbox
    ? 'ready_sandbox'
    : envConfigured
    ? 'live_configured'
    : 'credentials_pending';

  return {
    providerKey: row.provider_key,
    displayName: row.display_name,
    displayNameUr: row.display_name_ur || null,
    providerType: row.provider_type,
    supportedPlatforms: Array.isArray(row.supported_platforms) ? row.supported_platforms : ['web'],
    configurationStatus: configStatus,
    isReadyForPayment: Boolean(row.is_active) && (isSandbox || envConfigured),
    isSandbox,
    isActive: Boolean(row.is_active),
    displayOrder: parseInt(String(row.display_order || 100), 10),
    notes: row.notes || null,
  };
}

export async function emitTopupRealtimeEvent(
  dbClient: any,
  userId: string,
  eventName: string,
  payload: Record<string, any>
) {
  await dbClient.query(
    `INSERT INTO popolive.topup_realtime_events (user_id, event_name, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventName, JSON.stringify(payload)]
  );
}

export async function listCoinPackages(options?: { includeInactive?: boolean }): Promise<CoinPackageRecord[]> {
  const includeInactive = Boolean(options?.includeInactive);
  if (!includeInactive) {
    const cached = await redisGet(PACKAGES_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignore stale cache
      }
    }
  }

  const rows = await query<any>(
    `SELECT * FROM popolive.coin_packages
     ${includeInactive ? '' : 'WHERE is_active = true'}
     ORDER BY display_order ASC, base_coins ASC`
  );
  const mapped = rows.map(mapCoinPackageRow);

  if (!includeInactive) {
    await redisSetWithTtl(PACKAGES_CACHE_KEY, JSON.stringify(mapped), 60);
  }
  return mapped;
}

export async function listPaymentProviders(platform?: string): Promise<PaymentProviderRecord[]> {
  const rows = await query<any>(
    `SELECT * FROM popolive.payment_provider_configs
     WHERE is_active = true
     ORDER BY display_order ASC`
  );
  const all = rows.map(mapProviderConfigRow);
  if (platform && ['web', 'android', 'ios'].includes(platform)) {
    return all.filter((p) => p.supportedPlatforms.includes(platform));
  }
  return all;
}

export function canAccessTopupUser(
  actor: WalletActorContext,
  targetUserId: string,
  isPreviewDemo: boolean
): boolean {
  return canAccessPrivateWallet(actor, targetUserId, isPreviewDemo);
}

export async function createTopupPaymentOrder(params: {
  userId: string;
  packageId: string;
  providerKey: string;
  platform?: TopupPlatform;
  idempotencyKey?: string | null;
  clientIp?: string | null;
}): Promise<{
  success: boolean;
  deduplicated?: boolean;
  order: TopupOrderRecord;
  provider: PaymentProviderRecord;
  checkoutSession: {
    orderId: string;
    providerKey: string;
    isSandbox: boolean;
    checkoutToken: string;
    amount: number;
    currency: string;
    totalCoins: number;
    expiresAt: string;
  };
}> {
  const { userId, packageId, providerKey, platform = 'web', idempotencyKey = null } = params;

  const rateCheck = await checkRateLimit(`topup_order_${userId}`, 30, 60);
  if (!rateCheck.allowed) {
    throw Object.assign(new Error('Too many top-up orders created in a short window. Please pause briefly.'), {
      code: 'TOPUP_RATE_LIMIT_EXCEEDED',
      status: 429,
    });
  }

  return withTransaction(async (client) => {
    const cleanIdem = idempotencyKey?.trim() || null;
    if (cleanIdem) {
      const dupRows = (
        await client.query(`SELECT * FROM popolive.topup_payment_orders WHERE idempotency_key = $1`, [cleanIdem])
      ).rows;
      if (dupRows.length > 0) {
        const existing = dupRows[0];
        if (existing.user_id !== userId) {
          throw Object.assign(new Error('Idempotency key belongs to another user.'), {
            code: 'IDEMPOTENCY_CONFLICT',
            status: 409,
          });
        }
        const provRows = (
          await client.query(`SELECT * FROM popolive.payment_provider_configs WHERE provider_key = $1`, [
            existing.provider_key,
          ])
        ).rows;
        const prov = provRows[0]
          ? mapProviderConfigRow(provRows[0])
          : {
              providerKey: existing.provider_key,
              displayName: existing.provider_key,
              displayNameUr: null,
              providerType: 'sandbox',
              supportedPlatforms: ['web'],
              configurationStatus: 'ready_sandbox' as const,
              isReadyForPayment: true,
              isSandbox: true,
              isActive: true,
              displayOrder: 1,
              notes: null,
            };
        return {
          success: true,
          deduplicated: true,
          order: mapTopupOrderRow(existing),
          provider: prov,
          checkoutSession: {
            orderId: existing.order_id,
            providerKey: existing.provider_key,
            isSandbox: prov.isSandbox,
            checkoutToken: existing.checkout_token || '',
            amount: Number(existing.amount),
            currency: existing.currency,
            totalCoins: parseInt(String(existing.total_coins), 10),
            expiresAt: new Date(existing.expires_at).toISOString(),
          },
        };
      }
    }

    const pkgRows = (
      await client.query(`SELECT * FROM popolive.coin_packages WHERE package_id = $1`, [packageId])
    ).rows;
    if (pkgRows.length === 0) {
      throw Object.assign(new Error('Selected coin package was not found.'), {
        code: 'PACKAGE_NOT_FOUND',
        status: 404,
      });
    }
    const pkg = mapCoinPackageRow(pkgRows[0]);
    if (!pkg.isActive) {
      throw Object.assign(new Error('Selected coin package is currently unavailable.'), {
        code: 'PACKAGE_INACTIVE',
        status: 400,
      });
    }

    const provRows = (
      await client.query(`SELECT * FROM popolive.payment_provider_configs WHERE provider_key = $1`, [providerKey])
    ).rows;
    if (provRows.length === 0 || !provRows[0].is_active) {
      throw Object.assign(new Error('Selected payment method is not available.'), {
        code: 'PROVIDER_UNAVAILABLE',
        status: 400,
      });
    }
    const prov = mapProviderConfigRow(provRows[0]);
    if (!prov.isReadyForPayment) {
      throw Object.assign(
        new Error(
          `${prov.displayName} is configured as credentials-pending (${prov.notes || 'merchant keys required'}). Select Verified Payment Sandbox for test checkouts.`
        ),
        {
          code: 'PROVIDER_CREDENTIALS_PENDING',
          status: 503,
        }
      );
    }

    const rules = await getFinanceRules(client);
    await ensureWalletLocked(client, userId, rules);

    const orderId = generateTxId('ORD_TOPUP');
    const checkoutToken = `chk_${crypto.randomBytes(18).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const inserted = (
      await client.query(
        `INSERT INTO popolive.topup_payment_orders (
           order_id, user_id, package_id, package_name, provider_key, platform,
           base_coins, bonus_coins, total_coins, amount, currency, status,
           checkout_token, idempotency_key, expires_at, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13, $14, $15::jsonb)
         RETURNING *`,
        [
          orderId,
          userId,
          pkg.packageId,
          pkg.packageName,
          prov.providerKey,
          platform,
          pkg.baseCoins,
          pkg.bonusCoins,
          pkg.totalCoins,
          pkg.priceAmount,
          pkg.currency,
          checkoutToken,
          cleanIdem,
          expiresAt,
          JSON.stringify({
            isSandbox: prov.isSandbox,
            configurationStatus: prov.configurationStatus,
            packageBadge: pkg.badgeText,
          }),
        ]
      )
    ).rows[0];

    const mappedOrder = mapTopupOrderRow(inserted);

    await emitTopupRealtimeEvent(client, userId, 'wallet:topup_created', {
      order: mappedOrder,
    });
    await emitTopupRealtimeEvent(client, userId, 'wallet:payment_pending', {
      orderId: mappedOrder.orderId,
      status: 'pending',
      amount: mappedOrder.amount,
      currency: mappedOrder.currency,
      totalCoins: mappedOrder.totalCoins,
      coinsCredited: 0,
    });

    return {
      success: true,
      order: mappedOrder,
      provider: prov,
      checkoutSession: {
        orderId: mappedOrder.orderId,
        providerKey: mappedOrder.providerKey,
        isSandbox: prov.isSandbox,
        checkoutToken,
        amount: mappedOrder.amount,
        currency: mappedOrder.currency,
        totalCoins: mappedOrder.totalCoins,
        expiresAt,
      },
    };
  });
}

export async function handleTopupWebhook(params: {
  providerKey: string;
  eventId: string;
  orderId: string;
  eventType: 'payment.succeeded' | 'payment.failed' | 'payment.pending' | 'payment.processing' | 'payment.cancelled';
  amount: number;
  currency: string;
  providerPaymentRef?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  signature: string | null | undefined;
  rawPayload?: Record<string, any>;
}): Promise<{
  success: boolean;
  statusCode: number;
  deduplicated?: boolean;
  errorCode?: string;
  message?: string;
  order?: TopupOrderRecord;
  receipt?: TopupReceiptRecord | null;
  wallet?: any;
}> {
  const {
    providerKey,
    eventId,
    orderId,
    eventType,
    amount,
    currency,
    providerPaymentRef = null,
    failureCode = null,
    failureReason = null,
    signature,
    rawPayload = {},
  } = params;

  if (!providerKey || !eventId || !orderId || !eventType) {
    return {
      success: false,
      statusCode: 400,
      errorCode: 'INVALID_WEBHOOK_PAYLOAD',
      message: 'providerKey, eventId, orderId, and eventType are required.',
    };
  }

  // 1. Cryptographic signature verification BEFORE any balance mutation
  const sigValid = verifyTopupWebhookSignature(
    { providerKey, eventId, orderId, eventType, amount, currency },
    signature
  );

  if (!sigValid) {
    await query(
      `INSERT INTO popolive.payment_webhook_events (
         provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload, error_message
       ) VALUES ($1, $2, $3, $4, false, 'rejected_signature', $5::jsonb, 'Invalid or missing webhook HMAC signature')
       ON CONFLICT (provider_key, event_id) DO NOTHING`,
      [providerKey, eventId, orderId, eventType, JSON.stringify(rawPayload)]
    ).catch(() => {});
    return {
      success: false,
      statusCode: 403,
      errorCode: 'INVALID_WEBHOOK_SIGNATURE',
      message: 'Forbidden: Cryptographic payment webhook signature verification failed.',
    };
  }

  return withTransaction(async (client) => {
    // 2. Duplicate webhook replay guard on (provider_key, event_id)
    const dupEventRows = (
      await client.query(
        `SELECT * FROM popolive.payment_webhook_events WHERE provider_key = $1 AND event_id = $2 FOR UPDATE`,
        [providerKey, eventId]
      )
    ).rows;
    if (dupEventRows.length > 0 && dupEventRows[0].processing_status === 'processed') {
      const ordRows = (
        await client.query(`SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1`, [orderId])
      ).rows;
      const ord = ordRows[0] ? mapTopupOrderRow(ordRows[0]) : undefined;
      const wallet = ord ? await getWalletSummary(ord.userId, true) : undefined;
      return {
        success: true,
        statusCode: 200,
        deduplicated: true,
        order: ord,
        receipt: null,
        wallet,
      };
    }

    const orderRows = (
      await client.query(`SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1 FOR UPDATE`, [orderId])
    ).rows;
    if (orderRows.length === 0) {
      return {
        success: false,
        statusCode: 404,
        errorCode: 'ORDER_NOT_FOUND',
        message: 'Referenced payment order does not exist.',
      };
    }
    const order = mapTopupOrderRow(orderRows[0]);

    if (order.providerKey !== providerKey) {
      return {
        success: false,
        statusCode: 400,
        errorCode: 'PROVIDER_MISMATCH',
        message: `Webhook provider (${providerKey}) does not match order provider (${order.providerKey}).`,
      };
    }

    // 3. Amount & Currency integrity verification
    const expectedAmount = Number(order.amount).toFixed(2);
    const receivedAmount = Number(amount).toFixed(2);
    const expectedCurrency = String(order.currency || 'USD').toUpperCase();
    const receivedCurrency = String(currency || '').toUpperCase();

    if (expectedAmount !== receivedAmount || expectedCurrency !== receivedCurrency) {
      await client.query(
        `INSERT INTO popolive.payment_webhook_events (
           provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload, error_message
         ) VALUES ($1, $2, $3, $4, true, 'rejected_mismatch', $5::jsonb, $6)
         ON CONFLICT (provider_key, event_id) DO NOTHING`,
        [
          providerKey,
          eventId,
          orderId,
          eventType,
          JSON.stringify(rawPayload),
          `Expected ${expectedAmount} ${expectedCurrency}, got ${receivedAmount} ${receivedCurrency}`,
        ]
      );
      return {
        success: false,
        statusCode: 400,
        errorCode: 'AMOUNT_OR_CURRENCY_MISMATCH',
        message: `Payment verification rejected: amount/currency mismatch (${receivedAmount} ${receivedCurrency} vs ${expectedAmount} ${expectedCurrency}).`,
      };
    }

    // 4. Prevent double settlement when order is already finalized
    if (order.status === 'successful') {
      await client.query(
        `INSERT INTO popolive.payment_webhook_events (
           provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload
         ) VALUES ($1, $2, $3, $4, true, 'duplicate_ignored', $5::jsonb)
         ON CONFLICT (provider_key, event_id) DO NOTHING`,
        [providerKey, eventId, orderId, eventType, JSON.stringify(rawPayload)]
      );
      const rcptRows = order.receiptId
        ? (await client.query(`SELECT * FROM popolive.topup_receipts WHERE receipt_id = $1`, [order.receiptId])).rows
        : [];
      const rules = await getFinanceRules(client);
      const wRow = await ensureWalletLocked(client, order.userId, rules);
      return {
        success: true,
        statusCode: 200,
        deduplicated: true,
        order,
        receipt: rcptRows[0] ? mapTopupReceiptRow(rcptRows[0]) : null,
        wallet: mapWalletRow(wRow, rules.hostGiftSharePercent),
      };
    }

    if (order.status === 'refunded' || order.status === 'reversed') {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'ORDER_ALREADY_REFUNDED',
        message: `Cannot apply ${eventType} to ${order.status} order.`,
      };
    }

    // 5. Expiry check for pending -> successful transitions
    if (eventType === 'payment.succeeded' && new Date(order.expiresAt).getTime() < Date.now()) {
      const expRows = (
        await client.query(
          `UPDATE popolive.topup_payment_orders
           SET status = 'expired', failure_code = 'ORDER_EXPIRED', failure_reason = 'Checkout session expired before verification.', updated_at = NOW()
           WHERE order_id = $1
           RETURNING *`,
          [orderId]
        )
      ).rows;
      return {
        success: false,
        statusCode: 400,
        errorCode: 'ORDER_EXPIRED',
        message: 'Payment order expired prior to confirmation.',
        order: mapTopupOrderRow(expRows[0]),
      };
    }

    // 6. Prevent reusing same external providerPaymentRef across different orders
    if (providerPaymentRef) {
      const refConflict = (
        await client.query(
          `SELECT order_id FROM popolive.topup_payment_orders
           WHERE provider_key = $1 AND provider_payment_ref = $2 AND order_id <> $3`,
          [providerKey, providerPaymentRef, orderId]
        )
      ).rows;
      if (refConflict.length > 0) {
        return {
          success: false,
          statusCode: 409,
          errorCode: 'DUPLICATE_PROVIDER_PAYMENT_REF',
          message: `Provider payment reference ${providerPaymentRef} already belongs to order ${refConflict[0].order_id}.`,
        };
      }
    }

    // 7. Pending / Processing / Failed / Cancelled states (ZERO coins credited)
    if (eventType === 'payment.pending' || eventType === 'payment.processing') {
      const nextStatus: TopupOrderStatus = eventType === 'payment.processing' ? 'processing' : 'pending';
      const updated = (
        await client.query(
          `UPDATE popolive.topup_payment_orders
           SET status = $1, provider_payment_ref = COALESCE($2, provider_payment_ref), updated_at = NOW()
           WHERE order_id = $3
           RETURNING *`,
          [nextStatus, providerPaymentRef, orderId]
        )
      ).rows[0];
      await client.query(
        `INSERT INTO popolive.payment_webhook_events (
           provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload
         ) VALUES ($1, $2, $3, $4, true, 'processed', $5::jsonb)
         ON CONFLICT (provider_key, event_id) DO NOTHING`,
        [providerKey, eventId, orderId, eventType, JSON.stringify(rawPayload)]
      );
      const mapped = mapTopupOrderRow(updated);
      await emitTopupRealtimeEvent(client, order.userId, 'wallet:payment_pending', {
        orderId: mapped.orderId,
        status: nextStatus,
        coinsCredited: 0,
      });
      return { success: true, statusCode: 200, order: mapped, receipt: null };
    }

    if (eventType === 'payment.failed' || eventType === 'payment.cancelled') {
      const nextStatus: TopupOrderStatus = eventType === 'payment.cancelled' ? 'cancelled' : 'failed';
      const updated = (
        await client.query(
          `UPDATE popolive.topup_payment_orders
           SET status = $1,
               provider_payment_ref = COALESCE($2, provider_payment_ref),
               failure_code = $3,
               failure_reason = $4,
               updated_at = NOW()
           WHERE order_id = $5
           RETURNING *`,
          [
            nextStatus,
            providerPaymentRef,
            failureCode || (nextStatus === 'cancelled' ? 'USER_CANCELLED' : 'PAYMENT_DECLINED'),
            failureReason || (nextStatus === 'cancelled' ? 'Payment cancelled by payer.' : 'Payment declined by gateway.'),
            orderId,
          ]
        )
      ).rows[0];
      await client.query(
        `INSERT INTO popolive.payment_webhook_events (
           provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload
         ) VALUES ($1, $2, $3, $4, true, 'processed', $5::jsonb)
         ON CONFLICT (provider_key, event_id) DO NOTHING`,
        [providerKey, eventId, orderId, eventType, JSON.stringify(rawPayload)]
      );
      const mapped = mapTopupOrderRow(updated);
      await emitTopupRealtimeEvent(client, order.userId, 'wallet:payment_failed', {
        orderId: mapped.orderId,
        status: nextStatus,
        failureCode: mapped.failureCode,
        failureReason: mapped.failureReason,
        coinsCredited: 0,
      });
      return { success: true, statusCode: 200, order: mapped, receipt: null };
    }

    // 8. Verified Payment Succeeded -> Atomically credit Coins + Issue Receipt (NEVER Host Points!)
    const payRef = providerPaymentRef || `PAYREF_${orderId}`;
    const coinCreditResult = await creditCoinsInTx(client, {
      userId: order.userId,
      amount: order.totalCoins,
      transactionType: 'topup',
      referenceId: order.orderId,
      idempotencyKey: `TOPUP_ORD_${order.orderId}`,
      description: `Coin Top-up: ${order.packageName} (${order.baseCoins.toLocaleString()} + ${order.bonusCoins.toLocaleString()} bonus coins)`,
      createdBy: `gateway:${providerKey}`,
      metadata: {
        orderId: order.orderId,
        packageId: order.packageId,
        providerKey,
        providerPaymentRef: payRef,
        amountPaid: order.amount,
        currency: order.currency,
        baseCoins: order.baseCoins,
        bonusCoins: order.bonusCoins,
      },
    });

    const receiptId = generateTxId('RCP');
    let receiptRows = (
      await client.query(
        `INSERT INTO popolive.topup_receipts (
           receipt_id, order_id, user_id, package_id, package_name, provider_key,
           base_coins, bonus_coins, total_coins, amount, currency,
           coin_transaction_id, provider_payment_ref, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'issued')
         ON CONFLICT (order_id) DO NOTHING
         RETURNING *`,
        [
          receiptId,
          order.orderId,
          order.userId,
          order.packageId,
          order.packageName,
          providerKey,
          order.baseCoins,
          order.bonusCoins,
          order.totalCoins,
          order.amount,
          order.currency,
          coinCreditResult.transaction.transactionId,
          payRef,
        ]
      )
    ).rows;
    if (receiptRows.length === 0) {
      receiptRows = (
        await client.query(`SELECT * FROM popolive.topup_receipts WHERE order_id = $1`, [order.orderId])
      ).rows;
    }
    const receiptRow = receiptRows[0];

    const updatedOrderRow = (
      await client.query(
        `UPDATE popolive.topup_payment_orders
         SET status = 'successful',
             provider_payment_ref = $1,
             coin_transaction_id = $2,
             receipt_id = $3,
             verified_at = NOW(),
             updated_at = NOW()
         WHERE order_id = $4
         RETURNING *`,
        [payRef, coinCreditResult.transaction.transactionId, receiptRow.receipt_id, order.orderId]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.payment_webhook_events (
         provider_key, event_id, order_id, event_type, signature_valid, processing_status, payload
       ) VALUES ($1, $2, $3, $4, true, 'processed', $5::jsonb)
       ON CONFLICT (provider_key, event_id) DO UPDATE SET processing_status = 'processed'`,
      [providerKey, eventId, order.orderId, eventType, JSON.stringify(rawPayload)]
    );

    const mappedOrder = mapTopupOrderRow(updatedOrderRow);
    const mappedReceipt = mapTopupReceiptRow(receiptRow);

    await emitTopupRealtimeEvent(client, order.userId, 'wallet:payment_successful', {
      order: mappedOrder,
    });
    await emitTopupRealtimeEvent(client, order.userId, 'wallet:coins_credited', {
      orderId: mappedOrder.orderId,
      coinTransactionId: mappedReceipt.coinTransactionId,
      baseCoins: mappedOrder.baseCoins,
      bonusCoins: mappedOrder.bonusCoins,
      totalCoinsCredited: mappedOrder.totalCoins,
      newCoinBalance: coinCreditResult.wallet.coins,
    });
    await emitTopupRealtimeEvent(client, order.userId, 'wallet:balance_updated', {
      userId: order.userId,
      coins: coinCreditResult.wallet.coins,
      points: coinCreditResult.wallet.points,
    });
    await emitTopupRealtimeEvent(client, order.userId, 'wallet:receipt_created', {
      receipt: mappedReceipt,
    });

    return {
      success: true,
      statusCode: 200,
      order: mappedOrder,
      receipt: mappedReceipt,
      wallet: coinCreditResult.wallet,
    };
  });
}

export async function triggerSandboxProviderAction(params: {
  orderId: string;
  actor: WalletActorContext;
  isPreviewDemo: boolean;
  outcome: 'succeeded' | 'failed' | 'pending' | 'cancelled';
  failureReason?: string;
}) {
  const { orderId, actor, isPreviewDemo, outcome, failureReason } = params;
  const ordRows = await query<any>(`SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1`, [orderId]);
  if (ordRows.length === 0) {
    return { success: false, statusCode: 404, errorCode: 'ORDER_NOT_FOUND', message: 'Order not found.' };
  }
  const order = mapTopupOrderRow(ordRows[0]);

  if (!canAccessTopupUser(actor, order.userId, isPreviewDemo)) {
    return {
      success: false,
      statusCode: 403,
      errorCode: 'TOPUP_ACCESS_DENIED',
      message: 'Forbidden: Not authorized to act on this top-up order.',
    };
  }

  if (order.providerKey !== 'sandbox_verified') {
    return {
      success: false,
      statusCode: 400,
      errorCode: 'SANDBOX_ONLY_PROVIDER',
      message: `Order uses live provider '${order.providerKey}'. Sandbox trigger is strictly limited to 'sandbox_verified' test checkouts.`,
    };
  }

  const eventId = `SBX_EVT_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const eventType =
    outcome === 'succeeded'
      ? 'payment.succeeded'
      : outcome === 'failed'
      ? 'payment.failed'
      : outcome === 'cancelled'
      ? 'payment.cancelled'
      : 'payment.pending';
  const providerPaymentRef = `SBX_PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const signature = computeWebhookSignatureDigest({
    providerKey: 'sandbox_verified',
    eventId,
    orderId: order.orderId,
    eventType,
    amount: order.amount,
    currency: order.currency,
  });

  return handleTopupWebhook({
    providerKey: 'sandbox_verified',
    eventId,
    orderId: order.orderId,
    eventType,
    amount: order.amount,
    currency: order.currency,
    providerPaymentRef,
    failureCode: outcome === 'failed' ? 'SANDBOX_DECLINED' : outcome === 'cancelled' ? 'SANDBOX_CANCELLED' : null,
    failureReason:
      failureReason ||
      (outcome === 'failed'
        ? 'Sandbox simulated card/wallet decline.'
        : outcome === 'cancelled'
        ? 'Sandbox checkout cancelled.'
        : null),
    signature,
    rawPayload: {
      sandboxTriggeredBy: actor.actorId,
      outcome,
    },
  });
}

export async function getTopupOrderAndReceipt(
  orderId: string,
  actor: WalletActorContext,
  isPreviewDemo: boolean
): Promise<{
  allowed: boolean;
  order: TopupOrderRecord | null;
  receipt: TopupReceiptRecord | null;
}> {
  const rows = await query<any>(`SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1`, [orderId]);
  if (rows.length === 0) return { allowed: true, order: null, receipt: null };
  const order = mapTopupOrderRow(rows[0]);
  if (!canAccessTopupUser(actor, order.userId, isPreviewDemo)) {
    return { allowed: false, order: null, receipt: null };
  }
  const rcptRows = order.receiptId
    ? await query<any>(`SELECT * FROM popolive.topup_receipts WHERE receipt_id = $1`, [order.receiptId])
    : [];
  return {
    allowed: true,
    order,
    receipt: rcptRows[0] ? mapTopupReceiptRow(rcptRows[0]) : null,
  };
}

export async function getTopupReceiptById(
  receiptId: string,
  actor: WalletActorContext,
  isPreviewDemo: boolean
): Promise<{ allowed: boolean; receipt: TopupReceiptRecord | null }> {
  const rows = await query<any>(`SELECT * FROM popolive.topup_receipts WHERE receipt_id = $1`, [receiptId]);
  if (rows.length === 0) return { allowed: true, receipt: null };
  const receipt = mapTopupReceiptRow(rows[0]);
  if (!canAccessTopupUser(actor, receipt.userId, isPreviewDemo)) {
    return { allowed: false, receipt: null };
  }
  return { allowed: true, receipt };
}

export async function getTopupHistory(params: {
  userId: string;
  status?: string | null;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  const conds: string[] = ['o.user_id = $1'];
  const values: any[] = [params.userId];
  let idx = 2;

  if (params.status && params.status !== 'all') {
    conds.push(`o.status = $${idx++}`);
    values.push(params.status);
  }

  const where = conds.join(' AND ');
  const countRows = await query<{ cnt: number }>(
    `SELECT count(*)::int AS cnt FROM popolive.topup_payment_orders o WHERE ${where}`,
    values
  );
  const total = countRows[0]?.cnt ?? 0;

  const rows = await query<any>(
    `SELECT o.*, r.issued_at AS receipt_issued_at, r.status AS receipt_status
     FROM popolive.topup_payment_orders o
     LEFT JOIN popolive.topup_receipts r ON r.order_id = o.order_id
     WHERE ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return {
    items: rows.map((row) => ({
      ...mapTopupOrderRow(row),
      receiptIssuedAt: row.receipt_issued_at ? new Date(row.receipt_issued_at).toISOString() : null,
      receiptStatus: row.receipt_status || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function adminUpsertCoinPackage(params: {
  actorId: string;
  actorRole: string;
  packageId: string;
  packageName: string;
  packageNameUr?: string | null;
  baseCoins: number;
  bonusCoins?: number;
  priceAmount: number;
  currency?: string;
  badgeText?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  platformProductIdIos?: string | null;
  platformProductIdAndroid?: string | null;
}): Promise<CoinPackageRecord> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only finance administrators can configure coin packages.'), {
      code: 'FINANCE_ADMIN_REQUIRED',
      status: 403,
    });
  }

  const cleanId = params.packageId.trim();
  const base = Math.trunc(params.baseCoins);
  const bonus = Math.max(0, Math.trunc(params.bonusCoins || 0));
  const total = base + bonus;
  const price = Number(params.priceAmount);

  if (!cleanId || !params.packageName?.trim() || !Number.isInteger(base) || base <= 0 || !Number.isFinite(price) || price <= 0) {
    throw Object.assign(new Error('Valid packageId, packageName, positive baseCoins, and positive priceAmount are required.'), {
      code: 'INVALID_PACKAGE_INPUT',
      status: 400,
    });
  }

  const row = await withTransaction(async (client) => {
    const res = (
      await client.query(
        `INSERT INTO popolive.coin_packages (
           package_id, package_name, package_name_ur, base_coins, bonus_coins, total_coins,
           price_amount, currency, badge_text, is_popular, is_active, display_order,
           platform_product_id_ios, platform_product_id_android, created_by, updated_by, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, NOW())
         ON CONFLICT (package_id) DO UPDATE SET
           package_name = EXCLUDED.package_name,
           package_name_ur = EXCLUDED.package_name_ur,
           base_coins = EXCLUDED.base_coins,
           bonus_coins = EXCLUDED.bonus_coins,
           total_coins = EXCLUDED.total_coins,
           price_amount = EXCLUDED.price_amount,
           currency = EXCLUDED.currency,
           badge_text = EXCLUDED.badge_text,
           is_popular = EXCLUDED.is_popular,
           is_active = EXCLUDED.is_active,
           display_order = EXCLUDED.display_order,
           platform_product_id_ios = EXCLUDED.platform_product_id_ios,
           platform_product_id_android = EXCLUDED.platform_product_id_android,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
         RETURNING *`,
        [
          cleanId,
          params.packageName.trim(),
          params.packageNameUr || null,
          base,
          bonus,
          total,
          price.toFixed(2),
          (params.currency || 'USD').toUpperCase(),
          params.badgeText || null,
          Boolean(params.isPopular),
          params.isActive !== undefined ? Boolean(params.isActive) : true,
          params.displayOrder !== undefined ? Math.trunc(params.displayOrder) : 50,
          params.platformProductIdIos || null,
          params.platformProductIdAndroid || null,
          params.actorId,
        ]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.topup_admin_audit_logs (actor_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, 'package_upserted', $3, $4, $5::jsonb)`,
      [
        params.actorId,
        params.actorRole,
        cleanId,
        `Upserted coin package ${cleanId} (${total} coins @ ${price.toFixed(2)})`,
        JSON.stringify({ baseCoins: base, bonusCoins: bonus, priceAmount: price, isActive: res.is_active }),
      ]
    );

    return res;
  });

  await redisDel(PACKAGES_CACHE_KEY);
  return mapCoinPackageRow(row);
}

export async function adminToggleCoinPackageStatus(params: {
  actorId: string;
  actorRole: string;
  packageId: string;
  isActive: boolean;
}): Promise<CoinPackageRecord> {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only finance administrators can enable/disable packages.'), {
      code: 'FINANCE_ADMIN_REQUIRED',
      status: 403,
    });
  }

  const row = await withTransaction(async (client) => {
    const res = (
      await client.query(
        `UPDATE popolive.coin_packages
         SET is_active = $1, updated_by = $2, updated_at = NOW()
         WHERE package_id = $3
         RETURNING *`,
        [Boolean(params.isActive), params.actorId, params.packageId]
      )
    ).rows;
    if (res.length === 0) {
      throw Object.assign(new Error('Coin package not found.'), { code: 'PACKAGE_NOT_FOUND', status: 404 });
    }
    await client.query(
      `INSERT INTO popolive.topup_admin_audit_logs (actor_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, 'package_status_changed', $3, $4, $5::jsonb)`,
      [
        params.actorId,
        params.actorRole,
        params.packageId,
        `Set package is_active=${Boolean(params.isActive)}`,
        JSON.stringify({ isActive: Boolean(params.isActive) }),
      ]
    );
    return res[0];
  });

  await redisDel(PACKAGES_CACHE_KEY);
  return mapCoinPackageRow(row);
}

export async function adminQueryTopupOrders(params: {
  actorRole: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only finance administrators can inspect all top-up orders.'), {
      code: 'FINANCE_ADMIN_REQUIRED',
      status: 403,
    });
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 25));
  const offset = (page - 1) * limit;

  const conds: string[] = ['1=1'];
  const values: any[] = [];
  let idx = 1;

  if (params.status && params.status !== 'all') {
    conds.push(`o.status = $${idx++}`);
    values.push(params.status);
  }
  if (params.search && params.search.trim()) {
    conds.push(`(o.order_id ILIKE $${idx} OR o.user_id ILIKE $${idx} OR COALESCE(o.receipt_id, '') ILIKE $${idx})`);
    values.push(`%${params.search.trim()}%`);
    idx++;
  }

  const where = conds.join(' AND ');
  const aggRows = await query<{
    total_orders: number;
    successful_orders: number;
    successful_revenue: string;
    total_coins_credited: string;
    refunded_orders: number;
  }>(
    `SELECT
       count(*)::int AS total_orders,
       count(*) FILTER (WHERE o.status = 'successful')::int AS successful_orders,
       COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'successful'), 0)::text AS successful_revenue,
       COALESCE(SUM(o.total_coins) FILTER (WHERE o.status = 'successful'), 0)::text AS total_coins_credited,
       count(*) FILTER (WHERE o.status = 'refunded')::int AS refunded_orders
     FROM popolive.topup_payment_orders o
     WHERE ${where}`,
    values
  );

  const items = await query<any>(
    `SELECT o.* FROM popolive.topup_payment_orders o
     WHERE ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  const stats = aggRows[0] || {
    total_orders: 0,
    successful_orders: 0,
    successful_revenue: '0',
    total_coins_credited: '0',
    refunded_orders: 0,
  };

  return {
    summary: {
      totalOrders: stats.total_orders,
      successfulOrders: stats.successful_orders,
      successfulRevenueUsd: Number(stats.successful_revenue || 0),
      totalCoinsCredited: parseInt(String(stats.total_coins_credited || 0), 10),
      refundedOrders: stats.refunded_orders,
    },
    items: items.map(mapTopupOrderRow),
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(stats.total_orders / limit)),
  };
}

export async function adminRefundTopupOrder(params: {
  orderId: string;
  actorId: string;
  actorRole: string;
  reason: string;
  ipAddress?: string | null;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only finance administrators can refund top-up orders.'), {
      code: 'FINANCE_ADMIN_REQUIRED',
      status: 403,
    });
  }
  if (!params.reason || params.reason.trim().length < 5) {
    throw Object.assign(new Error('Refund reason (minimum 5 characters) is mandatory.'), {
      code: 'REASON_REQUIRED',
      status: 400,
    });
  }

  return withTransaction(async (client) => {
    const ordRows = (
      await client.query(`SELECT * FROM popolive.topup_payment_orders WHERE order_id = $1 FOR UPDATE`, [params.orderId])
    ).rows;
    if (ordRows.length === 0) {
      throw Object.assign(new Error('Top-up order not found.'), { code: 'ORDER_NOT_FOUND', status: 404 });
    }
    const order = mapTopupOrderRow(ordRows[0]);
    if (order.status === 'refunded' || order.status === 'reversed') {
      throw Object.assign(new Error('Top-up order has already been refunded.'), {
        code: 'ALREADY_REFUNDED',
        status: 400,
      });
    }
    if (order.status !== 'successful') {
      throw Object.assign(
        new Error(`Only verified successful top-ups can be refunded (current status: ${order.status}).`),
        { code: 'ORDER_NOT_REFUNDABLE', status: 400 }
      );
    }

    const rules = await getFinanceRules(client);
    const walletRow = await ensureWalletLocked(client, order.userId, rules);
    const currCoins = parseInt(String(walletRow.coins), 10);
    if (currCoins < order.totalCoins) {
      throw Object.assign(
        new Error(
          `Cannot refund top-up automatically: user current balance (${currCoins}) is less than ${order.totalCoins} coins already granted.`
        ),
        { code: 'INSUFFICIENT_COINS_FOR_REFUND', status: 400 }
      );
    }

    const newCoins = currCoins - order.totalCoins;
    const updatedWalletRow = (
      await client.query(
        `UPDATE popolive.user_wallets SET coins = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
        [newCoins, order.userId]
      )
    ).rows[0];

    if (order.coinTransactionId) {
      await client.query(
        `UPDATE popolive.coin_transactions SET status = 'reversed', updated_at = NOW() WHERE transaction_id = $1`,
        [order.coinTransactionId]
      );
    }

    const revTxId = generateTxId('TXN_REFUND_C');
    await client.query(
      `INSERT INTO popolive.coin_transactions (
         transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
         previous_balance, new_balance, status, reference_id, related_tx_id, description, created_by
       ) VALUES ($1, $2, $3, 'reversal', 'debit', $4, $5, $6, 'completed', $7, $8, $9, $10)`,
      [
        revTxId,
        walletRow.wallet_id,
        order.userId,
        order.totalCoins,
        currCoins,
        newCoins,
        `REFUND:${order.orderId}`,
        order.coinTransactionId,
        `Refund of top-up order ${order.orderId}: ${params.reason.trim()}`,
        params.actorId,
      ]
    );

    const updatedOrder = (
      await client.query(
        `UPDATE popolive.topup_payment_orders
         SET status = 'refunded',
             refund_reference = $1,
             refund_reason = $2,
             refunded_by = $3,
             refunded_at = NOW(),
             updated_at = NOW()
         WHERE order_id = $4
         RETURNING *`,
        [revTxId, params.reason.trim(), params.actorId, order.orderId]
      )
    ).rows[0];

    await client.query(
      `UPDATE popolive.topup_receipts SET status = 'refunded' WHERE order_id = $1`,
      [order.orderId]
    );

    await client.query(
      `INSERT INTO popolive.topup_admin_audit_logs (actor_id, actor_role, action_type, target_id, reason, details)
       VALUES ($1, $2, 'topup_order_refunded', $3, $4, $5::jsonb)`,
      [
        params.actorId,
        params.actorRole,
        order.orderId,
        params.reason.trim(),
        JSON.stringify({ refundedCoins: order.totalCoins, reversalTxId: revTxId, userId: order.userId }),
      ]
    );

    const mappedWallet = mapWalletRow(updatedWalletRow, rules.hostGiftSharePercent);
    await emitWalletRealtimeEvent(client, order.userId, 'wallet:coin_balance_updated', {
      userId: order.userId,
      walletId: mappedWallet.walletId,
      coins: newCoins,
      previousBalance: currCoins,
      delta: -order.totalCoins,
      transactionId: revTxId,
    });
    await emitTopupRealtimeEvent(client, order.userId, 'wallet:topup_refunded', {
      orderId: order.orderId,
      refundReference: revTxId,
      coinsReversed: order.totalCoins,
      newCoinBalance: newCoins,
    });
    await emitTopupRealtimeEvent(client, order.userId, 'wallet:balance_updated', {
      userId: order.userId,
      coins: newCoins,
      points: mappedWallet.points,
    });

    await logWalletAudit({
      targetUserId: order.userId,
      walletId: walletRow.wallet_id,
      actionType: 'topup_refund_reversed',
      actorId: params.actorId,
      actorRole: params.actorRole,
      reason: `${params.reason.trim()} [reversalTx: ${revTxId}]`,
      balanceType: 'coins',
      amount: order.totalCoins,
      ipAddress: params.ipAddress || undefined,
    });

    return {
      success: true,
      order: mapTopupOrderRow(updatedOrder),
      wallet: mappedWallet,
      reversalTransactionId: revTxId,
    };
  });
}
