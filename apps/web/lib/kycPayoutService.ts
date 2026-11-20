/**
 * POPO LIVE — WEB RUNTIME KYC & PAYOUT SERVICE
 * 
 * Bridges Next.js API routes with Phase 8 KYC & Payout Services
 * Adheres to PHASE8_FLAGS.useRealKyc and PHASE8_FLAGS.useRealPayout feature flags.
 */

import { PHASE8_FLAGS } from './phase8Flags';
import {
  kycProvider,
  payoutProvider,
  kycPayoutService,
  KycRecord,
  KycSession,
  KycWebhookEvent,
  PayoutWebhookEvent,
  WithdrawalRequest,
} from '../../../apps/api/src/kycPayout';

export function isRealKycEnabled(): boolean {
  return PHASE8_FLAGS.useRealKyc;
}

export function isRealPayoutEnabled(): boolean {
  return PHASE8_FLAGS.useRealPayout;
}

export class WebKycPayoutService {
  public async startKyc(userId: string) {
    return kycPayoutService.startKyc(userId);
  }

  public async getKycStatus(userId: string): Promise<KycRecord> {
    return kycPayoutService.getKycStatus(userId);
  }

  public async handleKycWebhook(event: KycWebhookEvent) {
    return kycPayoutService.handleKycWebhook(event);
  }

  public async requestWithdrawal(params: {
    userId: string;
    amount: number;
    payoutMethodId?: string;
    idempotencyKey?: string;
    skipCoolingPeriodCheck?: boolean;
  }) {
    return kycPayoutService.requestWithdrawal(params);
  }

  public async approveWithdrawal(withdrawalRef: string, adminUserId: string) {
    return kycPayoutService.approveWithdrawal(withdrawalRef, adminUserId);
  }

  public async rejectWithdrawal(withdrawalRef: string, adminUserId: string, reason: string) {
    return kycPayoutService.rejectWithdrawal(withdrawalRef, adminUserId, reason);
  }

  public async handlePayoutWebhook(event: PayoutWebhookEvent) {
    return kycPayoutService.handlePayoutWebhook(event);
  }

  public async getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
    return kycPayoutService.getWithdrawalHistory(userId);
  }
}

export const webKycPayoutService = new WebKycPayoutService();
export { kycProvider, payoutProvider, kycPayoutService };
