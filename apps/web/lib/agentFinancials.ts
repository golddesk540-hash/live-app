import { NextRequest } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { dispatchPushNotification } from '@/lib/pushNotifications';
import * as crypto from 'crypto';

export interface AgentProfile {
  id: string;
  userId: string;
  agencyId?: string;
  agencyName?: string;
  role: 'super_admin' | 'agency_admin' | 'agent' | 'coin_seller';
  commissionRate: number;
  isCoinSeller: boolean;
  sellerCoinBalance: number;
  totalSalesCount: number;
  totalCoinsSold: number;
  status: 'active' | 'suspended' | 'pending';
  nickname: string;
  avatarUrl: string;
  poppoId: string;
}

export interface AgentEarningsDashboard {
  userId: string;
  role: string;
  isCoinSeller: boolean;
  sellerCoinBalance: number;
  totalEarningsPoints: number;
  availableBalancePoints: number;
  pendingBalancePoints: number;
  withdrawnPoints: number;
  confirmedCommissionsPoints: number;
  exchangeRateUsdPerThousandPoints: number;
  availableUsd: number;
  totalUsd: number;
  pendingUsd: number;
  withdrawnUsd: number;
  isWithdrawalEligible: boolean;
  ineligibilityReason?: string;
  minWithdrawalPoints: number;
  maxWithdrawalPoints: number;
  hasVerifiedPayoutMethod: boolean;
  recentEarnings: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
}

export interface CoinSellerPackage {
  packageId: string;
  packageName: string;
  packageNameUr: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceAmount: number;
  currency: string;
  badgeText?: string;
  isPopular: boolean;
}

export interface CoinSaleResult {
  saleReference: string;
  sellerUserId: string;
  customerUserId: string;
  customerNickname: string;
  customerPoppoId: string;
  customerAvatar: string;
  packageId: string;
  coinsAmount: number;
  fiatAmount: number;
  fiatCurrency: string;
  commissionRate: number;
  commissionPoints: number;
  sellerRemainingCoins: number;
  customerNewCoins: number;
  status: string;
  createdAt: string;
}

export interface PayoutMethod {
  id: string;
  userId: string;
  provider: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  accountTitle: string;
  accountNumberMasked: string;
  bankName?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  withdrawalReference: string;
  userId: string;
  payoutMethodId: string;
  provider: string;
  accountTitle: string;
  accountNumberMasked: string;
  bankName?: string;
  pointsAmount: number;
  fiatAmount: number;
  currency: string;
  status: 'pending' | 'under_review' | 'approved' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Resolve actor from HTTP request headers or cookies
 */
export async function resolveUserActor(req: NextRequest): Promise<{ id: string; nickname: string; role: string; wealthLevel: number } | null> {
  const devViewerId = req.headers.get('x-viewer-id') || req.headers.get('x-user-id');
  if (devViewerId) {
    const res = await query<any>(
      `SELECT id, nickname, role, wealth_level, status FROM popolive.users WHERE id = $1`,
      [devViewerId]
    );
    if (res.length > 0) {
      return {
        id: res[0].id,
        nickname: res[0].nickname,
        role: res[0].role,
        wealthLevel: res[0].wealth_level || 1,
      };
    }
  }

  const sessionToken = req.cookies.get('poppo_session')?.value || req.cookies.get('session_token')?.value;
  if (sessionToken) {
    const sessionRes = await query<any>(
      `SELECT s.user_id, u.nickname, u.role, u.wealth_level, u.status
       FROM popolive.user_sessions s
       JOIN popolive.users u ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );
    if (sessionRes.length > 0) {
      return {
        id: sessionRes[0].user_id,
        nickname: sessionRes[0].nickname,
        role: sessionRes[0].role,
        wealthLevel: sessionRes[0].wealth_level || 1,
      };
    }
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const sessionRes = await query<any>(
      `SELECT s.user_id, u.nickname, u.role, u.wealth_level, u.status
       FROM popolive.user_sessions s
       JOIN popolive.users u ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    if (sessionRes.length > 0) {
      return {
        id: sessionRes[0].user_id,
        nickname: sessionRes[0].nickname,
        role: sessionRes[0].role,
        wealthLevel: sessionRes[0].wealth_level || 1,
      };
    }
  }

  return null;
}

/**
 * Get Agent Profile for a user
 */
export async function getAgentProfile(userId: string): Promise<AgentProfile | null> {
  const rows = await query<any>(
    `SELECT ap.*, u.nickname, u.avatar_url, u.poppo_id, a.name as agency_name
     FROM popolive.agent_profiles ap
     JOIN popolive.users u ON u.id = ap.user_id
     LEFT JOIN popolive.agencies a ON a.id = ap.agency_id
     WHERE ap.user_id = $1`,
    [userId]
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    agencyId: r.agency_id,
    agencyName: r.agency_name,
    role: r.role,
    commissionRate: parseFloat(r.commission_rate || '8.00'),
    isCoinSeller: Boolean(r.is_coin_seller),
    sellerCoinBalance: parseInt(r.seller_coin_balance || '0', 10),
    totalSalesCount: parseInt(r.total_sales_count || '0', 10),
    totalCoinsSold: parseInt(r.total_coins_sold || '0', 10),
    status: r.status,
    nickname: r.nickname,
    avatarUrl: r.avatar_url || '',
    poppoId: r.poppo_id || '',
  };
}

/**
 * Verify Agent Permissions
 */
export async function verifyAgentPermissions(
  userId: string,
  requiredCapability?: 'agent' | 'coin_seller' | 'admin'
): Promise<{ authorized: boolean; profile?: AgentProfile; error?: string }> {
  const profile = await getAgentProfile(userId);
  if (!profile) {
    return { authorized: false, error: 'Agent profile not found. Access denied.' };
  }
  if (profile.status !== 'active') {
    return { authorized: false, error: 'Agent account is suspended or inactive.' };
  }

  if (requiredCapability === 'coin_seller') {
    if (!profile.isCoinSeller) {
      return { authorized: false, error: 'User is not an authorized coin seller.' };
    }
  } else if (requiredCapability === 'admin') {
    if (profile.role !== 'agency_admin' && profile.role !== 'super_admin') {
      return { authorized: false, error: 'Agency admin permissions required.' };
    }
  }

  return { authorized: true, profile };
}

/**
 * Get Agent Earnings Dashboard
 */
export async function getAgentEarningsDashboard(userId: string): Promise<AgentEarningsDashboard> {
  const profile = await getAgentProfile(userId);
  if (!profile) {
    throw new Error('Agent profile not found');
  }

  let earningsRows = await query<any>(
    `SELECT * FROM popolive.agent_earnings WHERE agent_user_id = $1`,
    [userId]
  );

  if (earningsRows.length === 0) {
    await query(
      `INSERT INTO popolive.agent_earnings (agent_user_id, total_earnings_points, available_balance_points)
       VALUES ($1, 0, 0)
       ON CONFLICT (agent_user_id) DO NOTHING`,
      [userId]
    );
    earningsRows = await query<any>(
      `SELECT * FROM popolive.agent_earnings WHERE agent_user_id = $1`,
      [userId]
    );
  }

  const e = earningsRows[0] || {
    total_earnings_points: '0',
    available_balance_points: '0',
    pending_balance_points: '0',
    withdrawn_points: '0',
    confirmed_commissions_points: '0',
  };

  const totalEarningsPoints = parseInt(e.total_earnings_points || '0', 10);
  const availableBalancePoints = parseInt(e.available_balance_points || '0', 10);
  const pendingBalancePoints = parseInt(e.pending_balance_points || '0', 10);
  const withdrawnPoints = parseInt(e.withdrawn_points || '0', 10);
  const confirmedCommissionsPoints = parseInt(e.confirmed_commissions_points || '0', 10);

  // Check verified payout methods
  const methods = await query<any>(
    `SELECT count(*) as count FROM popolive.agent_payout_methods WHERE user_id = $1 AND is_verified = true`,
    [userId]
  );
  const hasVerifiedPayoutMethod = parseInt(methods[0]?.count || '0', 10) > 0;

  const minWithdrawalPoints = 10000; // $10 USD
  const maxWithdrawalPoints = 5000000; // $5000 USD
  let isWithdrawalEligible = true;
  let ineligibilityReason: string | undefined = undefined;

  if (profile.status !== 'active') {
    isWithdrawalEligible = false;
    ineligibilityReason = 'Account is not in active standing.';
  } else if (!hasVerifiedPayoutMethod) {
    isWithdrawalEligible = false;
    ineligibilityReason = 'No verified payout method attached. Please add JazzCash, Easypaisa, or Bank Account.';
  } else if (availableBalancePoints < minWithdrawalPoints) {
    isWithdrawalEligible = false;
    ineligibilityReason = `Minimum withdrawal is 10,000 points ($10 USD). Current available balance: ${availableBalancePoints.toLocaleString()} points.`;
  }

  // Get recent earnings from points_transactions
  const recentRows = await query<any>(
    `SELECT id, transaction_type, points_amount, description, created_at
     FROM popolive.points_transactions
     WHERE host_user_id = $1::text
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  const recentEarnings = recentRows.map((r: any) => ({
    id: r.id,
    type: r.transaction_type,
    points: parseInt(r.points_amount || '0', 10),
    description: r.description || 'Earnings transaction',
    createdAt: r.created_at,
  }));

  return {
    userId,
    role: profile.role,
    isCoinSeller: profile.isCoinSeller,
    sellerCoinBalance: profile.sellerCoinBalance,
    totalEarningsPoints,
    availableBalancePoints,
    pendingBalancePoints,
    withdrawnPoints,
    confirmedCommissionsPoints,
    exchangeRateUsdPerThousandPoints: 1.0, // 1,000 pts = $1.00 USD
    availableUsd: Number((availableBalancePoints / 1000).toFixed(2)),
    totalUsd: Number((totalEarningsPoints / 1000).toFixed(2)),
    pendingUsd: Number((pendingBalancePoints / 1000).toFixed(2)),
    withdrawnUsd: Number((withdrawnPoints / 1000).toFixed(2)),
    isWithdrawalEligible,
    ineligibilityReason,
    minWithdrawalPoints,
    maxWithdrawalPoints,
    hasVerifiedPayoutMethod,
    recentEarnings,
  };
}

/**
 * Get active coin packages for sellers
 */
export async function getSellerCoinPackages(): Promise<CoinSellerPackage[]> {
  const rows = await query<any>(
    `SELECT package_id, package_name, package_name_ur, base_coins, bonus_coins, total_coins, price_amount, currency, badge_text, is_popular
     FROM popolive.coin_packages
     WHERE is_active = true
     ORDER BY price_amount ASC`
  );

  return rows.map((r: any) => ({
    packageId: r.package_id,
    packageName: r.package_name,
    packageNameUr: r.package_name_ur || r.package_name,
    baseCoins: r.base_coins,
    bonusCoins: r.bonus_coins,
    totalCoins: r.total_coins,
    priceAmount: parseFloat(r.price_amount),
    currency: r.currency || 'USD',
    badgeText: r.badge_text,
    isPopular: Boolean(r.is_popular),
  }));
}

/**
 * Process Coin Sale from Authorized Seller to Customer
 */
export async function processCoinSale(
  sellerId: string,
  params: { customerIdentifier: string; packageId: string; idempotencyKey?: string }
): Promise<CoinSaleResult> {
  const { customerIdentifier, packageId, idempotencyKey } = params;

  // 1. Verify seller permissions
  const authCheck = await verifyAgentPermissions(sellerId, 'coin_seller');
  if (!authCheck.authorized || !authCheck.profile) {
    throw new Error(authCheck.error || 'User is not an authorized coin seller');
  }
  const sellerProfile = authCheck.profile;

  // 2. Check Idempotency
  if (idempotencyKey) {
    const existing = await query<any>(
      `SELECT s.*, u.nickname as customer_nickname, u.avatar_url as customer_avatar, u.poppo_id as customer_poppo_id
       FROM popolive.coin_seller_sales s
       JOIN popolive.users u ON u.id = s.customer_user_id
       WHERE s.idempotency_key = $1`,
      [idempotencyKey]
    );
    if (existing.length > 0) {
      const e = existing[0];
      return {
        saleReference: e.sale_reference,
        sellerUserId: e.seller_user_id,
        customerUserId: e.customer_user_id,
        customerNickname: e.customer_nickname,
        customerPoppoId: e.customer_poppo_id,
        customerAvatar: e.customer_avatar || '',
        packageId: e.package_id,
        coinsAmount: parseInt(e.coins_amount, 10),
        fiatAmount: parseFloat(e.fiat_amount),
        fiatCurrency: e.fiat_currency,
        commissionRate: parseFloat(e.commission_rate),
        commissionPoints: parseInt(e.commission_points, 10),
        sellerRemainingCoins: sellerProfile.sellerCoinBalance,
        customerNewCoins: 0,
        status: e.status,
        createdAt: e.created_at,
      };
    }
  }

  // 3. Find Package
  const pkgRows = await query<any>(
    `SELECT * FROM popolive.coin_packages WHERE package_id = $1 AND is_active = true`,
    [packageId]
  );
  if (pkgRows.length === 0) {
    throw new Error(`Coin package '${packageId}' not found or inactive`);
  }
  const pkg = pkgRows[0];
  const totalCoins = parseInt(pkg.total_coins, 10);
  const priceAmount = parseFloat(pkg.price_amount);

  // 4. Check Seller Coin Inventory
  if (sellerProfile.sellerCoinBalance < totalCoins) {
    throw new Error(`Insufficient seller coin inventory. Available: ${sellerProfile.sellerCoinBalance}, Required: ${totalCoins}`);
  }

  // 5. Resolve Customer
  const custRows = await query<any>(
    `SELECT id, nickname, avatar_url, poppo_id, email, phone FROM popolive.users
     WHERE (id::text = $1 OR poppo_id = $1 OR email = $1 OR phone = $1 OR nickname = $1 OR LOWER(nickname) = LOWER($1))
     LIMIT 1`,
    [customerIdentifier]
  );
  if (custRows.length === 0) {
    throw new Error(`Customer with identifier '${customerIdentifier}' not found`);
  }
  const customer = custRows[0];

  if (customer.id === sellerId) {
    throw new Error('Cannot sell coins to yourself.');
  }

  // 6. Calculate Commission
  const commissionRate = sellerProfile.commissionRate || 8.00;
  const commissionUsd = Number((priceAmount * (commissionRate / 100)).toFixed(2));
  const commissionPoints = Math.round(commissionUsd * 1000); // 1,000 pts per $1

  // 7. Atomic Transaction Execution
  return await withTransaction(async (client) => {
    // Generate sale reference
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const saleReference = `CS-${dateStr}-${randomHex}`;

    // A. Deduct seller balance & increment sales count
    const sellerUpdate = await client.query(
      `UPDATE popolive.agent_profiles
       SET seller_coin_balance = seller_coin_balance - $1,
           total_sales_count = total_sales_count + 1,
           total_coins_sold = total_coins_sold + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND seller_coin_balance >= $1
       RETURNING seller_coin_balance`,
      [totalCoins, sellerId]
    );

    if (sellerUpdate.rows.length === 0) {
      throw new Error('Transaction aborted: seller coin balance insufficient or lock conflict.');
    }
    const newSellerCoins = parseInt(sellerUpdate.rows[0].seller_coin_balance, 10);

    // Fetch or ensure seller wallet
    const sellerWalletRes = await client.query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points, total_spent_coins, total_received_points)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING wallet_id, diamond_points`,
      [String(sellerId)]
    );
    const sellerWalletId = sellerWalletRes.rows[0]?.wallet_id;
    const sellerDiamondPts = parseInt(sellerWalletRes.rows[0]?.diamond_points || '0', 10);

    // B. Credit Customer Coins in user_wallets
    const custWalletRes = await client.query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points, total_spent_coins, total_received_points)
       VALUES ($1, $2, 0, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET
         coins = popolive.user_wallets.coins + $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING wallet_id, coins`,
      [String(customer.id), totalCoins]
    );
    const customerWalletId = custWalletRes.rows[0]?.wallet_id;
    const customerNewCoins = parseInt(custWalletRes.rows[0]?.coins || '0', 10);

    // C. Record Coin Transaction for Customer Credit
    const custTxId = `TX-${dateStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO popolive.coin_transactions (
        transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
        previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
      ) VALUES ($1, $2, $3, 'seller_purchase', 'credit', $4, $5, $6, 'completed', $7, $8, $9, 'system')`,
      [
        custTxId,
        customerWalletId,
        customer.id,
        totalCoins,
        customerNewCoins - totalCoins,
        customerNewCoins,
        saleReference,
        idempotencyKey || null,
        `Purchased ${totalCoins} coins via Authorized Seller (${sellerProfile.nickname})`,
      ]
    );

    // D. Record Coin Transaction for Seller Debit
    const sellerTxId = `TX-${dateStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO popolive.coin_transactions (
        transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
        previous_balance, new_balance, status, reference_id, description, created_by
      ) VALUES ($1, $2, $3, 'seller_sale', 'debit', $4, $5, $6, 'completed', $7, $8, 'system')`,
      [
        sellerTxId,
        sellerWalletId,
        sellerId,
        totalCoins,
        newSellerCoins + totalCoins,
        newSellerCoins,
        saleReference,
        `Sold ${totalCoins} coins to ${customer.nickname} (${customer.poppo_id})`,
      ]
    );

    // E. Credit Agent Commission
    await client.query(
      `INSERT INTO popolive.agent_earnings (
        agent_user_id, total_earnings_points, available_balance_points, confirmed_commissions_points
      ) VALUES ($1, $2, $2, $2)
      ON CONFLICT (agent_user_id) DO UPDATE SET
        total_earnings_points = popolive.agent_earnings.total_earnings_points + $2,
        available_balance_points = popolive.agent_earnings.available_balance_points + $2,
        confirmed_commissions_points = popolive.agent_earnings.confirmed_commissions_points + $2,
        updated_at = CURRENT_TIMESTAMP`,
      [sellerId, commissionPoints]
    );

    // F. Record Commission in points_transactions
    const commTxId = `PT-${dateStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO popolive.points_transactions (
        transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
        source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
        previous_balance, new_balance, status, reference_id, description, created_by
      ) VALUES ($1, $2, $3, 'agent_commission', 'credit', $4, $5, $6, 'coin_sale', $7, $8, $9, $10, 'completed', $11, $12, 'system')`,
      [
        commTxId,
        sellerWalletId,
        sellerId,
        commissionPoints,
        totalCoins,
        commissionRate,
        customer.id,
        customer.nickname,
        sellerDiamondPts,
        sellerDiamondPts + commissionPoints,
        saleReference,
        `Agent Commission (${commissionRate}%) for coin sale ${saleReference}`,
      ]
    );

    // G. Record Coin Seller Sale
    const saleInsert = await client.query(
      `INSERT INTO popolive.coin_seller_sales (
        sale_reference, seller_user_id, customer_user_id, package_id, coins_amount,
        fiat_amount, fiat_currency, commission_rate, commission_points, status, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7, $8, 'completed', $9)
      RETURNING *`,
      [
        saleReference,
        sellerId,
        customer.id,
        packageId,
        totalCoins,
        priceAmount,
        commissionRate,
        commissionPoints,
        idempotencyKey || null,
      ]
    );
    const saleRecord = saleInsert.rows[0];

    // H. Realtime Events for Seller & Customer
    await client.query(
      `INSERT INTO popolive.agent_realtime_events (user_id, event_type, payload)
       VALUES ($1, 'coin_sale_completed', $2),
              ($3, 'coin_purchase_received', $4)`,
      [
        sellerId,
        JSON.stringify({
          saleReference,
          packageId,
          totalCoins,
          commissionPoints,
          remainingSellerCoins: newSellerCoins,
          customerNickname: customer.nickname,
        }),
        customer.id,
        JSON.stringify({
          saleReference,
          coinsReceived: totalCoins,
          newBalance: customerNewCoins,
          sellerNickname: sellerProfile.nickname,
        }),
      ]
    );

    // I. Dispatch Push Alert to Customer
    try {
      await dispatchPushNotification(customer.id, {
        type: 'system_notice',
        title: 'Coins Received!',
        body: `You received ${totalCoins.toLocaleString()} coins from Authorized Seller ${sellerProfile.nickname}.`,
        data: { saleReference, coins: totalCoins },
      });
    } catch (e) {
      // Non-fatal
    }

    return {
      saleReference: saleRecord.sale_reference,
      sellerUserId: saleRecord.seller_user_id,
      customerUserId: saleRecord.customer_user_id,
      customerNickname: customer.nickname,
      customerPoppoId: customer.poppo_id,
      customerAvatar: customer.avatar_url || '',
      packageId: saleRecord.package_id,
      coinsAmount: parseInt(saleRecord.coins_amount, 10),
      fiatAmount: parseFloat(saleRecord.fiat_amount),
      fiatCurrency: saleRecord.fiat_currency,
      commissionRate: parseFloat(saleRecord.commission_rate),
      commissionPoints: parseInt(saleRecord.commission_points, 10),
      sellerRemainingCoins: newSellerCoins,
      customerNewCoins,
      status: saleRecord.status,
      createdAt: saleRecord.created_at,
    };
  });
}

/**
 * Get Coin Sales History for a seller
 */
export async function getCoinSalesHistory(
  sellerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ sales: any[]; totalCount: number }> {
  const countRes = await query<any>(
    `SELECT count(*) as count FROM popolive.coin_seller_sales WHERE seller_user_id = $1`,
    [sellerId]
  );
  const totalCount = parseInt(countRes[0]?.count || '0', 10);

  const rows = await query<any>(
    `SELECT s.*, u.nickname as customer_nickname, u.avatar_url as customer_avatar, u.poppo_id as customer_poppo_id
     FROM popolive.coin_seller_sales s
     JOIN popolive.users u ON u.id = s.customer_user_id
     WHERE s.seller_user_id = $1
     ORDER BY s.created_at DESC
     LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );

  const sales = rows.map((r: any) => ({
    id: r.id,
    saleReference: r.sale_reference,
    customerUserId: r.customer_user_id,
    customerNickname: r.customer_nickname,
    customerPoppoId: r.customer_poppo_id,
    customerAvatar: r.customer_avatar || '',
    packageId: r.package_id,
    coinsAmount: parseInt(r.coins_amount, 10),
    fiatAmount: parseFloat(r.fiat_amount),
    fiatCurrency: r.fiat_currency || 'USD',
    commissionRate: parseFloat(r.commission_rate),
    commissionPoints: parseInt(r.commission_points, 10),
    status: r.status,
    createdAt: r.created_at,
  }));

  return { sales, totalCount };
}

/**
 * Get Payout Methods for an Agent/Host
 */
export async function getPayoutMethods(userId: string): Promise<PayoutMethod[]> {
  const rows = await query<any>(
    `SELECT * FROM popolive.agent_payout_methods
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    provider: r.provider,
    accountTitle: r.account_title,
    accountNumberMasked: r.account_number_masked,
    bankName: r.bank_name || undefined,
    isDefault: Boolean(r.is_default),
    isVerified: Boolean(r.is_verified),
    createdAt: r.created_at,
  }));
}

/**
 * Add Payout Method
 */
export async function addPayoutMethod(
  userId: string,
  params: {
    provider: 'jazzcash' | 'easypaisa' | 'bank_transfer';
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
    isDefault?: boolean;
  }
): Promise<PayoutMethod> {
  const { provider, accountTitle, accountNumber, bankName, isDefault = false } = params;

  if (!['jazzcash', 'easypaisa', 'bank_transfer'].includes(provider)) {
    throw new Error('Invalid payout provider. Supported: jazzcash, easypaisa, bank_transfer');
  }

  const cleanTitle = accountTitle.trim();
  if (cleanTitle.length < 3) {
    throw new Error('Account title must be at least 3 characters.');
  }

  const cleanNumber = accountNumber.replace(/\s+/g, '');
  if (cleanNumber.length < 8) {
    throw new Error('Account number must be at least 8 digits/characters.');
  }

  // Masking: •••• •••• •• + last 4 digits
  const last4 = cleanNumber.slice(-4);
  const accountNumberMasked = `•••• •••• ••${last4}`;
  const accountNumberHash = crypto.createHash('sha256').update(cleanNumber).digest('hex');

  // Check if first method, if so make default
  const countRes = await query<any>(
    `SELECT count(*) as count FROM popolive.agent_payout_methods WHERE user_id = $1`,
    [userId]
  );
  const isFirst = parseInt(countRes[0]?.count || '0', 10) === 0;
  const shouldBeDefault = isFirst || isDefault;

  if (shouldBeDefault) {
    await query(
      `UPDATE popolive.agent_payout_methods SET is_default = false WHERE user_id = $1`,
      [userId]
    );
  }

  const insertRes = await query<any>(
    `INSERT INTO popolive.agent_payout_methods (
      user_id, provider, account_title, account_number_masked, account_number_hash, bank_name, is_default, is_verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING *`,
    [userId, provider, cleanTitle, accountNumberMasked, accountNumberHash, bankName || null, shouldBeDefault]
  );

  const r = insertRes[0];
  return {
    id: r.id,
    userId: r.user_id,
    provider: r.provider,
    accountTitle: r.account_title,
    accountNumberMasked: r.account_number_masked,
    bankName: r.bank_name || undefined,
    isDefault: Boolean(r.is_default),
    isVerified: Boolean(r.is_verified),
    createdAt: r.created_at,
  };
}

/**
 * Delete Payout Method
 */
export async function deletePayoutMethod(userId: string, methodId: string): Promise<boolean> {
  const res = await query<any>(
    `DELETE FROM popolive.agent_payout_methods WHERE id = $1 AND user_id = $2 RETURNING id`,
    [methodId, userId]
  );
  return res.length > 0;
}

/**
 * Request Withdrawal
 */
export async function requestWithdrawal(
  userId: string,
  params: { pointsAmount: number; payoutMethodId: string }
): Promise<WithdrawalRecord> {
  const { pointsAmount, payoutMethodId } = params;

  const minPoints = 10000; // $10 USD
  const maxPoints = 5000000; // $5,000 USD

  if (pointsAmount < minPoints) {
    throw new Error(`Minimum withdrawal amount is ${minPoints.toLocaleString()} points ($10 USD).`);
  }
  if (pointsAmount > maxPoints) {
    throw new Error(`Maximum withdrawal per request is ${maxPoints.toLocaleString()} points ($5,000 USD).`);
  }

  // Verify payout method
  const methodRows = await query<any>(
    `SELECT * FROM popolive.agent_payout_methods WHERE id = $1 AND user_id = $2`,
    [payoutMethodId, userId]
  );
  if (methodRows.length === 0) {
    throw new Error('Payout method not found or does not belong to user.');
  }
  const method = methodRows[0];
  if (!method.is_verified) {
    throw new Error('Payout method is not verified.');
  }

  // Atomic withdrawal processing
  return await withTransaction(async (client) => {
    // 1. Lock and check earnings
    const earnRes = await client.query(
      `SELECT available_balance_points, pending_balance_points
       FROM popolive.agent_earnings
       WHERE agent_user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (earnRes.rows.length === 0) {
      throw new Error('Agent earnings record not found.');
    }

    const available = parseInt(earnRes.rows[0].available_balance_points || '0', 10);
    if (available < pointsAmount) {
      throw new Error(`Insufficient available points. Requested: ${pointsAmount}, Available: ${available}`);
    }

    // 2. Deduct from available, add to pending
    await client.query(
      `UPDATE popolive.agent_earnings
       SET available_balance_points = available_balance_points - $1,
           pending_balance_points = pending_balance_points + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE agent_user_id = $2`,
      [pointsAmount, userId]
    );

    // 3. Generate withdrawal reference
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ref = `WTH-${dateStr}-${randomHex}`;
    const fiatAmount = Number((pointsAmount / 1000).toFixed(2));

    // 4. Insert withdrawal record
    const insertRes = await client.query(
      `INSERT INTO popolive.agent_withdrawals (
        withdrawal_reference, user_id, payout_method_id, points_amount, fiat_amount, currency, status
      ) VALUES ($1, $2, $3, $4, $5, 'USD', 'pending')
      RETURNING *`,
      [ref, userId, payoutMethodId, pointsAmount, fiatAmount]
    );
    const w = insertRes.rows[0];

    // 5. Record points transaction
    const userWalletRes = await client.query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points, total_spent_coins, total_received_points)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING wallet_id, diamond_points`,
      [String(userId)]
    );
    const userWalletId = userWalletRes.rows[0]?.wallet_id;
    const userDiamondPts = parseInt(userWalletRes.rows[0]?.diamond_points || '0', 10);

    const txId = `PT-${dateStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO popolive.points_transactions (
        transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
        source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
        previous_balance, new_balance, status, reference_id, description, created_by
      ) VALUES ($1, $2, $3, 'withdrawal_debit', 'debit', $4, 0, 0, 'withdrawal', $5, 'Self', $6, $7, 'pending', $8, $9, 'system')`,
      [
        txId,
        userWalletId,
        userId,
        pointsAmount,
        userId,
        userDiamondPts,
        userDiamondPts,
        ref,
        `Withdrawal request for ${pointsAmount.toLocaleString()} points ($${fiatAmount}) via ${method.provider}`,
      ]
    );

    // 6. Realtime Event
    await client.query(
      `INSERT INTO popolive.agent_realtime_events (user_id, event_type, payload)
       VALUES ($1, 'withdrawal_requested', $2)`,
      [
        userId,
        JSON.stringify({
          withdrawalReference: ref,
          pointsAmount,
          fiatAmount,
          provider: method.provider,
        }),
      ]
    );

    // 7. Dispatch push notification
    try {
      await dispatchPushNotification(userId, {
        type: 'system_notice',
        title: 'Withdrawal Submitted',
        body: `Your withdrawal request of $${fiatAmount} (${pointsAmount.toLocaleString()} points) has been received and is under review.`,
        data: { reference: ref, amount: fiatAmount },
      });
    } catch (e) {
      // Non-fatal
    }

    return {
      id: w.id,
      withdrawalReference: w.withdrawal_reference,
      userId: w.user_id,
      payoutMethodId: w.payout_method_id,
      provider: method.provider,
      accountTitle: method.account_title,
      accountNumberMasked: method.account_number_masked,
      bankName: method.bank_name || undefined,
      pointsAmount: parseInt(w.points_amount, 10),
      fiatAmount: parseFloat(w.fiat_amount),
      currency: w.currency,
      status: w.status,
      rejectionReason: w.rejection_reason || undefined,
      createdAt: w.created_at,
      completedAt: w.completed_at || undefined,
    };
  });
}

/**
 * Get Withdrawal History
 */
export async function getWithdrawalHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ withdrawals: WithdrawalRecord[]; totalCount: number }> {
  const countRes = await query<any>(
    `SELECT count(*) as count FROM popolive.agent_withdrawals WHERE user_id = $1`,
    [userId]
  );
  const totalCount = parseInt(countRes[0]?.count || '0', 10);

  const rows = await query<any>(
    `SELECT w.*, pm.provider, pm.account_title, pm.account_number_masked, pm.bank_name
     FROM popolive.agent_withdrawals w
     LEFT JOIN popolive.agent_payout_methods pm ON pm.id = w.payout_method_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const withdrawals = rows.map((r: any) => ({
    id: r.id,
    withdrawalReference: r.withdrawal_reference,
    userId: r.user_id,
    payoutMethodId: r.payout_method_id,
    provider: r.provider || 'payout_method',
    accountTitle: r.account_title || '',
    accountNumberMasked: r.account_number_masked || '',
    bankName: r.bank_name || undefined,
    pointsAmount: parseInt(r.points_amount, 10),
    fiatAmount: parseFloat(r.fiat_amount),
    currency: r.currency || 'USD',
    status: r.status,
    rejectionReason: r.rejection_reason || undefined,
    createdAt: r.created_at,
    completedAt: r.completed_at || undefined,
  }));

  return { withdrawals, totalCount };
}

/**
 * Agency Admin: Get Managed Agents & Coin Sellers
 */
export async function getAgencyAdminAgents(adminUserId: string): Promise<any[]> {
  const auth = await verifyAgentPermissions(adminUserId, 'admin');
  if (!auth.authorized) {
    throw new Error(auth.error || 'Only agency admins can view agent roster.');
  }

  // Find agency
  const agencyRes = await query<any>(
    `SELECT id, name FROM popolive.agencies WHERE admin_user_id = $1`,
    [adminUserId]
  );
  const agencyId = agencyRes[0]?.id || auth.profile?.agencyId;

  const rows = await query<any>(
    `SELECT ap.*, u.nickname, u.avatar_url, u.poppo_id, u.country, u.wealth_level,
            COALESCE(ae.total_earnings_points, 0) as total_earnings_points,
            COALESCE(ae.confirmed_commissions_points, 0) as confirmed_commissions_points
     FROM popolive.agent_profiles ap
     JOIN popolive.users u ON u.id = ap.user_id
     LEFT JOIN popolive.agent_earnings ae ON ae.agent_user_id = ap.user_id
     WHERE ap.agency_id = $1 OR ap.user_id = $2
     ORDER BY ap.total_coins_sold DESC, ap.created_at DESC`,
    [agencyId, adminUserId]
  );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    agencyId: r.agency_id,
    nickname: r.nickname,
    poppoId: r.poppo_id,
    avatarUrl: r.avatar_url || '',
    country: r.country || 'PK',
    wealthLevel: r.wealth_level || 1,
    role: r.role,
    commissionRate: parseFloat(r.commission_rate || '8.00'),
    isCoinSeller: Boolean(r.is_coin_seller),
    sellerCoinBalance: parseInt(r.seller_coin_balance || '0', 10),
    totalSalesCount: parseInt(r.total_sales_count || '0', 10),
    totalCoinsSold: parseInt(r.total_coins_sold || '0', 10),
    totalEarningsPoints: parseInt(r.total_earnings_points || '0', 10),
    confirmedCommissionsPoints: parseInt(r.confirmed_commissions_points || '0', 10),
    status: r.status,
    createdAt: r.created_at,
  }));
}
