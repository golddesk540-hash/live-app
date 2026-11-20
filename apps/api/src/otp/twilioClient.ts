/**
 * POPO LIVE — TWILIO SMS & VERIFY HTTP CLIENT
 * 
 * Enterprise HTTP client for international SMS delivery via Twilio API.
 * Features:
 * - 10-second request timeout via AbortController
 * - Exponential backoff retry on transient HTTP 5xx or network timeouts (1 retry)
 * - Safe error logging with phone number masking (never logs OTP or credentials)
 */

export interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  verifyServiceSid?: string;
}

export interface SmsDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  statusCode?: number;
}

export class TwilioSmsClient {
  private config: TwilioConfig;
  private readonly timeoutMs: number = 10000;

  constructor(config?: TwilioConfig) {
    this.config = config || {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    };
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.phoneNumber &&
      this.config.accountSid.startsWith('AC')
    );
  }

  public async sendOtp(phone: string, otp: string): Promise<SmsDeliveryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Twilio credentials not configured or invalid Account SID format.',
      };
    }

    const maskedPhone = this.maskPhone(phone);
    const messageBody = `[Popo Live] Your verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

    // Attempt delivery with 1 retry on transient failure
    return await this.executeWithRetry(async () => {
      return await this.dispatchTwilioRequest(phone, messageBody, maskedPhone);
    });
  }

  private async dispatchTwilioRequest(phone: string, body: string, maskedPhone: string): Promise<SmsDeliveryResult> {
    const { accountSid, authToken, phoneNumber } = this.config;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams({
      To: phone,
      From: phoneNumber!,
      Body: body,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
          provider: 'twilio',
          statusCode: response.status,
        };
      }

      const errorMessage = data.message || `Twilio HTTP error ${response.status}`;
      console.error(`[Twilio Error] Delivery failed for ${maskedPhone}: status=${response.status}, code=${data.code || 'unknown'}`);

      return {
        success: false,
        provider: 'twilio',
        error: errorMessage,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      const errReason = isTimeout ? 'Request timed out after 10s' : 'Network connectivity error';
      console.error(`[Twilio Error] Exception for ${maskedPhone}: ${errReason}`);

      return {
        success: false,
        provider: 'twilio',
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
      // 1000ms transient retry delay
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
