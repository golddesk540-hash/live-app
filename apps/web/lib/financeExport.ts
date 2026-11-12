import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { isAuthorizedFinanceAdmin } from '@/lib/wallet';
import { WalletActorContext } from '@/lib/walletAuth';
import {
  generateFinanceId,
  getUnifiedLedgerCteSql,
  maskProviderReference,
  resolveDatePresetBounds,
} from '@/lib/receipts';
import { generateFinanceReportPdfBuffer } from '@/lib/pdfGenerator';
import { buildXlsxWorkbook, XlsxSheetInput } from '@/lib/xlsxGenerator';

// =============================================================================
// Popo Live Phase 7 Module 7.10 — Finance Admin Reporting & Private Export Engine
// Strictly enforces finance_admin RBAC, formula-safe CSV/XLSX, PDF generation,
// private non-public storage, SHA-256 verification, expiring HMAC links & audits.
// =============================================================================

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const EXPORT_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes expiry window

export type FinanceReportType =
  | 'transactions'
  | 'payments'
  | 'host_earnings'
  | 'refunds_reversals'
  | 'executive_summary';

export type FinanceExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface FinanceReportFilter {
  preset?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  txCategory?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  currency?: string | null;
  search?: string | null;
}

export class FinanceExportError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getPrivateExportDirectory(): string {
  // Outside public/ web root — never exposed statically
  const dir = path.resolve(process.cwd(), 'storage', 'finance_exports');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function escapeExportCsvCell(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function signExportDownloadToken(exportId: string, expiresAtMs: number): string {
  const payload = `${exportId}.${expiresAtMs}`;
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyExportDownloadToken(exportId: string, token: string): { valid: boolean; expired: boolean } {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return { valid: false, expired: false };
  const [tid, expStr, sig] = parts;
  if (tid !== exportId) return { valid: false, expired: false };
  const expMs = Number(expStr);
  if (!Number.isFinite(expMs)) return { valid: false, expired: false };
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(`${tid}.${expStr}`).digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, expired: false };
  }
  if (Date.now() > expMs) {
    return { valid: false, expired: true };
  }
  return { valid: true, expired: false };
}

function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function assertFinanceAdminActor(actor: WalletActorContext): void {
  if (!actor.user) {
    throw new FinanceExportError(401, 'UNAUTHORIZED', 'Authentication required.');
  }
  if (!isAuthorizedFinanceAdmin(actor.actorRole)) {
    throw new FinanceExportError(
      403,
      'FINANCE_ADMIN_REQUIRED',
      'Forbidden: Only authorized finance_admin or super_admin roles can access finance reports and exports.'
    );
  }
}

async function computePeriodKpiSlice(fromIso: string | null, toIso: string | null, currencyFilter?: string | null) {
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (fromIso) {
    params.push(fromIso);
    conditions.push(`ul.tx_at >= $${params.length}::timestamptz`);
  }
  if (toIso) {
    params.push(toIso);
    conditions.push(`ul.tx_at <= $${params.length}::timestamptz`);
  }
  if (currencyFilter && currencyFilter !== 'ALL') {
    params.push(currencyFilter.toUpperCase());
    conditions.push(`(ul.currency = $${params.length} OR ul.currency = 'NONE')`);
  }

  const cteSql = getUnifiedLedgerCteSql();
  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  const [aggRows, currencyRows] = await Promise.all([
    query<any>(
      `${cteSql}
       SELECT
         COUNT(*) FILTER (WHERE ul.tx_category = 'topup' AND ul.normalized_status = 'successful')::int AS verified_topup_count,
         COALESCE(SUM(CASE WHEN ul.tx_category = 'topup' AND ul.normalized_status = 'successful' THEN ul.coin_quantity + ul.bonus_coin_quantity ELSE 0 END), 0)::bigint AS total_topup_coins_credited,
         COUNT(*) FILTER (WHERE ul.tx_category = 'gift_sent' AND ul.normalized_status = 'successful')::int AS gift_tx_count,
         COALESCE(SUM(CASE WHEN ul.tx_category = 'gift_sent' AND ul.normalized_status = 'successful' THEN ul.coin_quantity ELSE 0 END), 0)::bigint AS total_gift_coins,
         COALESCE(SUM(CASE WHEN ul.tx_category IN ('host_earning','points_credit') AND ul.normalized_status = 'successful' THEN ul.points_quantity ELSE 0 END), 0)::bigint AS total_host_points_credited,
         COALESCE(SUM(CASE WHEN ul.tx_category = 'host_earning' AND ul.normalized_status = 'successful' THEN ul.platform_share_coins ELSE 0 END), 0)::bigint AS total_platform_share_coins,
         COUNT(*) FILTER (WHERE ul.tx_category IN ('vip_purchase','vip_renewal') AND ul.normalized_status = 'successful')::int AS vip_purchase_count,
         COALESCE(SUM(CASE WHEN ul.tx_category IN ('vip_purchase','vip_renewal') AND ul.normalized_status = 'successful' THEN ul.coin_quantity ELSE 0 END), 0)::bigint AS total_vip_coins_spent,
         COUNT(*) FILTER (WHERE ul.tx_category = 'store_purchase' AND ul.normalized_status = 'successful')::int AS store_purchase_count,
         COALESCE(SUM(CASE WHEN ul.tx_category = 'store_purchase' AND ul.normalized_status = 'successful' THEN ul.coin_quantity ELSE 0 END), 0)::bigint AS total_store_coins_spent,
         COUNT(*) FILTER (WHERE ul.tx_category = 'refund' OR ul.normalized_status = 'refunded')::int AS refunds_count,
         COUNT(*) FILTER (WHERE ul.tx_category = 'reversal' OR ul.normalized_status = 'reversed')::int AS reversals_count,
         COUNT(*) FILTER (WHERE ul.normalized_status IN ('pending','processing'))::int AS pending_payments_count,
         COUNT(*) FILTER (WHERE ul.normalized_status IN ('failed','cancelled','expired'))::int AS failed_payments_count
       FROM unified_ledger ul
       ${whereSql}`,
      params
    ),
    query<any>(
      `${cteSql}
       SELECT
         ul.currency,
         COALESCE(SUM(CASE WHEN ul.tx_category = 'topup' AND ul.normalized_status = 'successful' THEN ul.payment_amount ELSE 0 END), 0)::numeric(14,2) AS topup_cash_total,
         COALESCE(SUM(CASE WHEN ul.tx_category IN ('vip_purchase','vip_renewal') AND ul.normalized_status = 'successful' THEN ul.payment_amount ELSE 0 END), 0)::numeric(14,2) AS vip_cash_total
       FROM unified_ledger ul
       ${whereSql} AND ul.currency <> 'NONE' AND ul.payment_amount > 0
       GROUP BY ul.currency
       ORDER BY ul.currency ASC`,
      params
    ),
  ]);

  const a = aggRows[0] || {};
  return {
    verifiedTopupRevenueByCurrency: currencyRows.map((c: any) => ({
      currency: c.currency,
      topupPaymentTotal: Number(c.topup_cash_total || 0),
      vipPaymentTotal: Number(c.vip_cash_total || 0),
      combinedVerifiedCashTotal: Number((Number(c.topup_cash_total || 0) + Number(c.vip_cash_total || 0)).toFixed(2)),
    })),
    verifiedTopupCount: a.verified_topup_count || 0,
    totalCoinsCredited: parseInt(String(a.total_topup_coins_credited ?? 0), 10),
    giftTransactionsCount: a.gift_tx_count || 0,
    totalGiftCoinTransactionsVolume: parseInt(String(a.total_gift_coins ?? 0), 10),
    totalHostPointsCredited: parseInt(String(a.total_host_points_credited ?? 0), 10),
    totalPlatformShareCoins: parseInt(String(a.total_platform_share_coins ?? 0), 10),
    vipPurchasesCount: a.vip_purchase_count || 0,
    totalVipCoinsSpent: parseInt(String(a.total_vip_coins_spent ?? 0), 10),
    storePurchasesCount: a.store_purchase_count || 0,
    totalStoreCoinsSpent: parseInt(String(a.total_store_coins_spent ?? 0), 10),
    totalRefundsCount: a.refunds_count || 0,
    totalReversalsCount: a.reversals_count || 0,
    pendingPaymentsCount: a.pending_payments_count || 0,
    failedPaymentsCount: a.failed_payments_count || 0,
  };
}

export async function getFinanceAdminDashboardMetrics(
  actor: WalletActorContext,
  filters: FinanceReportFilter = {}
) {
  assertFinanceAdminActor(actor);

  const selectedBounds = resolveDatePresetBounds({
    preset: filters.preset || 'last_30d',
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const dailyBounds = resolveDatePresetBounds({ preset: 'today' });
  const weeklyBounds = resolveDatePresetBounds({ preset: 'last_7d' });
  const monthlyBounds = resolveDatePresetBounds({ preset: 'this_month' });

  const [selectedSlice, dailySlice, weeklySlice, monthlySlice] = await Promise.all([
    computePeriodKpiSlice(selectedBounds.fromIso, selectedBounds.toIso, filters.currency),
    computePeriodKpiSlice(dailyBounds.fromIso, dailyBounds.toIso, filters.currency),
    computePeriodKpiSlice(weeklyBounds.fromIso, weeklyBounds.toIso, filters.currency),
    computePeriodKpiSlice(monthlyBounds.fromIso, monthlyBounds.toIso, filters.currency),
  ]);

  // Persist lightweight executive snapshot for finance reporting trace
  await query(
    `INSERT INTO popolive.finance_report_snapshots (
       report_id, period_key, period_start, period_end, currency_filter, summary_json, generated_by
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      generateFinanceId('RPT_SNAP'),
      filters.preset || 'last_30d',
      selectedBounds.fromIso,
      selectedBounds.toIso,
      (filters.currency || 'ALL').toUpperCase(),
      JSON.stringify(selectedSlice),
      actor.actorId,
    ]
  ).catch(() => {});

  return {
    periodLabel: selectedBounds.label,
    currencyFilter: (filters.currency || 'ALL').toUpperCase(),
    selected: selectedSlice,
    windows: {
      daily: dailySlice,
      weekly: weeklySlice,
      monthly: monthlySlice,
    },
    separationPolicyNote:
      'Cash payments, Coins, Non-Cash Host Points (70% share), and Platform Share (30%) are tracked and reported strictly in separate columns.',
  };
}

export async function queryAdminHostEarningsReport(
  actor: WalletActorContext,
  filters: FinanceReportFilter = {},
  page: number = 1,
  limit: number = 50
) {
  assertFinanceAdminActor(actor);

  const bounds = resolveDatePresetBounds({
    preset: filters.preset || 'all',
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(200, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const conds: string[] = ['1=1'];
  const params: any[] = [];
  if (bounds.fromIso) {
    params.push(bounds.fromIso);
    conds.push(`he.created_at >= $${params.length}::timestamptz`);
  }
  if (bounds.toIso) {
    params.push(bounds.toIso);
    conds.push(`he.created_at <= $${params.length}::timestamptz`);
  }
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status.toLowerCase() === 'successful' ? 'credited' : filters.status.toLowerCase());
    conds.push(`he.status = $${params.length}`);
  }
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const pIdx = `$${params.length}`;
    conds.push(`(he.host_user_id ILIKE ${pIdx} OR he.host_nickname ILIKE ${pIdx} OR COALESCE(u.poppo_id,'') ILIKE ${pIdx} OR he.earning_id ILIKE ${pIdx})`);
  }

  const whereSql = `WHERE ${conds.join(' AND ')}`;
  const hostRows = await query<any>(
    `SELECT
       he.host_user_id,
       COALESCE(MAX(u.nickname), MAX(he.host_nickname), 'Host') AS host_nickname,
       MAX(u.poppo_id) AS host_poppo_id,
       COUNT(*)::int AS total_shares_count,
       COUNT(*) FILTER (WHERE he.status = 'credited')::int AS credited_count,
       COUNT(*) FILTER (WHERE he.status = 'reversed')::int AS reversed_count,
       COALESCE(SUM(CASE WHEN he.status = 'credited' THEN he.original_coin_amount ELSE 0 END), 0)::bigint AS gross_gift_coins,
       COALESCE(SUM(CASE WHEN he.status = 'credited' THEN he.points_credited ELSE 0 END), 0)::bigint AS gross_host_points,
       COALESCE(SUM(CASE WHEN he.status = 'reversed' THEN he.points_credited ELSE 0 END), 0)::bigint AS reversed_host_points,
       COALESCE(SUM(CASE WHEN he.status = 'credited' THEN he.platform_share_amount ELSE 0 END), 0)::bigint AS platform_share_coins,
       ROUND(AVG(he.host_share_percentage), 2)::numeric(5,2) AS avg_host_share_pct,
       MAX(he.created_at) AS latest_earning_at
     FROM popolive.host_earning_shares he
     LEFT JOIN popolive.users u ON u.id::text = he.host_user_id OR u.poppo_id = he.host_user_id
     ${whereSql}
     GROUP BY he.host_user_id
     ORDER BY gross_host_points DESC, latest_earning_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  const hosts = hostRows.map((r: any) => {
    const grossPts = parseInt(String(r.gross_host_points ?? 0), 10);
    const revPts = parseInt(String(r.reversed_host_points ?? 0), 10);
    return {
      hostUserId: r.host_user_id,
      hostNickname: r.host_nickname,
      hostPoppoId: r.host_poppo_id || null,
      totalSharesCount: r.total_shares_count || 0,
      creditedCount: r.credited_count || 0,
      reversedCount: r.reversed_count || 0,
      grossGiftCoinsReceived: parseInt(String(r.gross_gift_coins ?? 0), 10),
      grossHostPointsCredited: grossPts,
      reversedHostPoints: revPts,
      netHostPoints: Math.max(0, grossPts - revPts),
      platformShareCoins: parseInt(String(r.platform_share_coins ?? 0), 10),
      hostSharePercentage: Number(r.avg_host_share_pct || 70),
      latestEarningAt: r.latest_earning_at ? new Date(r.latest_earning_at).toISOString() : null,
    };
  });

  return {
    periodLabel: bounds.label,
    hosts,
    pagination: { page: safePage, limit: safeLimit, total: hosts.length },
  };
}

export async function queryAdminPaymentReport(
  actor: WalletActorContext,
  filters: FinanceReportFilter = {},
  page: number = 1,
  limit: number = 50
) {
  assertFinanceAdminActor(actor);

  const bounds = resolveDatePresetBounds({
    preset: filters.preset || 'all',
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(200, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const conds: string[] = [`ul.tx_category IN ('topup', 'vip_purchase', 'vip_renewal')`];
  const params: any[] = [];

  if (bounds.fromIso) {
    params.push(bounds.fromIso);
    conds.push(`ul.tx_at >= $${params.length}::timestamptz`);
  }
  if (bounds.toIso) {
    params.push(bounds.toIso);
    conds.push(`ul.tx_at <= $${params.length}::timestamptz`);
  }
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status.trim().toLowerCase());
    conds.push(`ul.normalized_status = $${params.length}`);
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    params.push(filters.paymentMethod.trim().toLowerCase());
    conds.push(`LOWER(COALESCE(ul.payment_method,'')) = $${params.length}`);
  }
  if (filters.currency && filters.currency !== 'ALL') {
    params.push(filters.currency.trim().toUpperCase());
    conds.push(`ul.currency = $${params.length}`);
  }
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const pIdx = `$${params.length}`;
    conds.push(`(ul.record_id ILIKE ${pIdx} OR ul.user_id ILIKE ${pIdx} OR ul.title ILIKE ${pIdx})`);
  }

  const cteSql = getUnifiedLedgerCteSql();
  const whereSql = `WHERE ${conds.join(' AND ')}`;

  const [countRows, rows] = await Promise.all([
    query<{ total: number }>(`${cteSql} SELECT COUNT(*)::int AS total FROM unified_ledger ul ${whereSql}`, params),
    query<any>(
      `${cteSql}
       SELECT ul.*, fr.receipt_number, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
       FROM unified_ledger ul
       LEFT JOIN popolive.financial_receipts fr ON fr.source_table = ul.source_table AND fr.source_tx_id = ul.record_id
       LEFT JOIN popolive.users u ON u.id::text = ul.user_id OR u.poppo_id = ul.user_id
       ${whereSql}
       ORDER BY ul.tx_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, safeLimit, offset]
    ),
  ]);

  return {
    periodLabel: bounds.label,
    payments: rows.map((r: any) => ({
      orderId: r.record_id,
      sourceTable: r.source_table,
      txCategory: r.tx_category,
      userId: r.user_id,
      userNickname: r.user_nickname || null,
      userPoppoId: r.user_poppo_id || null,
      title: r.title,
      paymentAmount: Number(r.payment_amount || 0),
      currency: r.currency,
      coinQuantity: parseInt(String(r.coin_quantity ?? 0), 10),
      bonusCoinQuantity: parseInt(String(r.bonus_coin_quantity ?? 0), 10),
      paymentMethod: r.payment_method,
      providerReferenceMasked: maskProviderReference(r.provider_reference_raw),
      status: r.normalized_status,
      receiptNumber: r.receipt_eligible ? r.receipt_number || null : null,
      createdAt: new Date(r.tx_at).toISOString(),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0]?.total || 0,
    },
  };
}

export async function queryAdminRefundReversalReport(
  actor: WalletActorContext,
  filters: FinanceReportFilter = {},
  page: number = 1,
  limit: number = 50
) {
  assertFinanceAdminActor(actor);

  const bounds = resolveDatePresetBounds({
    preset: filters.preset || 'all',
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(200, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const conds: string[] = [
    `(ul.tx_category IN ('refund', 'reversal') OR ul.normalized_status IN ('refunded', 'reversed'))`,
  ];
  const params: any[] = [];

  if (bounds.fromIso) {
    params.push(bounds.fromIso);
    conds.push(`ul.tx_at >= $${params.length}::timestamptz`);
  }
  if (bounds.toIso) {
    params.push(bounds.toIso);
    conds.push(`ul.tx_at <= $${params.length}::timestamptz`);
  }
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const pIdx = `$${params.length}`;
    conds.push(`(ul.record_id ILIKE ${pIdx} OR ul.user_id ILIKE ${pIdx} OR ul.description ILIKE ${pIdx})`);
  }

  const cteSql = getUnifiedLedgerCteSql();
  const whereSql = `WHERE ${conds.join(' AND ')}`;

  const [countRows, rows] = await Promise.all([
    query<{ total: number }>(`${cteSql} SELECT COUNT(*)::int AS total FROM unified_ledger ul ${whereSql}`, params),
    query<any>(
      `${cteSql}
       SELECT ul.*, fr.receipt_number, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
       FROM unified_ledger ul
       LEFT JOIN popolive.financial_receipts fr ON fr.source_table = ul.source_table AND fr.source_tx_id = ul.record_id
       LEFT JOIN popolive.users u ON u.id::text = ul.user_id OR u.poppo_id = ul.user_id
       ${whereSql}
       ORDER BY ul.tx_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, safeLimit, offset]
    ),
  ]);

  return {
    periodLabel: bounds.label,
    records: rows.map((r: any) => ({
      recordId: r.record_id,
      sourceTable: r.source_table,
      txCategory: r.tx_category,
      userId: r.user_id,
      userNickname: r.user_nickname || null,
      title: r.title,
      reasonOrDescription: r.description,
      paymentAmount: Number(r.payment_amount || 0),
      currency: r.currency,
      coinQuantity: parseInt(String(r.coin_quantity ?? 0), 10),
      pointsQuantity: parseInt(String(r.points_quantity ?? 0), 10),
      platformShareCoins: parseInt(String(r.platform_share_coins ?? 0), 10),
      status: r.normalized_status,
      receiptNumber: r.receipt_number || null,
      occurredAt: new Date(r.tx_at).toISOString(),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0]?.total || 0,
    },
  };
}

async function queryAllUnifiedRowsForExport(filters: FinanceReportFilter, reportType: FinanceReportType) {
  const bounds = resolveDatePresetBounds({
    preset: filters.preset || 'all',
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const conds: string[] = ['1=1'];
  const params: any[] = [];

  if (reportType === 'payments') {
    conds.push(`ul.tx_category IN ('topup', 'vip_purchase', 'vip_renewal')`);
  } else if (reportType === 'refunds_reversals') {
    conds.push(`(ul.tx_category IN ('refund', 'reversal') OR ul.normalized_status IN ('refunded', 'reversed'))`);
  }

  if (bounds.fromIso) {
    params.push(bounds.fromIso);
    conds.push(`ul.tx_at >= $${params.length}::timestamptz`);
  }
  if (bounds.toIso) {
    params.push(bounds.toIso);
    conds.push(`ul.tx_at <= $${params.length}::timestamptz`);
  }
  if (filters.txCategory && filters.txCategory !== 'all') {
    params.push(filters.txCategory.trim().toLowerCase());
    conds.push(`ul.tx_category = $${params.length}`);
  }
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status.trim().toLowerCase());
    conds.push(`ul.normalized_status = $${params.length}`);
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    params.push(filters.paymentMethod.trim().toLowerCase());
    conds.push(`LOWER(COALESCE(ul.payment_method,'')) = $${params.length}`);
  }
  if (filters.currency && filters.currency !== 'ALL') {
    params.push(filters.currency.trim().toUpperCase());
    conds.push(`ul.currency = $${params.length}`);
  }
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const pIdx = `$${params.length}`;
    conds.push(`(ul.record_id ILIKE ${pIdx} OR ul.user_id ILIKE ${pIdx} OR ul.title ILIKE ${pIdx})`);
  }

  const cteSql = getUnifiedLedgerCteSql();
  const rows = await query<any>(
    `${cteSql}
     SELECT ul.*, fr.receipt_number, u.nickname AS user_nickname, u.poppo_id AS user_poppo_id
     FROM unified_ledger ul
     LEFT JOIN popolive.financial_receipts fr ON fr.source_table = ul.source_table AND fr.source_tx_id = ul.record_id
     LEFT JOIN popolive.users u ON u.id::text = ul.user_id OR u.poppo_id = ul.user_id
     WHERE ${conds.join(' AND ')}
     ORDER BY ul.tx_at DESC
     LIMIT 5000`,
    params
  );

  return { bounds, rows };
}

export async function createFinanceExportJob(params: {
  actor: WalletActorContext;
  reportType: FinanceReportType;
  exportFormat: FinanceExportFormat;
  filters?: FinanceReportFilter;
  idempotencyKey?: string | null;
  ttlSeconds?: number | null;
}) {
  assertFinanceAdminActor(params.actor);

  const reportType = params.reportType;
  const exportFormat = params.exportFormat;
  if (!['transactions', 'payments', 'host_earnings', 'refunds_reversals', 'executive_summary'].includes(reportType)) {
    throw new FinanceExportError(400, 'INVALID_REPORT_TYPE', 'Unsupported finance report type.');
  }
  if (!['csv', 'xlsx', 'pdf'].includes(exportFormat)) {
    throw new FinanceExportError(400, 'INVALID_EXPORT_FORMAT', 'Export format must be csv, xlsx, or pdf.');
  }

  // Idempotency return if matching job already created
  const cleanIdem = params.idempotencyKey?.trim() || null;
  if (cleanIdem) {
    const existing = await query<any>(
      `SELECT * FROM popolive.finance_export_jobs WHERE idempotency_key = $1 LIMIT 1`,
      [cleanIdem]
    );
    if (existing.length > 0 && existing[0].status === 'completed') {
      const job = existing[0];
      const expiresAtMs = job.expires_at ? new Date(job.expires_at).getTime() : Date.now() + EXPORT_TOKEN_TTL_SECONDS * 1000;
      const freshToken = signExportDownloadToken(job.export_id, expiresAtMs);
      await query(`UPDATE popolive.finance_export_jobs SET download_token_hash = $1 WHERE export_id = $2`, [
        sha256Hex(freshToken),
        job.export_id,
      ]);
      return {
        exportId: job.export_id,
        reportType: job.report_type,
        exportFormat: job.export_format,
        recordCount: job.record_count,
        fileName: job.file_name,
        fileSizeBytes: Number(job.file_size_bytes),
        sha256Checksum: job.sha256_checksum,
        expiresAt: new Date(expiresAtMs).toISOString(),
        downloadUrl: `/api/admin/finance/exports/${job.export_id}/download?token=${encodeURIComponent(freshToken)}`,
        status: 'completed',
      };
    }
  }

  // Per-admin export rate limit (max 25 completed exports in 60 seconds)
  const rateRows = await query<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM popolive.finance_export_jobs WHERE requested_by = $1 AND created_at > NOW() - INTERVAL '60 seconds'`,
    [params.actor.actorId]
  );
  if ((rateRows[0]?.cnt || 0) >= 25) {
    throw new FinanceExportError(429, 'EXPORT_RATE_LIMITED', 'Too many finance export requests. Please wait a minute before generating another export.');
  }

  const filters = params.filters || {};
  const exportId = generateFinanceId('EXP_FIN');
  const effectiveTtlSeconds =
    typeof params.ttlSeconds === 'number' && Number.isFinite(params.ttlSeconds)
      ? Math.min(EXPORT_TOKEN_TTL_SECONDS, Math.max(1, Math.trunc(params.ttlSeconds)))
      : EXPORT_TOKEN_TTL_SECONDS;
  const expiresAtMs = Date.now() + effectiveTtlSeconds * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const downloadToken = signExportDownloadToken(exportId, expiresAtMs);
  const tokenHash = sha256Hex(downloadToken);

  await query(
    `INSERT INTO popolive.finance_export_jobs (
       export_id, idempotency_key, requested_by, actor_role, report_type, export_format,
       filters_json, date_preset, from_date, to_date, currency_filter, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, 'processing')`,
    [
      exportId,
      cleanIdem,
      params.actor.actorId,
      params.actor.actorRole,
      reportType,
      exportFormat,
      JSON.stringify(filters),
      filters.preset || 'all',
      filters.fromDate ? new Date(filters.fromDate).toISOString() : null,
      filters.toDate ? new Date(filters.toDate).toISOString() : null,
      filters.currency || 'ALL',
    ]
  );

  await query(
    `INSERT INTO popolive.finance_export_audit_logs (
       audit_id, export_id, actor_id, actor_role, action_type, report_type, export_format, filters_json, ip_address, status, details
     ) VALUES ($1, $2, $3, $4, 'export_requested', $5, $6, $7::jsonb, $8, 'processing', $9)`,
    [
      generateFinanceId('AUD_EXP'),
      exportId,
      params.actor.actorId,
      params.actor.actorRole,
      reportType,
      exportFormat,
      JSON.stringify(filters),
      params.actor.ipAddress,
      `Requested ${exportFormat.toUpperCase()} export for ${reportType}`,
    ]
  );

  try {
    const { bounds, rows } = await queryAllUnifiedRowsForExport(filters, reportType);
    const hostSummary = await queryAdminHostEarningsReport(params.actor, filters, 1, 500);
    const dashboard = await getFinanceAdminDashboardMetrics(params.actor, filters);

    const exportDir = getPrivateExportDirectory();
    const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `popo_live_${reportType}_${safeTimestamp}_${exportId}.${exportFormat}`;
    const fullFilePath = path.resolve(exportDir, fileName);

    let fileBuffer: Buffer;
    let finalRecordCount = rows.length;

    if (reportType === 'host_earnings') {
      finalRecordCount = hostSummary.hosts.length;
    }

    if (exportFormat === 'csv') {
      let csvLines: string[] = [];
      if (reportType === 'host_earnings') {
        csvLines.push(
          [
            'Host User ID',
            'Host Nickname',
            'Poppo ID',
            'Shares Count',
            'Reversed Count',
            'Original Gift Coins',
            'Gross Host Points (70% Non-Cash)',
            'Reversed Points',
            'Net Host Points',
            'Platform Share Coins (30%)',
            'Share %',
          ]
            .map(escapeExportCsvCell)
            .join(',')
        );
        for (const h of hostSummary.hosts) {
          csvLines.push(
            [
              h.hostUserId,
              h.hostNickname,
              h.hostPoppoId || '',
              h.totalSharesCount,
              h.reversedCount,
              h.grossGiftCoinsReceived,
              h.grossHostPointsCredited,
              h.reversedHostPoints,
              h.netHostPoints,
              h.platformShareCoins,
              h.hostSharePercentage,
            ]
              .map(escapeExportCsvCell)
              .join(',')
          );
        }
      } else {
        csvLines.push(
          [
            'Transaction ID',
            'Receipt Number',
            'Category',
            'User ID',
            'User Nickname',
            'Payment Amount',
            'Currency',
            'Coins',
            'Bonus Coins',
            'Host Points (Non-Cash)',
            'Platform Share Coins (30%)',
            'Payment Method',
            'Provider Reference (Masked)',
            'Status',
            'Issued At (UTC)',
            'Description',
          ]
            .map(escapeExportCsvCell)
            .join(',')
        );
        for (const r of rows) {
          csvLines.push(
            [
              r.record_id,
              r.receipt_eligible ? r.receipt_number || '' : 'NOT_ISSUED',
              r.tx_category,
              r.user_id,
              r.user_nickname || '',
              Number(r.payment_amount || 0).toFixed(2),
              r.currency || 'NONE',
              r.coin_quantity ?? 0,
              r.bonus_coin_quantity ?? 0,
              r.points_quantity ?? 0,
              r.platform_share_coins ?? 0,
              r.payment_method || '',
              maskProviderReference(r.provider_reference_raw) || '',
              r.normalized_status,
              new Date(r.tx_at).toISOString(),
              r.description || r.title,
            ]
              .map(escapeExportCsvCell)
              .join(',')
          );
        }
      }
      fileBuffer = Buffer.from('\uFEFF' + csvLines.join('\r\n'), 'utf8');
    } else if (exportFormat === 'xlsx') {
      const sheets: XlsxSheetInput[] = [];

      const txSheetRows: Array<Array<string | number | null | undefined>> = [
        [
          'Transaction ID',
          'Receipt Number',
          'Category',
          'User ID',
          'Nickname',
          'Payment Amount',
          'Currency',
          'Coins',
          'Bonus Coins',
          'Host Points (Non-Cash)',
          'Platform Share Coins (30%)',
          'Payment Method',
          'Provider Ref (Masked)',
          'Status',
          'Timestamp (UTC)',
        ],
        ...rows.map((r: any) => [
          r.record_id,
          r.receipt_eligible ? r.receipt_number || '' : 'NOT_ISSUED',
          r.tx_category,
          r.user_id,
          r.user_nickname || '',
          Number(r.payment_amount || 0),
          r.currency || 'NONE',
          Number(r.coin_quantity ?? 0),
          Number(r.bonus_coin_quantity ?? 0),
          Number(r.points_quantity ?? 0),
          Number(r.platform_share_coins ?? 0),
          r.payment_method || '',
          maskProviderReference(r.provider_reference_raw) || '',
          r.normalized_status,
          new Date(r.tx_at).toISOString(),
        ]),
      ];

      const hostSheetRows: Array<Array<string | number | null | undefined>> = [
        [
          'Host User ID',
          'Host Nickname',
          'Poppo ID',
          'Gift Coins Volume',
          'Gross Host Points (70%)',
          'Reversed Points',
          'Net Host Points',
          'Platform Share Coins (30%)',
          'Shares Count',
          'Reversed Count',
        ],
        ...hostSummary.hosts.map((h) => [
          h.hostUserId,
          h.hostNickname,
          h.hostPoppoId || '',
          h.grossGiftCoinsReceived,
          h.grossHostPointsCredited,
          h.reversedHostPoints,
          h.netHostPoints,
          h.platformShareCoins,
          h.totalSharesCount,
          h.reversedCount,
        ]),
      ];

      const paymentRowsFiltered = rows.filter((r: any) =>
        ['topup', 'vip_purchase', 'vip_renewal'].includes(r.tx_category)
      );
      const paymentSheetRows: Array<Array<string | number | null | undefined>> = [
        ['Order ID', 'Category', 'User ID', 'Amount', 'Currency', 'Coins', 'Bonus Coins', 'Method', 'Provider Ref', 'Status', 'Receipt Number', 'Date (UTC)'],
        ...paymentRowsFiltered.map((r: any) => [
          r.record_id,
          r.tx_category,
          r.user_id,
          Number(r.payment_amount || 0),
          r.currency,
          Number(r.coin_quantity ?? 0),
          Number(r.bonus_coin_quantity ?? 0),
          r.payment_method || '',
          maskProviderReference(r.provider_reference_raw) || '',
          r.normalized_status,
          r.receipt_eligible ? r.receipt_number || '' : 'NOT_ISSUED',
          new Date(r.tx_at).toISOString(),
        ]),
      ];

      const refundRowsFiltered = rows.filter(
        (r: any) => ['refund', 'reversal'].includes(r.tx_category) || ['refunded', 'reversed'].includes(r.normalized_status)
      );
      const refundSheetRows: Array<Array<string | number | null | undefined>> = [
        ['Record ID', 'Category', 'User ID', 'Amount', 'Currency', 'Coins', 'Points', 'Platform Share', 'Status', 'Description', 'Date (UTC)'],
        ...refundRowsFiltered.map((r: any) => [
          r.record_id,
          r.tx_category,
          r.user_id,
          Number(r.payment_amount || 0),
          r.currency,
          Number(r.coin_quantity ?? 0),
          Number(r.points_quantity ?? 0),
          Number(r.platform_share_coins ?? 0),
          r.normalized_status,
          r.description || r.title,
          new Date(r.tx_at).toISOString(),
        ]),
      ];

      if (reportType === 'host_earnings') {
        sheets.push({ name: 'Host_Earnings_70_30', rows: hostSheetRows });
        sheets.push({ name: 'Transactions', rows: txSheetRows });
      } else if (reportType === 'payments') {
        sheets.push({ name: 'Payments', rows: paymentSheetRows });
        sheets.push({ name: 'Refunds_Reversals', rows: refundSheetRows });
      } else if (reportType === 'refunds_reversals') {
        sheets.push({ name: 'Refunds_Reversals', rows: refundSheetRows });
        sheets.push({ name: 'Transactions', rows: txSheetRows });
      } else {
        sheets.push({ name: 'Transactions', rows: txSheetRows });
        sheets.push({ name: 'Host_Earnings_70_30', rows: hostSheetRows });
        sheets.push({ name: 'Payments', rows: paymentSheetRows });
        sheets.push({ name: 'Refunds_Reversals', rows: refundSheetRows });
      }

      fileBuffer = buildXlsxWorkbook(sheets);
    } else {
      // PDF Landscape Finance Report
      const currencyText =
        dashboard.selected.verifiedTopupRevenueByCurrency
          .map((c) => `${c.currency} ${c.combinedVerifiedCashTotal.toFixed(2)}`)
          .join(' | ') || 'No Cash Volume';

      const kpiMetrics = [
        { label: 'Verified Cash Revenue', value: currencyText },
        { label: 'Top-up Coins Credited', value: `${dashboard.selected.totalCoinsCredited.toLocaleString()} Coins` },
        { label: 'Host Points (70% Non-Cash)', value: `${dashboard.selected.totalHostPointsCredited.toLocaleString()} Pts` },
        { label: 'Platform Share (30%)', value: `${dashboard.selected.totalPlatformShareCoins.toLocaleString()} Coins` },
      ];

      const pdfHeaders =
        reportType === 'host_earnings'
          ? ['Host ID', 'Nickname', 'Gift Coins', 'Gross Pts (70%)', 'Reversed Pts', 'Net Points', 'Platform Share (30%)']
          : ['Record ID', 'Type', 'User', 'Cash Amount', 'Coins', 'Points', 'Share 30%', 'Status', 'Date'];

      const pdfRows: Array<Array<string | number>> =
        reportType === 'host_earnings'
          ? hostSummary.hosts.slice(0, 120).map((h) => [
              h.hostUserId.slice(0, 14),
              h.hostNickname,
              h.grossGiftCoinsReceived,
              h.grossHostPointsCredited,
              h.reversedHostPoints,
              h.netHostPoints,
              h.platformShareCoins,
            ])
          : rows.slice(0, 120).map((r: any) => [
              String(r.record_id).slice(0, 16),
              r.tx_category,
              String(r.user_nickname || r.user_id).slice(0, 14),
              Number(r.payment_amount || 0) > 0 ? `${r.currency} ${Number(r.payment_amount).toFixed(2)}` : '0',
              Number(r.coin_quantity ?? 0),
              Number(r.points_quantity ?? 0),
              Number(r.platform_share_coins ?? 0),
              r.normalized_status,
              new Date(r.tx_at).toISOString().slice(0, 10),
            ]);

      fileBuffer = generateFinanceReportPdfBuffer({
        reportTitle: `Popo Live Finance Report (${reportType.replace(/_/g, ' ').toUpperCase()})`,
        generatedAt: new Date().toISOString(),
        exportedBy: `${params.actor.user?.nickname || params.actor.actorId} (${params.actor.actorRole})`,
        periodLabel: bounds.label,
        filtersSummary: `Cat=${filters.txCategory || 'all'}, Status=${filters.status || 'all'}, Currency=${filters.currency || 'ALL'}`,
        recordCount: finalRecordCount,
        metrics: kpiMetrics,
        headers: pdfHeaders,
        rows: pdfRows,
        disclaimer:
          'Popo Live Financial Separation Policy: Verified Cash Payments, Coins, Non-Cash Host Points (70%), and Platform Share (30%) are never merged.',
      });
    }

    fs.writeFileSync(fullFilePath, fileBuffer);
    const checksum = sha256Hex(fileBuffer);
    const sizeBytes = fileBuffer.length;

    await query(
      `UPDATE popolive.finance_export_jobs
       SET status = 'completed',
           record_count = $1,
           file_path = $2,
           file_name = $3,
           file_size_bytes = $4,
           sha256_checksum = $5,
           download_token_hash = $6,
           expires_at = $7::timestamptz,
           completed_at = NOW()
       WHERE export_id = $8`,
      [finalRecordCount, fullFilePath, fileName, sizeBytes, checksum, tokenHash, expiresAtIso, exportId]
    );

    await query(
      `INSERT INTO popolive.finance_export_audit_logs (
         audit_id, export_id, actor_id, actor_role, action_type, report_type, export_format, filters_json, record_count, ip_address, status, details
       ) VALUES ($1, $2, $3, $4, 'export_completed', $5, $6, $7::jsonb, $8, $9, 'success', $10)`,
      [
        generateFinanceId('AUD_EXP'),
        exportId,
        params.actor.actorId,
        params.actor.actorRole,
        reportType,
        exportFormat,
        JSON.stringify(filters),
        finalRecordCount,
        params.actor.ipAddress,
        `Export completed (${fileName}, ${sizeBytes} bytes, sha256:${checksum.slice(0, 12)})`,
      ]
    );

    return {
      exportId,
      reportType,
      exportFormat,
      recordCount: finalRecordCount,
      fileName,
      fileSizeBytes: sizeBytes,
      sha256Checksum: checksum,
      expiresAt: expiresAtIso,
      downloadUrl: `/api/admin/finance/exports/${exportId}/download?token=${encodeURIComponent(downloadToken)}`,
      status: 'completed',
    };
  } catch (err: any) {
    await query(
      `UPDATE popolive.finance_export_jobs SET status = 'failed', error_message = $1 WHERE export_id = $2`,
      [err?.message || 'Export generation failed', exportId]
    ).catch(() => {});
    throw err;
  }
}

export async function authorizeAndReadExportFile(params: {
  exportId: string;
  actor: WalletActorContext;
  token?: string | null;
}): Promise<{ buffer: Buffer; fileName: string; contentType: string; sha256Checksum: string }> {
  const jobs = await query<any>(
    `SELECT * FROM popolive.finance_export_jobs WHERE export_id = $1 LIMIT 1`,
    [params.exportId]
  );
  if (jobs.length === 0) {
    throw new FinanceExportError(404, 'EXPORT_NOT_FOUND', 'Export job not found.');
  }
  const job = jobs[0];

  const isFinanceAdmin = Boolean(params.actor.user && isAuthorizedFinanceAdmin(params.actor.actorRole));
  let authorizedByToken = false;

  if (params.token) {
    const verified = verifyExportDownloadToken(params.exportId, params.token);
    if (verified.expired) {
      throw new FinanceExportError(410, 'EXPORT_TOKEN_EXPIRED', 'Export download link has expired. Generate a fresh export link.');
    }
    if (!verified.valid) {
      throw new FinanceExportError(403, 'INVALID_EXPORT_TOKEN', 'Invalid export download token signature.');
    }
    if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
      throw new FinanceExportError(410, 'EXPORT_TOKEN_EXPIRED', 'Export file window has expired.');
    }
    authorizedByToken = true;
  }

  if (!isFinanceAdmin && !authorizedByToken) {
    if (!params.actor.user) {
      throw new FinanceExportError(401, 'UNAUTHORIZED', 'Authentication or valid signed download token required.');
    }
    throw new FinanceExportError(403, 'FINANCE_ADMIN_REQUIRED', 'Forbidden: Finance Admin permission required to download private finance exports.');
  }

  // Even when a token is passed by an authenticated ordinary admin/non-admin user, wait:
  // Prompt 10 says: "Do not allow normal users or unauthorized staff to access finance exports."
  // If caller IS authenticated as a non-finance_admin user trying to use someone else's/admin's export endpoint, deny 403!
  if (params.actor.user && !isFinanceAdmin) {
    throw new FinanceExportError(403, 'FINANCE_ADMIN_REQUIRED', 'Forbidden: Only authorized finance admins may download finance export files.');
  }

  if (job.status !== 'completed' || !job.file_path) {
    throw new FinanceExportError(409, 'EXPORT_NOT_READY', 'Export file is not ready for download.');
  }

  const privateRoot = getPrivateExportDirectory();
  const resolved = path.resolve(job.file_path);
  if (!resolved.startsWith(privateRoot) || !fs.existsSync(resolved)) {
    throw new FinanceExportError(404, 'EXPORT_FILE_MISSING', 'Export file is unavailable on private storage.');
  }

  const buffer = fs.readFileSync(resolved);
  const contentTypeMap: Record<string, string> = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };

  await query(
    `INSERT INTO popolive.finance_export_audit_logs (
       audit_id, export_id, actor_id, actor_role, action_type, report_type, export_format, record_count, ip_address, status, details
     ) VALUES ($1, $2, $3, $4, 'export_downloaded', $5, $6, $7, $8, 'success', $9)`,
    [
      generateFinanceId('AUD_DL'),
      job.export_id,
      params.actor.actorId || 'token_bearer',
      params.actor.actorRole || 'finance_admin',
      job.report_type,
      job.export_format,
      job.record_count,
      params.actor.ipAddress,
      `Downloaded ${job.file_name} securely`,
    ]
  ).catch(() => {});

  return {
    buffer,
    fileName: job.file_name || `${job.export_id}.${job.export_format}`,
    contentType: contentTypeMap[job.export_format] || 'application/octet-stream',
    sha256Checksum: job.sha256_checksum || sha256Hex(buffer),
  };
}

export async function listFinanceExportsAndAuditLogs(actor: WalletActorContext, limit: number = 30) {
  assertFinanceAdminActor(actor);

  const safeLimit = Math.min(100, Math.max(1, limit));
  const [jobs, audits] = await Promise.all([
    query<any>(
      `SELECT export_id, requested_by, actor_role, report_type, export_format, date_preset,
              currency_filter, record_count, status, file_name, file_size_bytes,
              sha256_checksum, expires_at, created_at, completed_at
       FROM popolive.finance_export_jobs
       ORDER BY created_at DESC
       LIMIT $1`,
      [safeLimit]
    ),
    query<any>(
      `SELECT * FROM popolive.finance_export_audit_logs ORDER BY created_at DESC LIMIT $1`,
      [safeLimit]
    ),
  ]);

  return {
    exports: jobs.map((j: any) => {
      const expMs = j.expires_at ? new Date(j.expires_at).getTime() : 0;
      const isExpired = expMs > 0 && expMs < Date.now();
      const freshToken =
        j.status === 'completed' && !isExpired
          ? signExportDownloadToken(j.export_id, expMs || Date.now() + EXPORT_TOKEN_TTL_SECONDS * 1000)
          : null;
      return {
        exportId: j.export_id,
        requestedBy: j.requested_by,
        actorRole: j.actor_role,
        reportType: j.report_type,
        exportFormat: j.export_format,
        datePreset: j.date_preset,
        currencyFilter: j.currency_filter,
        recordCount: j.record_count,
        status: isExpired ? 'expired' : j.status,
        fileName: j.file_name,
        fileSizeBytes: Number(j.file_size_bytes || 0),
        sha256Checksum: j.sha256_checksum,
        expiresAt: j.expires_at ? new Date(j.expires_at).toISOString() : null,
        createdAt: new Date(j.created_at).toISOString(),
        completedAt: j.completed_at ? new Date(j.completed_at).toISOString() : null,
        downloadUrl: freshToken
          ? `/api/admin/finance/exports/${j.export_id}/download?token=${encodeURIComponent(freshToken)}`
          : null,
      };
    }),
    auditLogs: audits.map((a: any) => ({
      auditId: a.audit_id,
      exportId: a.export_id,
      receiptId: a.receipt_id,
      actorId: a.actor_id,
      actorRole: a.actor_role,
      actionType: a.action_type,
      reportType: a.report_type,
      exportFormat: a.export_format,
      recordCount: a.record_count,
      ipAddress: a.ip_address,
      status: a.status,
      details: a.details,
      createdAt: new Date(a.created_at).toISOString(),
    })),
  };
}
