/**
 * POPO LIVE — PAYMENT GATEWAY PROVIDER ADAPTER
 * 
 * Features:
 * - Stripe / Sandbox provider adapter
 * - Cryptographic HMAC-SHA256 webhook signature verification
 * - Client secret generation for mobile & web SDKs
 * - Safe error handling: zero card data, zero secrets logged
 */

import crypto from 'crypto';
import { PaymentOrder, PaymentWebhookEvent } from './paymentTypes';

export interface PaymentProviderConfig {
  providerKey: string;
  displayName: string;
  isSandbox: boolean;
  webhookSecret: string;
  secretKey: string;
}

export class PaymentProvider {
  private webhookSecret: string;
  private apiKey: string;
  private isSandbox: boolean;

  constructor() {
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_popo_payment_dev_test_secret';
    this.apiKey = process.env.PAYMENT_SECRET_KEY || process.env.STRIPE_SECRET_KEY || 'sk_test_popo_mock_key';
    this.isSandbox = process.env.USE_REAL_PAYMENTS !== 'true' || process.env.NODE_ENV !== 'production';
  }

  public getWebhookSecret(): string {
    return this.webhookSecret;
  }

  public isTestMode(): boolean {
    return this.isSandbox || this.apiKey.startsWith('sk_test_');
  }

  /**
   * Generates a checkout session and client secret for mobile/web checkout
   */
  public async createCheckoutSession(order: PaymentOrder): Promise<{
    clientSecret: string;
    checkoutUrl: string;
    providerPaymentRef: string;
  }> {
    // Generates tokenized client secret (pi_..._secret_... pattern)
    const refSuffix = crypto.randomBytes(8).toString('hex');
    const paymentRef = `pi_${order.orderId}_${refSuffix}`;
    const clientSecret = `${paymentRef}_secret_${crypto.randomBytes(12).toString('hex')}`;
    const checkoutUrl = `https://checkout.popolive.com/pay/${order.orderId}?cs=${clientSecret}`;

    return {
      clientSecret,
      checkoutUrl,
      providerPaymentRef: paymentRef,
    };
  }

  /**
   * Computes HMAC-SHA256 signature for webhook payload
   */
  public computeWebhookSignature(params: {
    eventId: string;
    orderId: string;
    eventType: string;
    amount: number;
    currency: string;
    timestamp?: string;
  }): string {
    const ts = params.timestamp || Math.floor(Date.now() / 1000).toString();
    const canonical = `t=${ts},v1=${params.eventId}:${params.orderId}:${params.eventType}:${params.amount.toFixed(2)}:${params.currency.toUpperCase()}`;
    const sig = crypto.createHmac('sha256', this.webhookSecret).update(canonical).digest('hex');
    return `t=${ts},v1=${sig}`;
  }

  /**
   * Verifies incoming webhook signature against payload
   */
  public verifyWebhookSignature(
    params: {
      eventId: string;
      orderId: string;
      eventType: string;
      amount: number;
      currency: string;
    },
    headerSignature: string | null | undefined
  ): boolean {
    if (!headerSignature || typeof headerSignature !== 'string') {
      return false;
    }

    try {
      // Parse header e.g. "t=123456789,v1=abc..."
      const parts = headerSignature.split(',');
      let timestamp = '';
      let providedSig = '';

      for (const p of parts) {
        const [k, v] = p.split('=');
        if (k === 't') timestamp = v;
        if (k === 'v1') providedSig = v;
      }

      if (!providedSig) {
        // Fallback to raw signature if header format is direct hex
        providedSig = headerSignature.trim();
      }

      const canonical = timestamp
        ? `t=${timestamp},v1=${params.eventId}:${params.orderId}:${params.eventType}:${params.amount.toFixed(2)}:${params.currency.toUpperCase()}`
        : `${params.eventId}:${params.orderId}:${params.eventType}:${params.amount.toFixed(2)}:${params.currency.toUpperCase()}`;

      const expected = crypto.createHmac('sha256', this.webhookSecret).update(canonical).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

export const paymentProvider = new PaymentProvider();
