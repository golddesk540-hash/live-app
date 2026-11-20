/**
 * POPO LIVE — PAKISTAN LOCAL SMS GATEWAY CLIENT
 * 
 * HTTP client for Pakistani telecom SMS routing (Telenor / Jazz / SMS4Connect / BrandSMS).
 * Features:
 * - 10-second request timeout via AbortController
 * - Exponential backoff retry on transient HTTP 5xx or network timeouts (1 retry)
 * - Safe error logging with phone number masking (never logs OTP or credentials)
 */

export interface LocalSmsConfig {
  gatewayUrl?: string;
  apiKey?: string;
  senderId?: string;
}

export interface LocalSmsDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  statusCode?: number;
}

export class LocalSmsClient {
  private config: LocalSmsConfig;
  private readonly timeoutMs: number = 10000;

  constructor(config?: LocalSmsConfig) {
    this.config = config || {
      gatewayUrl: process.env.LOCAL_SMS_GATEWAY_URL,
      apiKey: process.env.LOCAL_SMS_API_KEY,
      senderId: process.env.LOCAL_SMS_SENDER_ID || 'PopoLive',
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.gatewayUrl && this.config.apiKey);
  }

  public isPakistaniNumber(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '');
    return cleaned.startsWith('+92') || cleaned.startsWith('92') || cleaned.startsWith('03');
  }

  public formatPakistaniNumber(phone: string): string {
    let cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('+92')) return cleaned;
    if (cleaned.startsWith('92')) return `+${cleaned}`;
    if (cleaned.startsWith('03')) return `+92${cleaned.substring(1)}`;
    return cleaned;
  }

  public async sendOtp(phone: string, otp: string): Promise<LocalSmsDeliveryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'local_sms',
        error: 'Local SMS Gateway credentials not configured.',
      };
    }

    const formattedPhone = this.formatPakistaniNumber(phone);
    const maskedPhone = this.maskPhone(formattedPhone);
    const messageBody = `[Popo Live] Your verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`;

    return await this.executeWithRetry(async () => {
      return await this.dispatchLocalSms(formattedPhone, messageBody, maskedPhone);
    });
  }

  private async dispatchLocalSms(phone: string, message: string, maskedPhone: string): Promise<LocalSmsDeliveryResult> {
    const { gatewayUrl, apiKey, senderId } = this.config;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(gatewayUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          recipient: phone,
          sender: senderId,
          message: message,
          priority: 'high',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.status === 'success' || data.message_id || data.id)) {
        return {
          success: true,
          messageId: data.message_id || data.id || `local-${Date.now()}`,
          provider: 'local_sms',
          statusCode: response.status,
        };
      }

      const errorMessage = data.message || `Local SMS HTTP error ${response.status}`;
      console.error(`[Local SMS Error] Dispatch failed for ${maskedPhone}: status=${response.status}`);

      return {
        success: false,
        provider: 'local_sms',
        error: errorMessage,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      const errReason = isTimeout ? 'Request timed out after 10s' : 'Network connectivity error';
      console.error(`[Local SMS Error] Exception for ${maskedPhone}: ${errReason}`);

      return {
        success: false,
        provider: 'local_sms',
        error: errReason,
        statusCode: isTimeout ? 504 : 500,
      };
    }
  }

  private async executeWithRetry<T extends { success: boolean; statusCode?: number }>(
    operation: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    let result = await operation();
    if (!result.success && result.statusCode && (result.statusCode >= 500 || result.statusCode === 504)) {
      await new Promise(res => setTimeout(res, 1000));
      result = await operation();
    }
    return result;
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 6) return '••••';
    return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
  }
}
