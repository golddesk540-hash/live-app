-- =============================================================================
-- Migration 054: Module 7.10 — Complete Receipts and Finance Export System
-- Central unified financial receipts, finance report snapshots, private
-- expiring export jobs (CSV / XLSX / PDF), and export security audit logs.
-- Strictly preserves Coins, Points, Platform Share, and Cash amounts separate.
-- Never creates successful receipts for failed/cancelled/pending transactions.
-- =============================================================================

-- 1. Central Financial Receipts Registry (Immutable reference to source ledger records)
CREATE TABLE IF NOT EXISTS popolive.financial_receipts (
  receipt_id VARCHAR(80) PRIMARY KEY,
  receipt_number VARCHAR(64) UNIQUE NOT NULL,
  user_id VARCHAR(120) NOT NULL,
  tx_category VARCHAR(40) NOT NULL CHECK (
    tx_category IN (
      'topup',
      'gift_sent',
      'host_earning',
      'points_credit',
      'vip_purchase',
      'vip_renewal',
      'store_purchase',
      'refund',
      'reversal',
      'wallet_adjustment'
    )
  ),
  source_table VARCHAR(64) NOT NULL,
  source_tx_id VARCHAR(120) NOT NULL,
  related_original_tx_id VARCHAR(120),
  legacy_receipt_id VARCHAR(80),
  title VARCHAR(180) NOT NULL,
  title_ur VARCHAR(180),
  description TEXT,
  payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
  currency VARCHAR(16) NOT NULL DEFAULT 'NONE',
  coin_quantity BIGINT NOT NULL DEFAULT 0,
  bonus_coin_quantity BIGINT NOT NULL DEFAULT 0,
  points_quantity BIGINT NOT NULL DEFAULT 0,
  platform_share_coins BIGINT NOT NULL DEFAULT 0,
  share_percentage NUMERIC(5, 2),
  gift_summary JSONB,
  vip_summary JSONB,
  store_summary JSONB,
  payment_method VARCHAR(64),
  provider_reference_masked VARCHAR(140),
  status VARCHAR(32) NOT NULL CHECK (status IN ('successful', 'refunded', 'reversed')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_table, source_tx_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_receipts_user_issued
  ON popolive.financial_receipts (user_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_receipts_source_tx
  ON popolive.financial_receipts (source_tx_id);

CREATE INDEX IF NOT EXISTS idx_financial_receipts_legacy
  ON popolive.financial_receipts (legacy_receipt_id)
  WHERE legacy_receipt_id IS NOT NULL;

-- 2. Finance Report Records / Cached Summary Snapshots
CREATE TABLE IF NOT EXISTS popolive.finance_report_snapshots (
  report_id VARCHAR(80) PRIMARY KEY,
  period_key VARCHAR(40) NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  currency_filter VARCHAR(16) NOT NULL DEFAULT 'ALL',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_report_snapshots_period
  ON popolive.finance_report_snapshots (period_key, created_at DESC);

-- 3. Finance Export Jobs (CSV, XLSX, PDF stored privately outside public web root)
CREATE TABLE IF NOT EXISTS popolive.finance_export_jobs (
  export_id VARCHAR(80) PRIMARY KEY,
  idempotency_key VARCHAR(120) UNIQUE,
  requested_by VARCHAR(64) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  report_type VARCHAR(40) NOT NULL CHECK (
    report_type IN ('transactions', 'payments', 'host_earnings', 'refunds_reversals', 'executive_summary')
  ),
  export_format VARCHAR(16) NOT NULL CHECK (export_format IN ('csv', 'xlsx', 'pdf')),
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_preset VARCHAR(32),
  from_date TIMESTAMPTZ,
  to_date TIMESTAMPTZ,
  currency_filter VARCHAR(16),
  record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'expired')
  ),
  file_path TEXT,
  file_name VARCHAR(180),
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  sha256_checksum VARCHAR(64),
  download_token_hash VARCHAR(64),
  error_message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_finance_export_jobs_requested_by
  ON popolive.finance_export_jobs (requested_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_export_jobs_status
  ON popolive.finance_export_jobs (status, created_at DESC);

-- 4. Finance Export & Receipt Security Audit Logs
CREATE TABLE IF NOT EXISTS popolive.finance_export_audit_logs (
  audit_id VARCHAR(80) PRIMARY KEY,
  export_id VARCHAR(80),
  receipt_id VARCHAR(80),
  actor_id VARCHAR(64) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  report_type VARCHAR(40),
  export_format VARCHAR(16),
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  record_count INTEGER,
  ip_address VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'success',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_export_audit_created
  ON popolive.finance_export_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_export_audit_actor
  ON popolive.finance_export_audit_logs (actor_id, created_at DESC);

-- 5. Backfill receipts for existing successful/refunded/reversed Top-up Orders (never pending/failed/cancelled)
INSERT INTO popolive.financial_receipts (
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
WHERE o.status IN ('successful', 'refunded', 'reversed')
ON CONFLICT (source_table, source_tx_id) DO NOTHING;

-- Backfill successful/refunded VIP Orders
INSERT INTO popolive.financial_receipts (
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
WHERE vo.status IN ('verified', 'refunded')
ON CONFLICT (source_table, source_tx_id) DO NOTHING;

-- Backfill successful/reversed Gift Transactions (sender side)
INSERT INTO popolive.financial_receipts (
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
WHERE gt.status IN ('completed', 'reversed')
ON CONFLICT (source_table, source_tx_id) DO NOTHING;

-- Backfill Host Gift Earnings Shares (points credited; strictly non-cash)
INSERT INTO popolive.financial_receipts (
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
WHERE he.status IN ('credited', 'reversed')
ON CONFLICT (source_table, source_tx_id) DO NOTHING;

-- Backfill Store Purchases
INSERT INTO popolive.financial_receipts (
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
WHERE sp.status IN ('completed', 'refunded', 'reversed')
ON CONFLICT (source_table, source_tx_id) DO NOTHING;
