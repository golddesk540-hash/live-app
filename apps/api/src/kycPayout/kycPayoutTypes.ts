/**
 * POPO LIVE — KYC & REAL WITHDRAWAL PAYOUT TYPES
 * Supports Identity Verification (Persona/Onfido), Bank/Wallet Payout Rails,
 * Admin Approval Lifecycle, Cooling Periods, and Atomic Ledger Refunds
 */

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'paid'
  | 'rejected'
  | 'failed';

export interface KycSession {
  sessionId: string;
  userId: string;
  inquiryUrl: string;
  clientToken: string;
  status: KycStatus;
  provider: 'persona' | 'onfido' | 'sandbox';
  expiresAt: string;
  createdAt: string;
}

export interface KycRecord {
  userId: string;
  status: KycStatus;
  earningEligible: boolean;
  legalName?: string | null;
  documentCountry?: string | null;
  verificationId?: string | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutMethod {
  id: string;
  userId: string;
  methodType: 'bank_account' | 'stripe_connect' | 'jazzcash' | 'easypaisa';
  beneficiaryName: string;
  accountNumberMasked: string;
  bankName: string;
  currency: string;
  isVerified: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  withdrawalReference: string;
  userId: string;
  payoutMethodId?: string | null;
  coinsAmount: number;
  fiatAmount: number;
  currency: string;
  status: WithdrawalStatus;
  beneficiaryNameSnapshot?: string;
  rejectionReason?: string | null;
  failureReason?: string | null;
  idempotencyKey?: string | null;
  providerPayoutRef?: string | null;
  coolingPeriodEndsAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycWebhookEvent {
  eventId: string;
  eventType: 'inquiry.completed' | 'verification.passed' | 'verification.failed';
  userId: string;
  verificationId: string;
  legalName?: string;
  documentCountry?: string;
  rejectionReason?: string;
  signature?: string;
  timestamp: string;
}

export interface PayoutWebhookEvent {
  eventId: string;
  eventType: 'payout.paid' | 'payout.failed';
  withdrawalReference: string;
  amount: number;
  currency: string;
  providerPayoutRef?: string;
  failureReason?: string;
  signature?: string;
  timestamp: string;
}
