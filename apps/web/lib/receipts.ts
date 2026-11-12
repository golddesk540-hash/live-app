import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { canAccessPrivateWallet, WalletActorContext } from '@/lib/walletAuth';
import { generateReceiptPdfBuffer } from '@/lib/pdfGenerator';

// =============================================================================
// Popo Live Phase 7 Module 7.10 — Unified Receipts & Transaction History Engine
// Strictly separates Cash Payment Amounts, Coins, Bonus Coins, Host Points
// (70% non-cash), and Platform Share (30%).
// Never creates successful receipts for pending, failed, or cancelled transactions.
// =============================================================================

export type FinanceTxCategory =
  | 'topup'
  | 'gift_sent'
  | 'host_earning'
  | 'points_credit'
  | 'vip_purchase'
  | 'vip_renewal'
  | 'store_purchase'
  | 'refund'
  | 'reversal'
  | 'wallet_adjustment';

export type FinanceTxStatus =
  | 'successful'
  | 'pending'
  | 'processing'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'reversed';

export type ReceiptStatus = 'successful' | 'refunded' | 'reversed';

export interface FinanceLedgerItem {
  recordId: string;
  sourceTable: string;
  userId: string;
  userNickname: string | null;
  userPoppoId: string | null;
  txCategory: FinanceTxCategory;
  title: string;
  titleUr: string;
  description: string;
  paymentAmount: number;
  currency: string;
  coinQuantity: number;
  bonusCoinQuantity: number;
  pointsQuantity: number;
  platformShareCoins: number;
  sharePercentage: number | null;
  paymentMethod: string | null;
  providerReferenceMasked: string | null;
  status: FinanceTxStatus;
  receiptEligible: boolean;
  receiptId: string | null;
  receiptNumber: string | null;
  legacyReceiptId: string | null;
  giftSummary: Record<string, any> | null;
  vipSummary: Record<string, any> | null;
  storeSummary: Record<string, any> | null;
  itemDetailSummary: string | null;
  issuedAt: string;
}

export interface FinancialReceiptRecord {
  receiptId: string;
  receiptNumber: string;
  transactionId: string;
  sourceTable: string;
  relatedOriginalTxId: string | null;
  legacyReceiptId: string | null;
  userId: string;
  userNickname: string | null;
  userPoppoId: string | null;
  txCategory: FinanceTxCategory;
  title: string;
  titleUr: string;
  description: string;
  paymentAmount: number;
  currency: string;
  coinQuantity: number;
  bonusCoinQuantity: number;
  pointsQuantity: number;
  platformShareCoins: number;
  sharePercentage: number | null;
  paymentMethod: string | null;
  providerReferenceMasked: string | null;
  status: ReceiptStatus;
  giftSummary: Record<string, any> | null;
  vipSummary: Record<string, any> | null;
  storeSummary: Record<string, any> | null;
  itemDetailSummary: string;
  nonCashPointsNote: string | null;
  issuedAt: string;
}

export class FinanceReceiptError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function generateFinanceId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export function maskProviderReference(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/^\*+/.test(trimmed)) return trimmed;
  if (trimmed.length <= 4) return '****';
  const visible = trimmed.slice(-4);
  const maskedLen = Math.min(12, Math.max(4, trimmed.length - 4));
  return `${'*'.repeat(maskedLen)}${visible}`;
}

export function resolveDatePresetBounds(params: {
  preset?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}): { fromIso: string | null; toIso: string | null; label: string } {
  const now = new Date();
  const startOfUtcDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const endOfUtcDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  const preset = (params.preset || 'all').trim().toLowerCase();
  if (preset === 'today' || preset === 'daily') {
    return {
      fromIso: startOfUtcDay(now).toISOString(),
      toIso: endOfUtcDay(now).toISOString(),
      label: 'Today (UTC)',
    };
  }
  if (preset === 'yesterday') {
    const y = new Date(now.getTime() - 86400000);
    return {
      fromIso: startOfUtcDay(y).toISOString(),
      toIso: endOfUtcDay(y).toISOString(),
      label: 'Yesterday (UTC)',
    };
  }
  if (preset === 'last_7d' || preset === 'weekly') {
    const start = startOfUtcDay(new Date(now.getTime() - 6 * 86400000));
    return {
      fromIso: start.toISOString(),
      toIso: endOfUtcDay(now).toISOString(),
      label: 'Last 7 Days',
    };
  }
  if (preset === 'last_30d') {
    const start = startOfUtcDay(new Date(now.getTime() - 29 * 86400000));
    return {
      fromIso: start.toISOString(),
      toIso: endOfUtcDay(now).toISOString(),
      label: 'Last 30 Days',
    };
  }
  if (preset === 'this_month' || preset === 'monthly') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return {
      fromIso: start.toISOString(),
      toIso: endOfUtcDay(now).toISOString(),
      label: 'This Month',
    };
  }
  if (preset === 'previous_month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
    return {
      fromIso: start.toISOString(),
      toIso: end.toISOString(),
      label: 'Previous Month',
    };
  }
  if (params.fromDate || params.toDate) {
    const parsedFrom = params.fromDate ? new Date(params.fromDate) : null;
    const parsedTo = params.toDate ? new Date(params.toDate) : null;
    const validFrom = parsedFrom && !Number.isNaN(parsedFrom.getTime()) ? parsedFrom.toISOString() : null;
    let validTo: string | null = null;
    if (parsedTo && !Number.isNaN(parsedTo.getTime())) {
      if (params.toDate && /^\d{4}-\d{2}-\d{2}$/.test(params.toDate.trim())) {
        validTo = endOfUtcDay(parsedTo).toISOString();
      } else {
        validTo = parsedTo.toISOString();
      }
    }
    return {
      fromIso: validFrom,
      toIso: validTo,
      label: `${params.fromDate || '...'} to ${params.toDate || '...'}`,
    };
  }
  return { fromIso: null, toIso: null, label: 'All Time' };
}

export async function resolveCanonicalFinanceUserId(rawIdentifier: string): Promise<string> {
  const clean = (rawIdentifier || '').trim();
  if (!clean || clean === DEFAULT_DEMO_WALLET_USER_ID) return DEFAULT_DEMO_WALLET_USER_ID;
  const rows = await query<{ id: string }>(
    `SELECT id::text AS id FROM popolive.users WHERE id::text = $1 OR poppo_id = $1 LIMIT 1`,
    [clean]
  );
  return rows[0]?.id || clean;
}

function buildReceiptNumberFromSource(txCategory: FinanceTxCategory, sourceTxId: string): string {
  const prefixMap: Record<FinanceTxCategory, string> = {
    topup: 'TOP',
    gift_sent: 'GFT',
    host_earning: 'ERN',
    points_credit: 'PTS',
    vip_purchase: 'VIP',
    vip_renewal: 'VIP',
    store_purchase: 'STR',
    refund: 'RFD',
    reversal: 'REV',
    wallet_adjustment: 'ADJ',
  };
  const digest = crypto.createHash('md5').update(sourceTxId).digest('hex').slice(0, 10).toUpperCase();
  return `PL-RCP-${prefixMap[txCategory]}-${digest}`;
}

export interface SyncFinancialReceiptInput {
  receiptId?: string | null;
  legacyReceiptId?: string | null;
  userId: string;
  txCategory: FinanceTxCategory;
  sourceTable: string;
  sourceTxId: string;
  relatedOriginalTxId?: string | null;
  title: string;
  titleUr?: string | null;
  description?: string | null;
  paymentAmount?: number;
  currency?: string;
  coinQuantity?: number;
  bonusCoinQuantity?: number;
  pointsQuantity?: number;
  platformShareCoins?: number;
  sharePercentage?: number | null;
  giftSummary?: Record<string, any> | null;
  vipSummary?: Record<string, any> | null;
  storeSummary?: Record<string, any> | null;
  paymentMethod?: string | null;
  providerReferenceRaw?: string | null;
  status: string;
  issuedAt?: string | Date | null;
  metadata?: Record<string, any>;
}

/**
 * Normalizes varied module statuses into eligible ReceiptStatus ONLY when settled,
 * refunded, or reversed. Strictly returns null for failed, cancelled, pending, expired, or processing.
 */
export function normalizeEligibleReceiptStatus(rawStatus: string): ReceiptStatus | null {
  const s = (rawStatus || '').trim().toLowerCase();
  if (s === 'successful' || s === 'completed' || s === 'verified' || s === 'credited') {
    return 'successful';
  }
  if (s === 'refunded') return 'refunded';
  if (s === 'reversed') return 'reversed';
  return null;
}

/**
 * Syncs an immutable financial receipt inside an existing DB transaction or pool query.
 * Strictly refuses to create receipts for failed/cancelled/pending/expired transactions.
 */
export async function syncFinancialReceiptInTx(
  dbClient: { query: (sql: string, params?: any[]) => Promise<any> } | null,
  input: SyncFinancialReceiptInput
): Promise<string | null> {
  const eligibleStatus = normalizeEligibleReceiptStatus(input.status);
  if (!eligibleStatus) {
    return null;
  }

  const exec = dbClient
    ? (sql: string, params?: any[]) => dbClient.query(sql, params)
    : async (sql: string, params?: any[]) => ({ rows: await query(sql, params) });

  const receiptId = input.receiptId?.trim() || `RCP_${input.sourceTxId}`;
  const receiptNumber = buildReceiptNumberFromSource(input.txCategory, input.sourceTxId);
  const maskedRef = maskProviderReference(input.providerReferenceRaw);
  const issuedAt = input.issuedAt ? new Date(input.issuedAt).toISOString() : new Date().toISOString();

  await exec(
    `INSERT INTO popolive.financial_receipts (
       receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id,
       related_original_tx_id, legacy_receipt_id, title, title_ur, description,
       payment_amount, currency, coin_quantity, bonus_coin_quantity, points_quantity,
       platform_share_coins, share_percentage, gift_summary, vip_summary, store_summary,
       payment_method, provider_reference_masked, status, issued_at, metadata
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15, $16,
       $17, $18, $19::jsonb, $20::jsonb, $21::jsonb,
       $22, $23, $24, $25::timestamptz, $26::jsonb
     )
     ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
       status = CASE
         WHEN EXCLUDED.status IN ('refunded', 'reversed') THEN EXCLUDED.status
         ELSE popolive.financial_receipts.status
       END,
       legacy_receipt_id = COALESCE(EXCLUDED.legacy_receipt_id, popolive.financial_receipts.legacy_receipt_id),
       updated_at = NOW()`,
    [
      receiptId,
      receiptNumber,
      input.userId,
      input.txCategory,
      input.sourceTable,
      input.sourceTxId,
      input.relatedOriginalTxId || null,
      input.legacyReceiptId || null,
      input.title,
      input.titleUr || input.title,
      input.description || input.title,
      Number(input.paymentAmount || 0),
      (input.currency || 'NONE').toUpperCase(),
      Math.trunc(Number(input.coinQuantity || 0)),
      Math.trunc(Number(input.bonusCoinQuantity || 0)),
      Math.trunc(Number(input.pointsQuantity || 0)),
      Math.trunc(Number(input.platformShareCoins || 0)),
      input.sharePercentage ?? null,
      input.giftSummary ? JSON.stringify(input.giftSummary) : null,
      input.vipSummary ? JSON.stringify(input.vipSummary) : null,
      input.storeSummary ? JSON.stringify(input.storeSummary) : null,
      input.paymentMethod || 'wallet',
      maskedRef,
      eligibleStatus,
      issuedAt,
      JSON.stringify(input.metadata || {}),
    ]
  );

  return receiptId;
}

/**
 * Ensures all settled/refunded/reversed records for a user (or all users if omitted)
 * have up-to-date entries in popolive.financial_receipts without creating any duplicate rows
 * and strictly never creating receipts for failed/cancelled/pending transactions.
 */
export async function ensureReceiptsSynced(targetUserId?: string | null): Promise<void> {
  const userClauseTopup = targetUserId ? 'AND o.user_id = $1' : '';
  const userClauseVip = targetUserId ? 'AND vo.user_id = $1' : '';
  const userClauseGift = targetUserId ? 'AND gt.sender_user_id = $1' : '';
  const userClauseHost = targetUserId ? 'AND he.host_user_id = $1' : '';
  const userClauseStore = targetUserId ? 'AND sp.user_id = $1' : '';
  const userClauseCoin = targetUserId ? 'AND ct.user_id = $1' : '';
  const userClausePts = targetUserId ? 'AND pt.host_user_id = $1' : '';
  const params = targetUserId ? [targetUserId] : [];

  await withTransaction(async (client) => {
    // 1. Top-up orders
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id, legacy_receipt_id,
         title, title_ur, description, payment_amount, currency, coin_quantity, bonus_coin_quantity,
         payment_method, provider_reference_masked, status, issued_at
       )
       SELECT
         COALESCE(NULLIF(o.receipt_id, ''), 'RCP_' || o.order_id),
         'PL-RCP-TOP-' || UPPER(SUBSTRING(MD5(o.order_id), 1, 10)),
         o.user_id,
         'topup',
         'topup_payment_orders',
         o.order_id,
         o.receipt_id,
         'Coin Top-up (' || o.package_name || ')',
         'سکے ٹاپ اپ (' || o.package_name || ')',
         'Verified coin package purchase: ' || o.package_name,
         o.amount,
         o.currency,
         o.base_coins,
         o.bonus_coins,
         o.provider_key,
         CASE WHEN o.provider_payment_ref IS NOT NULL AND LENGTH(o.provider_payment_ref) > 4
              THEN REPEAT('*', GREATEST(4, LENGTH(o.provider_payment_ref) - 4)) || RIGHT(o.provider_payment_ref, 4)
              ELSE o.provider_payment_ref END,
         CASE WHEN o.status IN ('refunded', 'reversed') THEN o.status ELSE 'successful' END,
         COALESCE(o.verified_at, o.created_at)
       FROM popolive.topup_payment_orders o
       WHERE o.status IN ('successful', 'refunded', 'reversed') ${userClauseTopup}
       ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
         status = CASE WHEN EXCLUDED.status IN ('refunded', 'reversed') THEN EXCLUDED.status ELSE popolive.financial_receipts.status END,
         updated_at = NOW()`,
      params
    );

    // 2. VIP orders (cash and coin)
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id, legacy_receipt_id,
         title, title_ur, description, payment_amount, currency, coin_quantity,
         vip_summary, payment_method, provider_reference_masked, status, issued_at
       )
       SELECT
         COALESCE(vr.receipt_id, 'RCP_' || vo.order_id),
         'PL-RCP-VIP-' || UPPER(SUBSTRING(MD5(vo.order_id), 1, 10)),
         vo.user_id,
         CASE WHEN vo.order_type = 'renewal' THEN 'vip_renewal' ELSE 'vip_purchase' END,
         'vip_membership_orders',
         vo.order_id,
         vr.receipt_id,
         CASE WHEN vo.order_type = 'renewal' THEN 'VIP Renewal (' || vo.plan_name || ')' ELSE 'VIP Membership (' || vo.plan_name || ')' END,
         CASE WHEN vo.order_type = 'renewal' THEN 'وی آئی پی تجدید (' || vo.plan_name || ')' ELSE 'وی آئی پی رکنیت (' || vo.plan_name || ')' END,
         vo.plan_name || ' • ' || vo.duration_days || ' Days (Level ' || vo.vip_level || ')',
         vo.amount,
         vo.currency,
         COALESCE(vo.coins_charged, 0),
         jsonb_build_object('planId', vo.plan_id, 'planName', vo.plan_name, 'vipLevel', vo.vip_level, 'orderType', vo.order_type, 'durationDays', vo.duration_days),
         vo.provider_key,
         CASE WHEN vo.payment_reference IS NOT NULL AND LENGTH(vo.payment_reference) > 4
              THEN REPEAT('*', GREATEST(4, LENGTH(vo.payment_reference) - 4)) || RIGHT(vo.payment_reference, 4)
              ELSE vo.payment_reference END,
         CASE WHEN vo.status = 'refunded' THEN 'refunded' ELSE 'successful' END,
         COALESCE(vo.verified_at, vo.created_at)
       FROM popolive.vip_membership_orders vo
       LEFT JOIN popolive.vip_receipts vr ON vr.order_id = vo.order_id
       WHERE vo.status IN ('verified', 'refunded') ${userClauseVip}
       ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
         status = CASE WHEN EXCLUDED.status = 'refunded' THEN 'refunded' ELSE popolive.financial_receipts.status END,
         updated_at = NOW()`,
      params
    );

    // 3. Gift transactions (sender side)
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id,
         title, title_ur, description, payment_amount, currency, coin_quantity, points_quantity, platform_share_coins, share_percentage,
         gift_summary, payment_method, status, issued_at
       )
       SELECT
         'RCP_' || gt.gift_transaction_id,
         'PL-RCP-GFT-' || UPPER(SUBSTRING(MD5(gt.gift_transaction_id), 1, 10)),
         gt.sender_user_id,
         'gift_sent',
         'gift_transactions',
         gt.gift_transaction_id,
         'Gift Sent (' || gt.gift_name_snapshot || ' x' || gt.quantity || ')',
         'تحفہ بھیجا گیا (' || gt.gift_name_snapshot || ' x' || gt.quantity || ')',
         'Sent ' || gt.gift_name_snapshot || ' x' || gt.quantity || ' to ' || gt.recipient_nickname,
         0,
         'NONE',
         gt.total_coin_amount,
         gt.host_points_credited,
         gt.platform_share,
         gt.share_percentage,
         jsonb_build_object(
           'giftId', gt.gift_id, 'giftName', gt.gift_name_snapshot, 'quantity', gt.quantity,
           'recipientHostId', gt.recipient_host_id, 'recipientNickname', gt.recipient_nickname,
           'liveRoomId', gt.live_room_id, 'pkBattleId', gt.pk_battle_id
         ),
         'coin_wallet',
         CASE WHEN gt.status = 'reversed' THEN 'reversed' ELSE 'successful' END,
         gt.created_at
       FROM popolive.gift_transactions gt
       WHERE gt.status IN ('completed', 'reversed') ${userClauseGift}
       ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
         status = CASE WHEN EXCLUDED.status = 'reversed' THEN 'reversed' ELSE popolive.financial_receipts.status END,
         updated_at = NOW()`,
      params
    );

    // 4. Host earning shares (host non-cash points share)
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id,
         title, title_ur, description, payment_amount, currency, coin_quantity, points_quantity, platform_share_coins, share_percentage,
         gift_summary, payment_method, status, issued_at
       )
       SELECT
         'RCP_' || he.earning_id,
         'PL-RCP-ERN-' || UPPER(SUBSTRING(MD5(he.earning_id), 1, 10)),
         he.host_user_id,
         'host_earning',
         'host_earning_shares',
         he.earning_id,
         'Host Earning (' || he.gift_name_snapshot || ' x' || he.gift_quantity || ')',
         'ہوسٹ کمائی (' || he.gift_name_snapshot || ' x' || he.gift_quantity || ')',
         '70% non-cash Host Points share from ' || he.gift_name_snapshot || ' x' || he.gift_quantity || ' (' || he.original_coin_amount || ' gift coins)',
         0,
         'NONE',
         he.original_coin_amount,
         he.points_credited,
         he.platform_share_amount,
         he.host_share_percentage,
         jsonb_build_object(
           'giftId', he.gift_id, 'giftName', he.gift_name_snapshot, 'quantity', he.gift_quantity,
           'sourceType', he.source_type, 'giftTransactionId', he.gift_transaction_id
         ),
         'host_share_70pct',
         CASE WHEN he.status = 'reversed' THEN 'reversed' ELSE 'successful' END,
         he.created_at
       FROM popolive.host_earning_shares he
       WHERE he.status IN ('credited', 'reversed') ${userClauseHost}
       ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
         status = CASE WHEN EXCLUDED.status = 'reversed' THEN 'reversed' ELSE popolive.financial_receipts.status END,
         updated_at = NOW()`,
      params
    );

    // 5. Store purchases
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id,
         title, title_ur, description, payment_amount, currency, coin_quantity,
         store_summary, payment_method, status, issued_at
       )
       SELECT
         'RCP_' || sp.purchase_id,
         'PL-RCP-STR-' || UPPER(SUBSTRING(MD5(sp.purchase_id), 1, 10)),
         sp.user_id,
         'store_purchase',
         'store_purchases',
         sp.purchase_id,
         'Store Purchase (' || sp.item_name_snapshot || ')',
         'اسٹور خریداری (' || sp.item_name_snapshot || ')',
         'Virtual Store item: ' || sp.item_name_snapshot || ' x' || sp.quantity,
         0,
         'NONE',
         sp.total_coins,
         jsonb_build_object(
           'purchaseId', sp.purchase_id, 'itemId', sp.item_id, 'itemName', sp.item_name_snapshot,
           'categoryId', sp.category_id, 'quantity', sp.quantity, 'unitCoinPrice', sp.unit_coin_price,
           'inventoryId', sp.inventory_id
         ),
         'coin_wallet',
         CASE WHEN sp.status IN ('refunded', 'reversed') THEN sp.status ELSE 'successful' END,
         sp.created_at
       FROM popolive.store_purchases sp
       WHERE sp.status IN ('completed', 'refunded', 'reversed') ${userClauseStore}
       ON CONFLICT (source_table, source_tx_id) DO UPDATE SET
         status = CASE WHEN EXCLUDED.status IN ('refunded', 'reversed') THEN EXCLUDED.status ELSE popolive.financial_receipts.status END,
         updated_at = NOW()`,
      params
    );

    // 6. Standalone coin adjustments, refunds & reversals
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id, related_original_tx_id,
         title, title_ur, description, payment_amount, currency, coin_quantity, payment_method, status, issued_at
       )
       SELECT
         'RCP_' || ct.transaction_id,
         'PL-RCP-' || CASE
           WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'RFD'
           WHEN ct.transaction_type = 'reversal' THEN 'REV'
           ELSE 'ADJ' END || '-' || UPPER(SUBSTRING(MD5(ct.transaction_id), 1, 10)),
         ct.user_id,
         CASE
           WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'refund'
           WHEN ct.transaction_type = 'reversal' THEN 'reversal'
           ELSE 'wallet_adjustment' END,
         'coin_transactions',
         ct.transaction_id,
         ct.related_tx_id,
         CASE
           WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'Approved Coin Refund'
           WHEN ct.transaction_type = 'reversal' THEN 'Coin Transaction Reversal'
           WHEN ct.transaction_type = 'initial_credit' THEN 'Initial Coin Grant'
           ELSE 'Authorized Coin Wallet Adjustment' END,
         CASE
           WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'منظور شدہ سکے کی واپسی'
           WHEN ct.transaction_type = 'reversal' THEN 'سکے کی ٹرانزیکشن منسوخی'
           ELSE 'مستند سکے والٹ ایڈجسٹمنٹ' END,
         COALESCE(ct.description, ct.transaction_type || ' (' || ct.direction || ')'),
         0,
         'NONE',
         ct.coin_amount,
         'finance_ledger',
         CASE WHEN ct.status = 'reversed' THEN 'reversed' ELSE 'successful' END,
         ct.created_at
       FROM popolive.coin_transactions ct
       WHERE ct.transaction_type IN ('admin_credit', 'admin_debit', 'initial_credit', 'reversal')
         AND ct.status IN ('completed', 'reversed') ${userClauseCoin}
       ON CONFLICT (source_table, source_tx_id) DO NOTHING`,
      params
    );

    // 7. Standalone points credits, adjustments & reversals (excluding rows already tracked by host_earning_shares)
    await client.query(
      `INSERT INTO popolive.financial_receipts (
         receipt_id, receipt_number, user_id, tx_category, source_table, source_tx_id, related_original_tx_id,
         title, title_ur, description, payment_amount, currency, coin_quantity, points_quantity, share_percentage, payment_method, status, issued_at
       )
       SELECT
         'RCP_' || pt.transaction_id,
         'PL-RCP-' || CASE WHEN pt.transaction_type = 'reversal' THEN 'REV' WHEN pt.transaction_type IN ('gift_earned','pk_gift_earned') THEN 'PTS' ELSE 'ADJ' END || '-' || UPPER(SUBSTRING(MD5(pt.transaction_id), 1, 10)),
         pt.host_user_id,
         CASE
           WHEN pt.transaction_type = 'reversal' THEN 'reversal'
           WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'points_credit'
           ELSE 'wallet_adjustment' END,
         'points_transactions',
         pt.transaction_id,
         pt.related_tx_id,
         CASE
           WHEN pt.transaction_type = 'reversal' THEN 'Host Points Reversal'
           WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'Host Points Credit'
           ELSE 'Authorized Points Adjustment' END,
         CASE
           WHEN pt.transaction_type = 'reversal' THEN 'ہوسٹ پوائنٹس منسوخی'
           WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'ہوسٹ پوائنٹس کریڈٹ'
           ELSE 'مستند پوائنٹس ایڈجسٹمنٹ' END,
         COALESCE(pt.description, pt.transaction_type || ' (' || pt.direction || ')'),
         0,
         'NONE',
         COALESCE(pt.source_gift_coins, 0),
         pt.points_amount,
         pt.share_percentage_applied,
         'points_ledger',
         CASE WHEN pt.status = 'reversed' THEN 'reversed' ELSE 'successful' END,
         pt.created_at
       FROM popolive.points_transactions pt
       WHERE (
         pt.transaction_type IN ('admin_credit', 'admin_debit', 'reversal')
         OR (
           pt.transaction_type IN ('gift_earned', 'pk_gift_earned')
           AND NOT EXISTS (SELECT 1 FROM popolive.host_earning_shares he2 WHERE he2.points_tx_id = pt.transaction_id)
         )
       )
       AND pt.status IN ('completed', 'reversed') ${userClausePts}
       ON CONFLICT (source_table, source_tx_id) DO NOTHING`,
      params
    );
  });
}

/**
 * Shared non-overlapping SQL CTE returning all Popo Live financial transactions across
 * all Phase 7 modules while keeping Coins, Points, Platform Share, and Cash Amounts separate.
 */
export function getUnifiedLedgerCteSql(): string {
  return `
    WITH unified_ledger AS (
      -- 1. Coin Top-ups (all statuses including failed/cancelled/pending)
      SELECT
        o.order_id AS record_id,
        'topup_payment_orders'::text AS source_table,
        o.user_id AS user_id,
        'topup'::text AS tx_category,
        ('Coin Top-up (' || o.package_name || ')')::text AS title,
        ('سکے ٹاپ اپ (' || o.package_name || ')')::text AS title_ur,
        ('Coin package: ' || o.package_name || ' (' || o.base_coins || ' + ' || o.bonus_coins || ' bonus)')::text AS description,
        o.amount::numeric(12,2) AS payment_amount,
        o.currency::text AS currency,
        o.base_coins::bigint AS coin_quantity,
        o.bonus_coins::bigint AS bonus_coin_quantity,
        0::bigint AS points_quantity,
        0::bigint AS platform_share_coins,
        NULL::numeric(5,2) AS share_percentage,
        o.provider_key::text AS payment_method,
        o.provider_payment_ref::text AS provider_reference_raw,
        CASE
          WHEN o.status = 'successful' THEN 'successful'
          WHEN o.status = 'created' THEN 'pending'
          ELSE o.status
        END::text AS normalized_status,
        (o.status IN ('successful', 'refunded', 'reversed')) AS receipt_eligible,
        o.receipt_id::text AS legacy_receipt_id,
        NULL::jsonb AS gift_summary,
        NULL::jsonb AS vip_summary,
        NULL::jsonb AS store_summary,
        COALESCE(o.verified_at, o.created_at) AS tx_at
      FROM popolive.topup_payment_orders o

      UNION ALL

      -- 2. VIP Purchases & Renewals (all statuses)
      SELECT
        vo.order_id AS record_id,
        'vip_membership_orders'::text AS source_table,
        vo.user_id AS user_id,
        CASE WHEN vo.order_type = 'renewal' THEN 'vip_renewal' ELSE 'vip_purchase' END::text AS tx_category,
        (CASE WHEN vo.order_type = 'renewal' THEN 'VIP Renewal (' || vo.plan_name || ')' ELSE 'VIP Membership (' || vo.plan_name || ')' END)::text AS title,
        (CASE WHEN vo.order_type = 'renewal' THEN 'وی آئی پی تجدید (' || vo.plan_name || ')' ELSE 'وی آئی پی رکنیت (' || vo.plan_name || ')' END)::text AS title_ur,
        (vo.plan_name || ' • ' || vo.duration_days || ' Days (Level ' || vo.vip_level || ')')::text AS description,
        vo.amount::numeric(12,2) AS payment_amount,
        vo.currency::text AS currency,
        COALESCE(vo.coins_charged, 0)::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        0::bigint AS points_quantity,
        0::bigint AS platform_share_coins,
        NULL::numeric(5,2) AS share_percentage,
        vo.provider_key::text AS payment_method,
        vo.payment_reference::text AS provider_reference_raw,
        CASE WHEN vo.status = 'verified' THEN 'successful' ELSE vo.status END::text AS normalized_status,
        (vo.status IN ('verified', 'refunded')) AS receipt_eligible,
        vr.receipt_id::text AS legacy_receipt_id,
        NULL::jsonb AS gift_summary,
        jsonb_build_object(
          'planId', vo.plan_id,
          'planName', vo.plan_name,
          'vipLevel', vo.vip_level,
          'orderType', vo.order_type,
          'durationDays', vo.duration_days
        ) AS vip_summary,
        NULL::jsonb AS store_summary,
        COALESCE(vo.verified_at, vo.created_at) AS tx_at
      FROM popolive.vip_membership_orders vo
      LEFT JOIN popolive.vip_receipts vr ON vr.order_id = vo.order_id

      UNION ALL

      -- 3. Gift Purchases (sender side)
      SELECT
        gt.gift_transaction_id AS record_id,
        'gift_transactions'::text AS source_table,
        gt.sender_user_id AS user_id,
        'gift_sent'::text AS tx_category,
        ('Gift Sent (' || gt.gift_name_snapshot || ' x' || gt.quantity || ')')::text AS title,
        ('تحفہ بھیجا گیا (' || gt.gift_name_snapshot || ' x' || gt.quantity || ')')::text AS title_ur,
        ('Sent ' || gt.gift_name_snapshot || ' x' || gt.quantity || ' to ' || gt.recipient_nickname)::text AS description,
        0::numeric(12,2) AS payment_amount,
        'NONE'::text AS currency,
        gt.total_coin_amount::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        gt.host_points_credited::bigint AS points_quantity,
        gt.platform_share::bigint AS platform_share_coins,
        gt.share_percentage::numeric(5,2) AS share_percentage,
        'coin_wallet'::text AS payment_method,
        NULL::text AS provider_reference_raw,
        CASE WHEN gt.status = 'completed' THEN 'successful' ELSE gt.status END::text AS normalized_status,
        (gt.status IN ('completed', 'reversed')) AS receipt_eligible,
        NULL::text AS legacy_receipt_id,
        jsonb_build_object(
          'giftId', gt.gift_id,
          'giftName', gt.gift_name_snapshot,
          'quantity', gt.quantity,
          'recipientHostId', gt.recipient_host_id,
          'recipientNickname', gt.recipient_nickname,
          'liveRoomId', gt.live_room_id,
          'pkBattleId', gt.pk_battle_id
        ) AS gift_summary,
        NULL::jsonb AS vip_summary,
        NULL::jsonb AS store_summary,
        gt.created_at AS tx_at
      FROM popolive.gift_transactions gt

      UNION ALL

      -- 4. Host Gift Earnings Shares (70% host non-cash points vs 30% platform share)
      SELECT
        he.earning_id AS record_id,
        'host_earning_shares'::text AS source_table,
        he.host_user_id AS user_id,
        'host_earning'::text AS tx_category,
        ('Host Earning (' || he.gift_name_snapshot || ' x' || he.gift_quantity || ')')::text AS title,
        ('ہوسٹ کمائی (' || he.gift_name_snapshot || ' x' || he.gift_quantity || ')')::text AS title_ur,
        ('70% Host Points from ' || he.gift_name_snapshot || ' x' || he.gift_quantity || ' (' || he.source_type || ')')::text AS description,
        0::numeric(12,2) AS payment_amount,
        'NONE'::text AS currency,
        he.original_coin_amount::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        he.points_credited::bigint AS points_quantity,
        he.platform_share_amount::bigint AS platform_share_coins,
        he.host_share_percentage::numeric(5,2) AS share_percentage,
        'host_share_70pct'::text AS payment_method,
        he.gift_transaction_id::text AS provider_reference_raw,
        CASE WHEN he.status = 'credited' THEN 'successful' ELSE he.status END::text AS normalized_status,
        (he.status IN ('credited', 'reversed')) AS receipt_eligible,
        NULL::text AS legacy_receipt_id,
        jsonb_build_object(
          'giftId', he.gift_id,
          'giftName', he.gift_name_snapshot,
          'quantity', he.gift_quantity,
          'sourceType', he.source_type,
          'giftTransactionId', he.gift_transaction_id
        ) AS gift_summary,
        NULL::jsonb AS vip_summary,
        NULL::jsonb AS store_summary,
        he.created_at AS tx_at
      FROM popolive.host_earning_shares he

      UNION ALL

      -- 5. Store Purchases
      SELECT
        sp.purchase_id AS record_id,
        'store_purchases'::text AS source_table,
        sp.user_id AS user_id,
        'store_purchase'::text AS tx_category,
        ('Store Purchase (' || sp.item_name_snapshot || ')')::text AS title,
        ('اسٹور خریداری (' || sp.item_name_snapshot || ')')::text AS title_ur,
        ('Virtual Store item: ' || sp.item_name_snapshot || ' x' || sp.quantity)::text AS description,
        0::numeric(12,2) AS payment_amount,
        'NONE'::text AS currency,
        sp.total_coins::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        0::bigint AS points_quantity,
        0::bigint AS platform_share_coins,
        NULL::numeric(5,2) AS share_percentage,
        'coin_wallet'::text AS payment_method,
        NULL::text AS provider_reference_raw,
        CASE WHEN sp.status = 'completed' THEN 'successful' ELSE sp.status END::text AS normalized_status,
        (sp.status IN ('completed', 'refunded', 'reversed')) AS receipt_eligible,
        NULL::text AS legacy_receipt_id,
        NULL::jsonb AS gift_summary,
        NULL::jsonb AS vip_summary,
        jsonb_build_object(
          'purchaseId', sp.purchase_id,
          'itemId', sp.item_id,
          'itemName', sp.item_name_snapshot,
          'categoryId', sp.category_id,
          'quantity', sp.quantity,
          'unitCoinPrice', sp.unit_coin_price,
          'inventoryId', sp.inventory_id
        ) AS store_summary,
        sp.created_at AS tx_at
      FROM popolive.store_purchases sp

      UNION ALL

      -- 6. Standalone Coin Refunds, Reversals & Admin Adjustments
      SELECT
        ct.transaction_id AS record_id,
        'coin_transactions'::text AS source_table,
        ct.user_id AS user_id,
        CASE
          WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'refund'
          WHEN ct.transaction_type = 'reversal' THEN 'reversal'
          ELSE 'wallet_adjustment'
        END::text AS tx_category,
        CASE
          WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'Approved Coin Refund'
          WHEN ct.transaction_type = 'reversal' THEN 'Coin Transaction Reversal'
          WHEN ct.transaction_type = 'initial_credit' THEN 'Initial Coin Grant'
          ELSE 'Authorized Coin Wallet Adjustment'
        END::text AS title,
        CASE
          WHEN (COALESCE(ct.reference_id,'') LIKE 'REFUND:%' OR COALESCE(ct.reference_id,'') LIKE 'STORE_REFUND:%' OR COALESCE(ct.idempotency_key,'') LIKE 'vip_coin_refund_%') THEN 'منظور شدہ سکے کی واپسی'
          WHEN ct.transaction_type = 'reversal' THEN 'سکے کی ٹرانزیکشن منسوخی'
          ELSE 'مستند سکے والٹ ایڈجسٹمنٹ'
        END::text AS title_ur,
        COALESCE(ct.description, ct.transaction_type || ' (' || ct.direction || ')')::text AS description,
        0::numeric(12,2) AS payment_amount,
        'NONE'::text AS currency,
        ct.coin_amount::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        0::bigint AS points_quantity,
        0::bigint AS platform_share_coins,
        NULL::numeric(5,2) AS share_percentage,
        'finance_ledger'::text AS payment_method,
        ct.related_tx_id::text AS provider_reference_raw,
        CASE WHEN ct.status = 'completed' THEN 'successful' ELSE ct.status END::text AS normalized_status,
        (ct.status IN ('completed', 'reversed')) AS receipt_eligible,
        NULL::text AS legacy_receipt_id,
        NULL::jsonb AS gift_summary,
        NULL::jsonb AS vip_summary,
        NULL::jsonb AS store_summary,
        ct.created_at AS tx_at
      FROM popolive.coin_transactions ct
      WHERE ct.transaction_type IN ('admin_credit', 'admin_debit', 'initial_credit', 'reversal')

      UNION ALL

      -- 7. Standalone Points Credits, Reversals & Adjustments (excluding already tracked host_earning_shares)
      SELECT
        pt.transaction_id AS record_id,
        'points_transactions'::text AS source_table,
        pt.host_user_id AS user_id,
        CASE
          WHEN pt.transaction_type = 'reversal' THEN 'reversal'
          WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'points_credit'
          ELSE 'wallet_adjustment'
        END::text AS tx_category,
        CASE
          WHEN pt.transaction_type = 'reversal' THEN 'Host Points Reversal'
          WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'Host Points Credit'
          ELSE 'Authorized Points Adjustment'
        END::text AS title,
        CASE
          WHEN pt.transaction_type = 'reversal' THEN 'ہوسٹ پوائنٹس منسوخی'
          WHEN pt.transaction_type IN ('gift_earned', 'pk_gift_earned') THEN 'ہوسٹ پوائنٹس کریڈٹ'
          ELSE 'مستند پوائنٹس ایڈجسٹمنٹ'
        END::text AS title_ur,
        COALESCE(pt.description, pt.transaction_type || ' (' || pt.direction || ')')::text AS description,
        0::numeric(12,2) AS payment_amount,
        'NONE'::text AS currency,
        COALESCE(pt.source_gift_coins, 0)::bigint AS coin_quantity,
        0::bigint AS bonus_coin_quantity,
        pt.points_amount::bigint AS points_quantity,
        0::bigint AS platform_share_coins,
        pt.share_percentage_applied::numeric(5,2) AS share_percentage,
        'points_ledger'::text AS payment_method,
        pt.related_tx_id::text AS provider_reference_raw,
        CASE WHEN pt.status = 'completed' THEN 'successful' ELSE pt.status END::text AS normalized_status,
        (pt.status IN ('completed', 'reversed')) AS receipt_eligible,
        NULL::text AS legacy_receipt_id,
        NULL::jsonb AS gift_summary,
        NULL::jsonb AS vip_summary,
        NULL::jsonb AS store_summary,
        pt.created_at AS tx_at
      FROM popolive.points_transactions pt
      WHERE pt.transaction_type IN ('admin_credit', 'admin_debit', 'reversal')
         OR (
           pt.transaction_type IN ('gift_earned', 'pk_gift_earned')
           AND NOT EXISTS (SELECT 1 FROM popolive.host_earning_shares he2 WHERE he2.points_tx_id = pt.transaction_id)
         )
    )
  `;
}

function buildItemDetailSummary(row: any): string {
  if (row.gift_summary) {
    const g = row.gift_summary;
    return `${g.giftName || 'Gift'} x${g.quantity || 1}${g.recipientNickname ? ` (Recipient: ${g.recipientNickname})` : ''}`;
  }
  if (row.vip_summary) {
    const v = row.vip_summary;
    return `${v.planName || 'VIP Plan'} (Level ${v.vipLevel || 1}, ${v.durationDays || 30} days, ${v.orderType || 'purchase'})`;
  }
  if (row.store_summary) {
    const s = row.store_summary;
    return `${s.itemName || 'Store Item'} x${s.quantity || 1} (${s.unitCoinPrice || 0} Coins each)`;
  }
  if (row.tx_category === 'topup') {
    return `${Number(row.coin_quantity || 0).toLocaleString()} Coins + ${Number(row.bonus_coin_quantity || 0).toLocaleString()} Bonus Coins`;
  }
  return row.description || row.title || 'Financial Ledger Record';
}

function mapLedgerRow(row: any): FinanceLedgerItem {
  return {
    recordId: row.record_id,
    sourceTable: row.source_table,
    userId: row.user_id,
    userNickname: row.user_nickname || null,
    userPoppoId: row.user_poppo_id || null,
    txCategory: row.tx_category as FinanceTxCategory,
    title: row.title,
    titleUr: row.title_ur || row.title,
    description: row.description || row.title,
    paymentAmount: Number(row.payment_amount || 0),
    currency: row.currency || 'NONE',
    coinQuantity: parseInt(String(row.coin_quantity ?? 0), 10),
    bonusCoinQuantity: parseInt(String(row.bonus_coin_quantity ?? 0), 10),
    pointsQuantity: parseInt(String(row.points_quantity ?? 0), 10),
    platformShareCoins: parseInt(String(row.platform_share_coins ?? 0), 10),
    sharePercentage: row.share_percentage !== null && row.share_percentage !== undefined ? Number(row.share_percentage) : null,
    paymentMethod: row.payment_method || null,
    providerReferenceMasked: maskProviderReference(row.provider_reference_raw),
    status: row.normalized_status as FinanceTxStatus,
    receiptEligible: Boolean(row.receipt_eligible) && Boolean(row.receipt_id),
    receiptId: row.receipt_eligible ? row.receipt_id || null : null,
    receiptNumber: row.receipt_eligible ? row.receipt_number || null : null,
    legacyReceiptId: row.legacy_receipt_id || null,
    giftSummary: row.gift_summary || null,
    vipSummary: row.vip_summary || null,
    storeSummary: row.store_summary || null,
    itemDetailSummary: buildItemDetailSummary(row),
    issuedAt: new Date(row.tx_at).toISOString(),
  };
}

export interface QueryFinanceHistoryOptions {
  userId: string;
  txCategory?: string | null;
  status?: string | null;
  search?: string | null;
  preset?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  limit?: number;
}

export async function queryUserFinanceHistory(options: QueryFinanceHistoryOptions) {
  const canonicalUserId = await resolveCanonicalFinanceUserId(options.userId);
  await ensureReceiptsSynced(canonicalUserId);

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
  const offset = (page - 1) * limit;

  const { fromIso, toIso } = resolveDatePresetBounds({
    preset: options.preset,
    fromDate: options.fromDate,
    toDate: options.toDate,
  });

  const conditions: string[] = ['ul.user_id = $1'];
  const params: any[] = [canonicalUserId];

  if (options.txCategory && options.txCategory !== 'all') {
    const cleanCat = options.txCategory.trim().toLowerCase();
    if (cleanCat === 'refunds') {
      conditions.push(`(ul.tx_category IN ('refund', 'reversal') OR ul.normalized_status IN ('refunded', 'reversed'))`);
    } else if (cleanCat === 'vip') {
      conditions.push(`ul.tx_category IN ('vip_purchase', 'vip_renewal')`);
    } else if (cleanCat === 'earnings') {
      conditions.push(`ul.tx_category IN ('host_earning', 'points_credit')`);
    } else {
      params.push(cleanCat);
      conditions.push(`ul.tx_category = $${params.length}`);
    }
  }

  if (options.status && options.status !== 'all') {
    const cleanStatus = options.status.trim().toLowerCase();
    params.push(cleanStatus);
    conditions.push(`ul.normalized_status = $${params.length}`);
  }

  if (fromIso) {
    params.push(fromIso);
    conditions.push(`ul.tx_at >= $${params.length}::timestamptz`);
  }
  if (toIso) {
    params.push(toIso);
    conditions.push(`ul.tx_at <= $${params.length}::timestamptz`);
  }

  if (options.search && options.search.trim()) {
    params.push(`%${options.search.trim()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(
      `(ul.record_id ILIKE ${pIdx} OR ul.title ILIKE ${pIdx} OR ul.description ILIKE ${pIdx} OR ul.tx_category ILIKE ${pIdx} OR COALESCE(fr.receipt_id,'') ILIKE ${pIdx} OR COALESCE(fr.receipt_number,'') ILIKE ${pIdx} OR COALESCE(ul.legacy_receipt_id,'') ILIKE ${pIdx})`
    );
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;
  const cteSql = getUnifiedLedgerCteSql();

  const countRows = await query<{ total: number }>(
    `${cteSql}
     SELECT COUNT(*)::int AS total
     FROM unified_ledger ul
     LEFT JOIN popolive.financial_receipts fr
       ON fr.source_table = ul.source_table AND fr.source_tx_id = ul.record_id
     ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const listParams = [...params, limit, offset];
  const rows = await query<any>(
    `${cteSql}
     SELECT
       ul.*,
       fr.receipt_id,
       fr.receipt_number,
       u.nickname AS user_nickname,
       u.poppo_id AS user_poppo_id
     FROM unified_ledger ul
     LEFT JOIN popolive.financial_receipts fr
       ON fr.source_table = ul.source_table AND fr.source_tx_id = ul.record_id
     LEFT JOIN popolive.users u
       ON u.id::text = ul.user_id OR u.poppo_id = ul.user_id
     ${whereSql}
     ORDER BY ul.tx_at DESC, ul.record_id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  // Separate summary metrics (never combining cash, coins, and points)
  const summaryRows = await query<any>(
    `${cteSql}
     SELECT
       COALESCE(SUM(CASE WHEN ul.tx_category = 'topup' AND ul.normalized_status = 'successful' THEN ul.payment_amount ELSE 0 END), 0)::numeric(12,2) AS topup_payment_total,
       COALESCE(SUM(CASE WHEN ul.tx_category = 'topup' AND ul.normalized_status = 'successful' THEN ul.coin_quantity + ul.bonus_coin_quantity ELSE 0 END), 0)::bigint AS topup_coins_total,
       COALESCE(SUM(CASE WHEN ul.tx_category = 'gift_sent' AND ul.normalized_status = 'successful' THEN ul.coin_quantity ELSE 0 END), 0)::bigint AS gift_coins_spent,
       COALESCE(SUM(CASE WHEN ul.tx_category IN ('host_earning','points_credit') AND ul.normalized_status = 'successful' THEN ul.points_quantity ELSE 0 END), 0)::bigint AS host_points_earned,
       COALESCE(SUM(CASE WHEN ul.tx_category = 'store_purchase' AND ul.normalized_status = 'successful' THEN ul.coin_quantity ELSE 0 END), 0)::bigint AS store_coins_spent,
       COUNT(*) FILTER (WHERE ul.normalized_status IN ('refunded', 'reversed') OR ul.tx_category IN ('refund','reversal'))::int AS refunds_reversals_count,
       COUNT(*) FILTER (WHERE ul.receipt_eligible)::int AS receipts_count
     FROM unified_ledger ul
     WHERE ul.user_id = $1`,
    [canonicalUserId]
  );

  const s = summaryRows[0] || {};
  return {
    userId: canonicalUserId,
    items: rows.map(mapLedgerRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      totalVerifiedTopupPaymentAmount: Number(s.topup_payment_total || 0),
      totalTopupCoinsReceived: parseInt(String(s.topup_coins_total ?? 0), 10),
      totalGiftCoinsSent: parseInt(String(s.gift_coins_spent ?? 0), 10),
      totalHostPointsCredited: parseInt(String(s.host_points_earned ?? 0), 10),
      totalStoreCoinsSpent: parseInt(String(s.store_coins_spent ?? 0), 10),
      refundsAndReversalsCount: parseInt(String(s.refunds_reversals_count ?? 0), 10),
      eligibleReceiptsCount: parseInt(String(s.receipts_count ?? 0), 10),
    },
  };
}

export async function listUserReceipts(params: {
  userId: string;
  txCategory?: string | null;
  status?: string | null;
  search?: string | null;
  preset?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  limit?: number;
}) {
  const canonicalUserId = await resolveCanonicalFinanceUserId(params.userId);
  await ensureReceiptsSynced(canonicalUserId);

  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
  const offset = (page - 1) * limit;

  const { fromIso, toIso } = resolveDatePresetBounds({
    preset: params.preset,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });

  const conditions: string[] = ['fr.user_id = $1'];
  const qParams: any[] = [canonicalUserId];

  if (params.txCategory && params.txCategory !== 'all') {
    const cleanCat = params.txCategory.trim().toLowerCase();
    if (cleanCat === 'refunds') {
      conditions.push(`(fr.tx_category IN ('refund','reversal') OR fr.status IN ('refunded','reversed'))`);
    } else if (cleanCat === 'vip') {
      conditions.push(`fr.tx_category IN ('vip_purchase', 'vip_renewal')`);
    } else if (cleanCat === 'earnings') {
      conditions.push(`fr.tx_category IN ('host_earning', 'points_credit')`);
    } else {
      qParams.push(cleanCat);
      conditions.push(`fr.tx_category = $${qParams.length}`);
    }
  }

  if (params.status && params.status !== 'all') {
    qParams.push(params.status.trim().toLowerCase());
    conditions.push(`fr.status = $${qParams.length}`);
  }

  if (fromIso) {
    qParams.push(fromIso);
    conditions.push(`fr.issued_at >= $${qParams.length}::timestamptz`);
  }
  if (toIso) {
    qParams.push(toIso);
    conditions.push(`fr.issued_at <= $${qParams.length}::timestamptz`);
  }

  if (params.search && params.search.trim()) {
    qParams.push(`%${params.search.trim()}%`);
    const pIdx = `$${qParams.length}`;
    conditions.push(
      `(fr.receipt_id ILIKE ${pIdx} OR fr.receipt_number ILIKE ${pIdx} OR fr.source_tx_id ILIKE ${pIdx} OR fr.title ILIKE ${pIdx} OR fr.description ILIKE ${pIdx} OR COALESCE(fr.legacy_receipt_id,'') ILIKE ${pIdx})`
    );
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;
  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM popolive.financial_receipts fr ${whereSql}`,
    qParams
  );
  const total = countRows[0]?.total || 0;

  const listParams = [...qParams, limit, offset];
  const rows = await query<any>(
    `SELECT fr.*, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
     FROM popolive.financial_receipts fr
     LEFT JOIN popolive.users u ON u.id::text = fr.user_id OR u.poppo_id = fr.user_id
     ${whereSql}
     ORDER BY fr.issued_at DESC, fr.receipt_id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    userId: canonicalUserId,
    receipts: rows.map(mapFinancialReceiptRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function mapFinancialReceiptRow(row: any): FinancialReceiptRecord {
  const isHostPts = row.tx_category === 'host_earning' || row.tx_category === 'points_credit';
  return {
    receiptId: row.receipt_id,
    receiptNumber: row.receipt_number,
    transactionId: row.source_tx_id,
    sourceTable: row.source_table,
    relatedOriginalTxId: row.related_original_tx_id || null,
    legacyReceiptId: row.legacy_receipt_id || null,
    userId: row.user_id,
    userNickname: row.user_nickname || null,
    userPoppoId: row.user_poppo_id || null,
    txCategory: row.tx_category as FinanceTxCategory,
    title: row.title,
    titleUr: row.title_ur || row.title,
    description: row.description || row.title,
    paymentAmount: Number(row.payment_amount || 0),
    currency: row.currency || 'NONE',
    coinQuantity: parseInt(String(row.coin_quantity ?? 0), 10),
    bonusCoinQuantity: parseInt(String(row.bonus_coin_quantity ?? 0), 10),
    pointsQuantity: parseInt(String(row.points_quantity ?? 0), 10),
    platformShareCoins: parseInt(String(row.platform_share_coins ?? 0), 10),
    sharePercentage: row.share_percentage !== null && row.share_percentage !== undefined ? Number(row.share_percentage) : null,
    paymentMethod: row.payment_method || null,
    providerReferenceMasked: maskProviderReference(row.provider_reference_masked),
    status: row.status as ReceiptStatus,
    giftSummary: row.gift_summary || null,
    vipSummary: row.vip_summary || null,
    storeSummary: row.store_summary || null,
    itemDetailSummary: buildItemDetailSummary({
      gift_summary: row.gift_summary,
      vip_summary: row.vip_summary,
      store_summary: row.store_summary,
      tx_category: row.tx_category,
      coin_quantity: row.coin_quantity,
      bonus_coin_quantity: row.bonus_coin_quantity,
      description: row.description,
      title: row.title,
    }),
    nonCashPointsNote: isHostPts
      ? 'Host Points are non-cash platform earning credits calculated strictly from approved gift coins (70% Host Share / 30% Platform Share).'
      : null,
    issuedAt: new Date(row.issued_at).toISOString(),
  };
}

export async function getReceiptDetailForActor(params: {
  receiptOrTxId: string;
  actor: WalletActorContext;
  isPreviewDemo?: boolean;
}): Promise<FinancialReceiptRecord> {
  const cleanId = (params.receiptOrTxId || '').trim();
  if (!cleanId) {
    throw new FinanceReceiptError(400, 'RECEIPT_ID_REQUIRED', 'Receipt or transaction ID is required.');
  }

  let rows = await query<any>(
    `SELECT fr.*, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
     FROM popolive.financial_receipts fr
     LEFT JOIN popolive.users u ON u.id::text = fr.user_id OR u.poppo_id = fr.user_id
     WHERE fr.receipt_id = $1
        OR fr.receipt_number = $1
        OR fr.source_tx_id = $1
        OR fr.legacy_receipt_id = $1
     LIMIT 1`,
    [cleanId]
  );

  // Lazy sync if record came from an external transaction right before lookup
  if (rows.length === 0) {
    const cteSql = getUnifiedLedgerCteSql();
    const ledgerCheck = await query<any>(
      `${cteSql} SELECT ul.user_id, ul.normalized_status, ul.receipt_eligible FROM unified_ledger ul WHERE ul.record_id = $1 OR ul.legacy_receipt_id = $1 LIMIT 1`,
      [cleanId]
    );
    if (ledgerCheck.length > 0) {
      const targetRow = ledgerCheck[0];
      if (!canAccessPrivateWallet(params.actor, targetRow.user_id, Boolean(params.isPreviewDemo))) {
        throw new FinanceReceiptError(403, 'FORBIDDEN_RECEIPT_ACCESS', 'You are not authorized to access another user financial record.');
      }
      if (!targetRow.receipt_eligible) {
        throw new FinanceReceiptError(
          422,
          'RECEIPT_NOT_ISSUED_FOR_INCOMPLETE_TX',
          `Receipts are never issued for ${targetRow.normalized_status} transactions. View transaction history status instead.`
        );
      }
      await ensureReceiptsSynced(targetRow.user_id);
      rows = await query<any>(
        `SELECT fr.*, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
         FROM popolive.financial_receipts fr
         LEFT JOIN popolive.users u ON u.id::text = fr.user_id OR u.poppo_id = fr.user_id
         WHERE fr.source_tx_id = $1 OR fr.legacy_receipt_id = $1
         LIMIT 1`,
        [cleanId]
      );
    }
  }

  if (rows.length === 0) {
    throw new FinanceReceiptError(404, 'RECEIPT_NOT_FOUND', 'Receipt not found or not eligible for receipt generation.');
  }

  const row = rows[0];
  if (!canAccessPrivateWallet(params.actor, row.user_id, Boolean(params.isPreviewDemo))) {
    throw new FinanceReceiptError(403, 'FORBIDDEN_RECEIPT_ACCESS', 'Forbidden: You cannot view another user financial receipt.');
  }

  return mapFinancialReceiptRow(row);
}

export async function generateReceiptPdfDownload(params: {
  receiptOrTxId: string;
  actor: WalletActorContext;
  isPreviewDemo?: boolean;
}): Promise<{ buffer: Buffer; fileName: string; receipt: FinancialReceiptRecord }> {
  const receipt = await getReceiptDetailForActor(params);

  const buffer = generateReceiptPdfBuffer({
    receiptId: receipt.receiptId,
    receiptNumber: receipt.receiptNumber,
    transactionId: receipt.transactionId,
    userId: receipt.userId,
    userNickname: receipt.userNickname,
    userPoppoId: receipt.userPoppoId,
    txCategory: receipt.txCategory,
    title: receipt.title,
    description: receipt.description,
    paymentAmount: receipt.paymentAmount,
    currency: receipt.currency,
    coinQuantity: receipt.coinQuantity,
    bonusCoinQuantity: receipt.bonusCoinQuantity,
    pointsQuantity: receipt.pointsQuantity,
    platformShareCoins: receipt.platformShareCoins,
    sharePercentage: receipt.sharePercentage,
    paymentMethod: receipt.paymentMethod,
    providerReferenceMasked: receipt.providerReferenceMasked,
    status: receipt.status,
    issuedAt: receipt.issuedAt,
    itemDetailSummary: receipt.itemDetailSummary,
  });

  // Record audit trail for PDF receipt download
  await query(
    `INSERT INTO popolive.finance_export_audit_logs (
       audit_id, receipt_id, actor_id, actor_role, action_type, export_format, record_count, ip_address, status, details
     ) VALUES ($1, $2, $3, $4, 'receipt_pdf_downloaded', 'pdf', 1, $5, 'success', $6)`,
    [
      generateFinanceId('AUD_FIN'),
      receipt.receiptId,
      params.actor.actorId,
      params.actor.actorRole,
      params.actor.ipAddress,
      `Downloaded receipt PDF ${receipt.receiptNumber} for user ${receipt.userId}`,
    ]
  ).catch(() => {});

  const safeNumber = receipt.receiptNumber.replace(/[^A-Za-z0-9_-]/g, '_');
  return {
    buffer,
    fileName: `PopoLive_${safeNumber}.pdf`,
    receipt,
  };
}
