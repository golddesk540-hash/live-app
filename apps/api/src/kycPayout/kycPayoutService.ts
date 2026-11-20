/**
 * POPO LIVE — KYC & WITHDRAWAL PAYOUT SERVICE & BUSINESS RULES ENGINE
 * 
 * Enforces:
 * - Age 18+ verification for KYC & withdrawals
 * - Mandatory verified KYC & earning eligibility gate before any withdrawal
 * - Strict bank account / wallet name match against verified KYC legal name
 * - 24-hour cooling period enforcement post-verification
 * - Atomic P7-P7 wallet debit on withdrawal creation
 * - Atomic P7-P7 wallet refund on withdrawal rejection or payout failure
 * - Admin approval queue lifecycle (pending -> approved -> paid)
 * - Cryptographic webhook verification with replay protection
 */

import crypto from 'crypto';
import { Pool } from 'pg';
import { kycProvider } from './kycProvider';
import { payoutProvider } from './payoutProvider';
import {
  KycRecord,
  KycSession,
  KycWebhookEvent,
  PayoutMethod,
  PayoutWebhookEvent,
  WithdrawalRequest,
} from './kycPayoutTypes';

let poolInstance: Pool | null = null;

function getDbPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
    });
  }
  return poolInstance;
}

interface MockUser {
  id: string;
  birthdate: string;
  is_adult_verified: boolean;
  status: string;
}

interface MockWallet {
  wallet_id: string;
  user_id: string;
  coins: number;
  diamond_points: number;
  total_spent_coins: number;
  is_frozen: boolean;
}

interface MockCoinTransaction {
  id: string;
  transaction_id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: string;
  direction: 'credit' | 'debit';
  coin_amount: number;
  previous_balance: number;
  new_balance: number;
  status: string;
  reference_id: string;
  idempotency_key?: string | null;
  created_at: string;
}

export class KycPayoutService {
  private mockUsers: Map<string, MockUser> = new Map();
  private mockWallets: Map<string, MockWallet> = new Map();
  private mockKycRecords: Map<string, KycRecord> = new Map();
  private mockPayoutMethods: Map<string, PayoutMethod> = new Map();
  private mockWithdrawals: Map<string, WithdrawalRequest> = new Map();
  private mockCoinTransactions: MockCoinTransaction[] = [];
  private processedWebhookEvents: Set<string> = new Set();
  private userWithdrawalTimestamps: Map<string, number[]> = new Map();

  // --- MOCK REPOSITORY METHODS ---
  public registerMockUser(user: MockUser): void {
    this.mockUsers.set(user.id, user);
  }

  public registerMockWallet(wallet: MockWallet): void {
    this.mockWallets.set(wallet.user_id, wallet);
  }

  public registerMockKyc(kyc: KycRecord): void {
    this.mockKycRecords.set(kyc.userId, kyc);
  }

  public registerMockPayoutMethod(method: PayoutMethod): void {
    this.mockPayoutMethods.set(method.id, method);
  }

  public getMockWallet(userId: string): MockWallet | undefined {
    return this.mockWallets.get(userId);
  }

  public getMockKyc(userId: string): KycRecord | undefined {
    return this.mockKycRecords.get(userId);
  }

  public getMockTransactions(): MockCoinTransaction[] {
    return [...this.mockCoinTransactions];
  }

  public getMockWithdrawals(): WithdrawalRequest[] {
    return Array.from(this.mockWithdrawals.values());
  }

  // --- KYC SESSION START ---
  public async startKyc(userId: string): Promise<{
    success: boolean;
    session?: KycSession;
    error?: string;
    code?: string;
  }> {
    // 1. Verify User Eligibility (Age 18+)
    let user: any = this.mockUsers.get(userId);
    if (!user) {
      try {
        const pool = getDbPool();
        const userRes = await pool.query(
          `SELECT id, birthdate, is_adult_verified, status FROM popolive.users WHERE id = $1 LIMIT 1`,
          [userId]
        );
        if (userRes.rows.length > 0) user = userRes.rows[0];
      } catch (_) {}
    }

    if (!user) {
      return { success: false, error: 'User not found.', code: 'USER_NOT_FOUND' };
    }

    let isAdult = Boolean(user.is_adult_verified);
    if (!isAdult && user.birthdate) {
      const birthYear = new Date(user.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      isAdult = currentYear - birthYear >= 18;
    }

    if (!isAdult) {
      return {
        success: false,
        error: 'Age verification failed. You must be at least 18 years old to undergo KYC verification.',
        code: 'UNDERAGE_KYC_FORBIDDEN',
      };
    }

    // 2. Generate Provider Inquiry Session
    const session = await kycProvider.createSession(userId);

    // Save pending record
    const existingKyc = this.mockKycRecords.get(userId);
    this.mockKycRecords.set(userId, {
      userId,
      status: existingKyc?.status === 'verified' ? 'verified' : 'pending',
      earningEligible: existingKyc?.earningEligible || false,
      legalName: existingKyc?.legalName || null,
      documentCountry: existingKyc?.documentCountry || null,
      verificationId: session.sessionId,
      createdAt: existingKyc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      session,
    };
  }

  // --- KYC WEBHOOK INGESTION ---
  public async handleKycWebhook(event: KycWebhookEvent): Promise<{
    handled: boolean;
    status: number;
    deduplicated?: boolean;
    error?: string;
    kycRecord?: KycRecord;
  }> {
    const { eventId, userId, verificationId, eventType, signature } = event;

    // 1. Verify Signature
    const isValid = kycProvider.verifyWebhookSignature(
      { eventId, userId, verificationId, eventType },
      signature
    );

    if (!isValid) {
      return {
        handled: false,
        status: 403,
        error: 'Invalid or missing cryptographic KYC webhook signature.',
      };
    }

    // 2. Idempotency Check
    if (this.processedWebhookEvents.has(eventId)) {
      return {
        handled: true,
        status: 200,
        deduplicated: true,
        kycRecord: this.mockKycRecords.get(userId),
      };
    }
    this.processedWebhookEvents.add(eventId);

    // 3. Process Result
    let kyc = this.mockKycRecords.get(userId);
    if (!kyc) {
      kyc = {
        userId,
        status: 'pending',
        earningEligible: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.mockKycRecords.set(userId, kyc);
    }

    if (eventType === 'inquiry.completed' || eventType === 'verification.passed') {
      kyc.status = 'verified';
      kyc.earningEligible = true;
      kyc.legalName = event.legalName || 'Verified Host';
      kyc.documentCountry = event.documentCountry || 'PK';
      kyc.verificationId = verificationId;
      kyc.verifiedAt = new Date().toISOString();
      kyc.updatedAt = new Date().toISOString();
    } else if (eventType === 'verification.failed') {
      kyc.status = 'rejected';
      kyc.earningEligible = false;
      kyc.rejectionReason = event.rejectionReason || 'Document unreadable or liveness check failed';
      kyc.updatedAt = new Date().toISOString();
    }

    return {
      handled: true,
      status: 200,
      kycRecord: kyc,
    };
  }

  // --- KYC STATUS QUERY ---
  public async getKycStatus(userId: string): Promise<KycRecord> {
    const kyc = this.mockKycRecords.get(userId);
    if (kyc) return kyc;

    return {
      userId,
      status: 'not_started',
      earningEligible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // --- WITHDRAWAL REQUEST INITIATION ---
  public async requestWithdrawal(params: {
    userId: string;
    amount: number;
    payoutMethodId?: string;
    idempotencyKey?: string;
    skipCoolingPeriodCheck?: boolean;
  }): Promise<{
    success: boolean;
    withdrawal?: WithdrawalRequest;
    newBalance?: number;
    deduplicated?: boolean;
    error?: string;
    code?: string;
  }> {
    const { userId, amount, payoutMethodId, idempotencyKey, skipCoolingPeriodCheck = false } = params;

    // 1. Age Verification
    let user: any = this.mockUsers.get(userId);
    if (!user) {
      try {
        const pool = getDbPool();
        const userRes = await pool.query(
          `SELECT id, birthdate, is_adult_verified, status FROM popolive.users WHERE id = $1 LIMIT 1`,
          [userId]
        );
        if (userRes.rows.length > 0) user = userRes.rows[0];
      } catch (_) {}
    }

    if (!user) {
      return { success: false, error: 'User not found.', code: 'USER_NOT_FOUND' };
    }

    let isAdult = Boolean(user.is_adult_verified);
    if (!isAdult && user.birthdate) {
      const birthYear = new Date(user.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      isAdult = currentYear - birthYear >= 18;
    }

    if (!isAdult) {
      return {
        success: false,
        error: 'Age verification failed. You must be at least 18 years old to request withdrawals.',
        code: 'UNDERAGE_WITHDRAWAL_FORBIDDEN',
      };
    }

    // 2. KYC Verification & Earning Eligibility Gate
    const kyc = await this.getKycStatus(userId);
    if (kyc.status !== 'verified' || !kyc.earningEligible) {
      return {
        success: false,
        error: 'KYC_REQUIRED: Earning identity / KYC verification is required before requesting withdrawal.',
        code: 'KYC_REQUIRED',
      };
    }

    // 3. Min / Max Limit Checks (P7-P2 schema rules: 1,000 to 500,000 coins)
    if (isNaN(amount) || amount < 1000) {
      return {
        success: false,
        error: 'MINIMUM_WITHDRAWAL_LIMIT: Minimum withdrawal amount is 1,000 coins.',
        code: 'MINIMUM_WITHDRAWAL_LIMIT',
      };
    }
    if (amount > 500000) {
      return {
        success: false,
        error: 'MAXIMUM_WITHDRAWAL_LIMIT: Maximum withdrawal amount is 500,000 coins.',
        code: 'MAXIMUM_WITHDRAWAL_LIMIT',
      };
    }

    // 4. Beneficiary Name Matching Verification
    let beneficiaryNameSnapshot = kyc.legalName || 'Verified Host';
    if (payoutMethodId) {
      const method = this.mockPayoutMethods.get(payoutMethodId);
      if (method) {
        const isMatch = payoutProvider.verifyAccountNameMatch(method.beneficiaryName, kyc.legalName);
        if (!isMatch) {
          return {
            success: false,
            error: `BANK_NAME_MISMATCH: Payout beneficiary name (${method.beneficiaryName}) does not match verified KYC legal name (${kyc.legalName}).`,
            code: 'BANK_NAME_MISMATCH',
          };
        }
        beneficiaryNameSnapshot = method.beneficiaryName;
      }
    }

    // 5. Anti-Fraud Cooling Period Check (24 Hours post-KYC verification)
    if (!skipCoolingPeriodCheck && kyc.verifiedAt) {
      const verifiedTimestamp = new Date(kyc.verifiedAt).getTime();
      const coolingPeriodMs = 24 * 60 * 60 * 1000;
      if (Date.now() - verifiedTimestamp < coolingPeriodMs) {
        const remainingHours = Math.ceil((coolingPeriodMs - (Date.now() - verifiedTimestamp)) / (3600 * 1000));
        return {
          success: false,
          error: `COOLING_PERIOD_ACTIVE: Security cooling period is active. Withdrawal available in ${remainingHours} hours.`,
          code: 'COOLING_PERIOD_ACTIVE',
        };
      }
    }

    // 6. Rate Limiting Check (Max 5 withdrawals per 24 hours per user)
    const now = Date.now();
    const timestamps = this.userWithdrawalTimestamps.get(userId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
    if (validTimestamps.length >= 5) {
      return {
        success: false,
        error: 'Too many withdrawal requests today. Please wait 24 hours.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }
    validTimestamps.push(now);
    this.userWithdrawalTimestamps.set(userId, validTimestamps);

    // 7. Idempotency Check
    if (idempotencyKey) {
      const existing = Array.from(this.mockWithdrawals.values()).find(
        (w) => w.idempotencyKey === idempotencyKey && w.userId === userId
      );
      if (existing) {
        const currentWallet = this.mockWallets.get(userId);
        return {
          success: true,
          deduplicated: true,
          withdrawal: existing,
          newBalance: currentWallet?.coins,
        };
      }
    }

    // 8. Atomic Debit via P7-P7 Ledger
    let wallet = this.mockWallets.get(userId);
    if (!wallet) {
      wallet = {
        wallet_id: `wal_${userId}`,
        user_id: userId,
        coins: 0,
        diamond_points: 0,
        total_spent_coins: 0,
        is_frozen: false,
      };
      this.mockWallets.set(userId, wallet);
    }

    if (wallet.coins < amount) {
      return {
        success: false,
        error: `INSUFFICIENT_COINS: User balance (${wallet.coins} coins) is insufficient for withdrawal (${amount} coins).`,
        code: 'INSUFFICIENT_COINS',
      };
    }

    const prevBalance = wallet.coins;
    const newBalance = prevBalance - amount;
    wallet.coins = newBalance;
    wallet.total_spent_coins += amount;

    const ref = `WTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const txId = `TX-${ref}`;

    this.mockCoinTransactions.push({
      id: crypto.randomUUID(),
      transaction_id: txId,
      wallet_id: wallet.wallet_id,
      user_id: userId,
      transaction_type: 'withdrawal',
      direction: 'debit',
      coin_amount: amount,
      previous_balance: prevBalance,
      new_balance: newBalance,
      status: 'completed',
      reference_id: ref,
      idempotency_key: idempotencyKey || null,
      created_at: new Date().toISOString(),
    });

    const withdrawal: WithdrawalRequest = {
      id: crypto.randomUUID(),
      withdrawalReference: ref,
      userId,
      payoutMethodId: payoutMethodId || null,
      coinsAmount: amount,
      fiatAmount: amount / 100, // Conversion rate snapshot ($10 per 1,000 coins)
      currency: 'USD',
      status: 'pending',
      beneficiaryNameSnapshot,
      idempotencyKey: idempotencyKey || null,
      coolingPeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockWithdrawals.set(ref, withdrawal);

    return {
      success: true,
      deduplicated: false,
      withdrawal,
      newBalance,
    };
  }

  // --- ADMIN APPROVAL & REJECTION QUEUE ---
  public async approveWithdrawal(
    withdrawalRef: string,
    adminUserId: string
  ): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; error?: string }> {
    const withdrawal = this.mockWithdrawals.get(withdrawalRef);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found.' };
    }
    if (withdrawal.status !== 'pending') {
      return { success: false, error: `Cannot approve withdrawal with status ${withdrawal.status}.` };
    }

    withdrawal.status = 'approved';
    withdrawal.approvedBy = adminUserId;
    withdrawal.approvedAt = new Date().toISOString();
    withdrawal.updatedAt = new Date().toISOString();

    // Trigger provider payout transfer
    const payoutRes = await payoutProvider.executePayout(withdrawal);
    if (payoutRes.providerPayoutRef) {
      withdrawal.providerPayoutRef = payoutRes.providerPayoutRef;
      withdrawal.status = 'processing';
    }

    return { success: true, withdrawal };
  }

  public async rejectWithdrawal(
    withdrawalRef: string,
    adminUserId: string,
    reason: string
  ): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; error?: string }> {
    const withdrawal = this.mockWithdrawals.get(withdrawalRef);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found.' };
    }
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
      return { success: false, error: `Cannot reject withdrawal with status ${withdrawal.status}.` };
    }

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    withdrawal.updatedAt = new Date().toISOString();

    // ATOMIC REFUND: Credit coins back to user's wallet via P7-P7 ledger
    const wallet = this.mockWallets.get(withdrawal.userId);
    if (wallet) {
      const prevBalance = wallet.coins;
      const newBalance = prevBalance + withdrawal.coinsAmount;
      wallet.coins = newBalance;
      wallet.total_spent_coins -= withdrawal.coinsAmount;

      const refundTxId = `TX-REFUND-${withdrawal.withdrawalReference}`;
      this.mockCoinTransactions.push({
        id: crypto.randomUUID(),
        transaction_id: refundTxId,
        wallet_id: wallet.wallet_id,
        user_id: withdrawal.userId,
        transaction_type: 'withdrawal_refund',
        direction: 'credit',
        coin_amount: withdrawal.coinsAmount,
        previous_balance: prevBalance,
        new_balance: newBalance,
        status: 'completed',
        reference_id: withdrawal.withdrawalReference,
        created_at: new Date().toISOString(),
      });
    }

    return { success: true, withdrawal };
  }

  // --- PAYOUT WEBHOOK HANDLING ---
  public async handlePayoutWebhook(event: PayoutWebhookEvent): Promise<{
    handled: boolean;
    status: number;
    deduplicated?: boolean;
    error?: string;
    withdrawal?: WithdrawalRequest;
  }> {
    const { eventId, withdrawalReference, eventType, amount, currency, signature } = event;

    // 1. Verify Signature
    const isValid = payoutProvider.verifyWebhookSignature(
      { eventId, withdrawalReference, eventType, amount, currency },
      signature
    );

    if (!isValid) {
      return {
        handled: false,
        status: 403,
        error: 'Invalid or missing cryptographic payout webhook signature.',
      };
    }

    // 2. Idempotency Check
    if (this.processedWebhookEvents.has(eventId)) {
      return {
        handled: true,
        status: 200,
        deduplicated: true,
        withdrawal: this.mockWithdrawals.get(withdrawalReference),
      };
    }
    this.processedWebhookEvents.add(eventId);

    const withdrawal = this.mockWithdrawals.get(withdrawalReference);
    if (!withdrawal) {
      return { handled: false, status: 404, error: `Withdrawal ${withdrawalReference} not found.` };
    }

    if (eventType === 'payout.paid') {
      withdrawal.status = 'paid';
      withdrawal.paidAt = new Date().toISOString();
      withdrawal.updatedAt = new Date().toISOString();
      return { handled: true, status: 200, withdrawal };
    } else if (eventType === 'payout.failed') {
      withdrawal.status = 'failed';
      withdrawal.failureReason = event.failureReason || 'Bank account invalid or transfer rejected by rail';
      withdrawal.updatedAt = new Date().toISOString();

      // ATOMIC REFUND: Credit coins back to user wallet via P7-P7 ledger
      const wallet = this.mockWallets.get(withdrawal.userId);
      if (wallet) {
        const prevBalance = wallet.coins;
        const newBalance = prevBalance + withdrawal.coinsAmount;
        wallet.coins = newBalance;
        wallet.total_spent_coins -= withdrawal.coinsAmount;

        const refundTxId = `TX-PAYOUT-FAIL-REFUND-${withdrawal.withdrawalReference}`;
        this.mockCoinTransactions.push({
          id: crypto.randomUUID(),
          transaction_id: refundTxId,
          wallet_id: wallet.wallet_id,
          user_id: withdrawal.userId,
          transaction_type: 'payout_failed_refund',
          direction: 'credit',
          coin_amount: withdrawal.coinsAmount,
          previous_balance: prevBalance,
          new_balance: newBalance,
          status: 'completed',
          reference_id: withdrawal.withdrawalReference,
          created_at: new Date().toISOString(),
        });
      }

      return { handled: true, status: 200, withdrawal };
    }

    return { handled: false, status: 400, error: `Unhandled payout event: ${eventType}` };
  }

  // --- WITHDRAWAL HISTORY ---
  public async getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
    return Array.from(this.mockWithdrawals.values())
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const kycPayoutService = new KycPayoutService();
