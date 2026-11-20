/**
 * POPO LIVE — PAYMENT & CHECKOUT TYPES
 * Supports Coin Packages, VIP Membership Plans, Webhooks, Idempotency & Refunds
 */

export type PaymentTargetType = 'coins' | 'vip';

export type PaymentOrderStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'refund_pending';

export interface CoinPackage {
  packageId: string;
  packageName: string;
  packageNameUr?: string | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceAmount: number;
  currency: string;
  iconUrl: string;
  badgeText?: string | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  platformProductIdIos?: string | null;
  platformProductIdAndroid?: string | null;
}

export interface VipPlan {
  planId: string;
  planName: string;
  planTier: string;
  vipLevel: number;
  durationDays: number;
  priceAmount: number; // Real fiat price
  coinPrice?: number;   // In-app coin price
  currency: string;
  badgeLabel?: string | null;
  isActive: boolean;
}

export interface PaymentOrder {
  orderId: string;
  userId: string;
  targetType: PaymentTargetType;
  packageId?: string | null;
  planId?: string | null;
  packageName: string;
  providerKey: string;
  platform: 'web' | 'android' | 'ios';
  baseCoins?: number;
  bonusCoins?: number;
  totalCoins?: number;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  idempotencyKey?: string | null;
  providerPaymentRef?: string | null;
  clientSecret?: string | null;
  checkoutUrl?: string | null;
  coinTransactionId?: string | null;
  receiptId?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  refundReason?: string | null;
  refundStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'processed';
  metadata: Record<string, any>;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderParams {
  userId: string;
  targetType: PaymentTargetType;
  packageId?: string;
  planId?: string;
  providerKey?: string;
  platform?: 'web' | 'android' | 'ios';
  currency?: string;
  idempotencyKey?: string;
}

export interface ConfirmOrderParams {
  orderId: string;
  userId: string;
  providerPaymentRef?: string;
}

export interface RefundRequestParams {
  orderId: string;
  userId: string;
  reason: string;
}

export interface PaymentWebhookEvent {
  eventId: string;
  providerKey: string;
  eventType:
    | 'payment_intent.succeeded'
    | 'payment_intent.payment_failed'
    | 'checkout.session.completed'
    | 'charge.refunded';
  orderId: string;
  amount: number;
  currency: string;
  providerPaymentRef?: string;
  failureCode?: string;
  failureReason?: string;
  signature?: string;
  rawPayload?: Record<string, any>;
  timestamp: string;
}

export interface PaymentReceipt {
  receiptId: string;
  orderId: string;
  userId: string;
  targetType: PaymentTargetType;
  packageOrPlanName: string;
  amount: number;
  currency: string;
  totalCoins?: number;
  coinTransactionId?: string;
  status: 'issued' | 'refunded' | 'voided';
  issuedAt: string;
}
