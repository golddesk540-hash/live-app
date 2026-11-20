/**
 * POPO LIVE — REAL OTP ORCHESTRATOR & PROVIDER ROUTER
 * 
 * Central OTP delivery engine orchestrating Twilio, Local SMS Gateway, and Email providers.
 * Strictly adheres to P7-P3 ledger and verification rules:
 * - 6-digit cryptographically generated code
 * - 5-minute expiry
 * - 60-second resend cooldown
 * - Max 5 attempts
 * - Rate limiting per phone / email / IP
 * - Secure HMAC-SHA256 hashed storage
 * - Zero dev-bypass in production
 * - Zero plaintext OTP logging in production
 */

import crypto from 'crypto';
import { TwilioSmsClient, SmsDeliveryResult } from './twilioClient';
import { LocalSmsClient, LocalSmsDeliveryResult } from './localSmsClient';
import { EmailOtpClient, EmailDeliveryResult } from './emailClient';

export interface OtpDeliveryResponse {
  success: boolean;
  message: string;
  cooldown: number;
  provider: string;
  devOtp?: string;
  messageId?: string;
}

export class OtpProviderService {
  private twilioClient: TwilioSmsClient;
  private localSmsClient: LocalSmsClient;
  private emailClient: EmailOtpClient;

  constructor() {
    this.twilioClient = new TwilioSmsClient();
    this.localSmsClient = new LocalSmsClient();
    this.emailClient = new EmailOtpClient();
  }

  /**
   * Evaluates whether real OTP dispatch is active.
   * Active if USE_REAL_OTP === 'true' OR NODE_ENV === 'production'.
   */
  public isRealOtpRequired(): boolean {
    return process.env.USE_REAL_OTP === 'true' || process.env.NODE_ENV === 'production';
  }

  /**
   * Evaluates whether master dev bypass ('123456') is strictly forbidden.
   */
  public isDevBypassForbidden(): boolean {
    return this.isRealOtpRequired();
  }

  /**
   * Generates a 6-digit cryptographically secure OTP string.
   */
  public generateOtp(): string {
    return String(crypto.randomInt(100000, 1000000));
  }

  /**
   * Hashes OTP using HMAC-SHA256 with platform auth secret.
   */
  public hashOtp(otp: string, secret?: string): string {
    const authSecret = secret || process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
    return crypto.createHmac('sha256', authSecret).update(otp).digest('hex');
  }

  /**
   * Dispatches OTP via real SMS provider with intelligent routing.
   * Routing:
   * - Pakistani numbers (+92...) -> Local SMS Gateway first, Twilio fallback.
   * - International numbers -> Twilio SMS.
   * - In development (when USE_REAL_OTP !== 'true' and NODE_ENV !== 'production'):
   *   Falls back safely to local console simulation.
   */
  public async dispatchSmsOtp(phone: string, otp: string): Promise<OtpDeliveryResponse> {
    const isRealRequired = this.isRealOtpRequired();
    const isPakistani = this.localSmsClient.isPakistaniNumber(phone);

    // 1. If in development mode and real OTP is NOT forced, run safe local simulation
    if (!isRealRequired) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[POPO LIVE DEV SIMULATION] Phone: ${phone.slice(0, 4)}•••• | OTP: ${otp}`);
      }
      return {
        success: true,
        message: 'Verification code sent successfully',
        cooldown: 60,
        provider: 'dev_simulation',
        devOtp: otp,
      };
    }

    // 2. Production / Staging Real Delivery Flow
    let deliveryResult: SmsDeliveryResult | LocalSmsDeliveryResult | null = null;

    if (isPakistani && this.localSmsClient.isConfigured()) {
      deliveryResult = await this.localSmsClient.sendOtp(phone, otp);
      // Fallback to Twilio if local gateway fails
      if (!deliveryResult.success && this.twilioClient.isConfigured()) {
        console.warn('[OTP Fallback] Local SMS failed, routing to Twilio');
        deliveryResult = await this.twilioClient.sendOtp(phone, otp);
      }
    } else if (this.twilioClient.isConfigured()) {
      deliveryResult = await this.twilioClient.sendOtp(phone, otp);
    } else if (this.localSmsClient.isConfigured() && isPakistani) {
      deliveryResult = await this.localSmsClient.sendOtp(phone, otp);
    } else {
      // Real OTP is required but no providers configured
      console.error('[OTP Error] Real OTP is required, but neither Twilio nor Local SMS credentials are configured.');
      const err: any = new Error('Verification code could not be sent. Please try again in a few moments.');
      err.status = 502;
      err.code = 'PROVIDER_UNAVAILABLE';
      throw err;
    }

    if (!deliveryResult.success) {
      console.error(`[OTP Error] Failed to deliver SMS: ${deliveryResult.error || 'Unknown error'}`);
      const err: any = new Error('Verification code could not be sent. Please try again in a few moments.');
      err.status = 502;
      err.code = 'SMS_DELIVERY_FAILED';
      throw err;
    }

    // Success in real delivery mode: NEVER expose devOtp
    return {
      success: true,
      message: 'Verification code sent successfully',
      cooldown: 60,
      provider: deliveryResult.provider,
      messageId: deliveryResult.messageId,
    };
  }

  /**
   * Dispatches OTP via real transactional email provider.
   */
  public async dispatchEmailOtp(email: string, otp: string, purpose: 'login' | 'reset_password' = 'login'): Promise<OtpDeliveryResponse> {
    const isRealRequired = this.isRealOtpRequired();

    if (!isRealRequired) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[POPO LIVE DEV EMAIL SIMULATION] Email: ${email} | OTP: ${otp}`);
      }
      return {
        success: true,
        message: 'Verification email dispatched successfully',
        cooldown: 60,
        provider: 'dev_email_simulation',
        devOtp: otp,
      };
    }

    if (!this.emailClient.isConfigured()) {
      console.error('[OTP Error] Real email delivery required, but no email provider is configured.');
      const err: any = new Error('Verification email could not be sent. Please try again in a few moments.');
      err.status = 502;
      err.code = 'EMAIL_PROVIDER_UNAVAILABLE';
      throw err;
    }

    const deliveryResult = await this.emailClient.sendOtpEmail(email, otp, purpose);
    if (!deliveryResult.success) {
      console.error(`[OTP Error] Failed to deliver email: ${deliveryResult.error || 'Unknown error'}`);
      const err: any = new Error('Verification email could not be sent. Please try again in a few moments.');
      err.status = 502;
      err.code = 'EMAIL_DELIVERY_FAILED';
      throw err;
    }

    return {
      success: true,
      message: 'Verification email dispatched successfully',
      cooldown: 60,
      provider: deliveryResult.provider,
      messageId: deliveryResult.messageId,
    };
  }
}

export const otpProvider = new OtpProviderService();
