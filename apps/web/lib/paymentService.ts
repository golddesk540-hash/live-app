/**
 * POPO LIVE — WEB RUNTIME PAYMENT SERVICE
 * 
 * Bridges Next.js API routes with Phase 8 Payment Service
 * Adheres to PHASE8_FLAGS.useRealPayments feature flag.
 */

import { PHASE8_FLAGS } from './phase8Flags';
import {
  paymentProvider,
  paymentService,
  PaymentOrder,
  CoinPackage,
  VipPlan,
  CreateOrderParams,
  ConfirmOrderParams,
  PaymentWebhookEvent,
  RefundRequestParams,
} from '../../../apps/api/src/payments';

export function isRealPaymentsEnabled(): boolean {
  return PHASE8_FLAGS.useRealPayments;
}

export class WebPaymentService {
  public async getPackages(): Promise<CoinPackage[]> {
    return paymentService.getCoinPackages();
  }

  public async getVipPlans(): Promise<VipPlan[]> {
    return paymentService.getVipPlans();
  }

  public async createOrder(
    params: CreateOrderParams & {
      claimedAmount?: number;
      claimedCoins?: number;
    }
  ) {
    return paymentService.createPaymentOrder(params);
  }

  public async getOrder(orderId: string, userId?: string) {
    return paymentService.getOrder(orderId, userId);
  }

  public async confirmOrder(params: ConfirmOrderParams) {
    return paymentService.confirmOrder(params);
  }

  public async handleWebhook(event: PaymentWebhookEvent) {
    return paymentService.handleWebhook(event);
  }

  public async requestRefund(params: RefundRequestParams) {
    return paymentService.requestRefund(params);
  }

  public async getPurchaseHistory(userId: string): Promise<PaymentOrder[]> {
    return paymentService.getPurchaseHistory(userId);
  }
}

export const webPaymentService = new WebPaymentService();
export { paymentProvider, paymentService };
