import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';
import { verifyConsentToken, CURRENT_TERMS_VERSION } from './consentStore';

export interface AuthUser {
  id: string;
  poppo_id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatar_url: string;
  gender: string;
  birthdate: string | null;
  is_adult_verified: boolean;
  status: string;
  created_at: string;
}

export interface SessionData {
  sessionToken: string;
  user: AuthUser;
  expiresAt: string;
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';

// -------------------------------------------------------------
// 1. Password Hashing
// -------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

// -------------------------------------------------------------
// 2. Poppo Numeric ID Generator (e.g. 7-digit ID like 8472910)
// -------------------------------------------------------------
export async function generatePoppoId(): Promise<string> {
  let unique = false;
  let newId = '';
  while (!unique) {
    newId = String(crypto.randomInt(1000000, 9999999));
    const existing = await query('SELECT id FROM popolive.users WHERE poppo_id = $1 LIMIT 1', [newId]);
    if (existing.length === 0) {
      unique = true;
    }
  }
  return newId;
}

// -------------------------------------------------------------
// 3. Rate Limiter (PostgreSQL based)
// -------------------------------------------------------------
export async function checkRateLimit(
  key: string,
  maxPoints: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const now = new Date();
    const rows = await query('SELECT points, reset_at FROM popolive.rate_limits WHERE key = $1', [key]);

    if (rows.length === 0) {
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);
      await query(
        'INSERT INTO popolive.rate_limits (key, points, reset_at) VALUES ($1, 1, $2)',
        [key, resetAt]
      );
      return { allowed: true, remaining: maxPoints - 1, resetAt };
    }

    const record = rows[0];
    const resetAt = new Date(record.reset_at);

    if (now > resetAt) {
      // Reset window expired, start fresh
      const newResetAt = new Date(now.getTime() + windowSeconds * 1000);
      await query(
        'UPDATE popolive.rate_limits SET points = 1, reset_at = $2 WHERE key = $1',
        [key, newResetAt]
      );
      return { allowed: true, remaining: maxPoints - 1, resetAt: newResetAt };
    }

    if (record.points >= maxPoints) {
      return { allowed: false, remaining: 0, resetAt };
    }

    await query(
      'UPDATE popolive.rate_limits SET points = points + 1 WHERE key = $1',
      [key]
    );

    return { allowed: true, remaining: maxPoints - (record.points + 1), resetAt };
  } catch (err) {
    console.error('Rate limit error, allowing by default for resiliency:', err);
    return { allowed: true, remaining: 1, resetAt: new Date() };
  }
}

// -------------------------------------------------------------
// 4. OTP Generation, Delivery & Verification
// -------------------------------------------------------------
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(otp).digest('hex');
}

export async function createAndSendOtp(phone: string): Promise<{ success: boolean; message: string; cooldown: number }> {
  // Check rate limit: max 5 requests per hour per phone
  const hourlyLimit = await checkRateLimit(`otp_hourly_${phone}`, 5, 3600);
  if (!hourlyLimit.allowed) {
    throw new Error('Too many OTP requests for this phone number. Please wait an hour before trying again.');
  }

  // Check 60-second cooldown
  const cooldownCheck = await checkRateLimit(`otp_cooldown_${phone}`, 1, 60);
  if (!cooldownCheck.allowed) {
    throw new Error('Please wait 60 seconds before requesting another code.');
  }

  // Generate cryptographically random 6-digit OTP
  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Invalidate any older pending OTPs for this phone
  await query('DELETE FROM popolive.otp_verifications WHERE phone = $1', [phone]);

  // Insert new record
  await query(
    `INSERT INTO popolive.otp_verifications (phone, otp_hash, attempts, verified, expires_at)
     VALUES ($1, $2, 0, false, $3)`,
    [phone, otpHash, expiresAt]
  );

  // Dispatch OTP: If Twilio credentials are provided, send SMS; otherwise safely log to console
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom && twilioSid.startsWith('AC')) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const params = new URLSearchParams({
        To: phone,
        From: twilioFrom,
        Body: `[Popo Live] Your verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      });
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      console.log(`[SMS-SENT] Live OTP dispatched to ${phone}`);
    } catch (err) {
      console.error('Failed to send SMS via Twilio:', err);
    }
  } else {
    // Development / Local Simulation mode
    console.log(`\n======================================================`);
    console.log(`🔑 [POPO LIVE DEV OTP] Phone: ${phone} | Code: ${otp}`);
    console.log(`======================================================\n`);
  }

  return { success: true, message: 'Verification code sent successfully', cooldown: 60 };
}

export async function verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
  const rows = await query(
    `SELECT id, otp_hash, attempts, verified, expires_at
     FROM popolive.otp_verifications
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  );

  if (rows.length === 0) {
    throw new Error('No OTP request found for this phone number. Please request a new code.');
  }

  const record = rows[0];

  if (record.verified) {
    throw new Error('This verification code has already been used. Please request a new code.');
  }

  if (new Date() > new Date(record.expires_at)) {
    throw new Error('Verification code has expired. Please request a new one.');
  }

  if (record.attempts >= 5) {
    throw new Error('Too many incorrect attempts. Please request a new code.');
  }

  const providedHash = hashOtp(otp);
  if (providedHash !== record.otp_hash) {
    await query('UPDATE popolive.otp_verifications SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    throw new Error('Invalid verification code. Please check and try again.');
  }

  // Mark as verified
  await query('UPDATE popolive.otp_verifications SET verified = true WHERE id = $1', [record.id]);
  return true;
}

// -------------------------------------------------------------
// 5. Session Management
// -------------------------------------------------------------
export async function createSession(
  userId: string,
  req: NextRequest,
  rememberMe: boolean = false
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const durationDays = rememberMe ? 30 : 7;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const ipHash = crypto.createHmac('sha256', AUTH_SECRET).update(clientIp).digest('hex').substring(0, 16);

  await query(
    `INSERT INTO popolive.sessions (user_id, session_token, user_agent, ip_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, sessionToken, userAgent, ipHash, expiresAt]
  );

  return { sessionToken, expiresAt };
}

export async function validateSessionToken(sessionToken: string): Promise<AuthUser | null> {
  if (!sessionToken) return null;

  const rows = await query(
    `SELECT u.id, u.poppo_id, u.email, u.phone, u.nickname, u.avatar_url,
            u.gender, u.birthdate, u.is_adult_verified, u.status, u.created_at,
            s.expires_at
     FROM popolive.sessions s
     JOIN popolive.users u ON s.user_id = u.id
     WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active'
     LIMIT 1`,
    [sessionToken]
  );

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id,
    poppo_id: r.poppo_id,
    email: r.email,
    phone: r.phone,
    nickname: r.nickname,
    avatar_url: r.avatar_url,
    gender: r.gender,
    birthdate: r.birthdate ? r.birthdate.toISOString() : null,
    is_adult_verified: r.is_adult_verified,
    status: r.status,
    created_at: r.created_at ? r.created_at.toISOString() : '',
  };
}

export async function destroySession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  await query('DELETE FROM popolive.sessions WHERE session_token = $1', [sessionToken]);
}

// -------------------------------------------------------------
// 6. Connect Terms Gate & 18+ Verification (Prompt 01 Connection)
// -------------------------------------------------------------
export function verifyTermsGateCompliance(req: NextRequest): { compliant: boolean; error?: string } {
  const cookie = req.cookies.get('poppo_terms_consent')?.value;
  if (!cookie) {
    return {
      compliant: false,
      error: 'You must review and accept the Terms of Service and Privacy Policy before accessing account features.',
    };
  }

  const result = verifyConsentToken(cookie);
  if (!result.valid || !result.payload || result.payload.status !== 'accepted') {
    return {
      compliant: false,
      error: 'Terms of Service acceptance is required to continue.',
    };
  }

  if (result.payload.termsVersion !== CURRENT_TERMS_VERSION) {
    return {
      compliant: false,
      error: 'Our Terms of Service have been updated (v4.2.0). Re-acceptance is required before login.',
    };
  }

  return { compliant: true };
}

// -------------------------------------------------------------
// 7. Cookie Helpers
// -------------------------------------------------------------
export function setAuthSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: Date
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  response.cookies.set('poppo_session', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge,
  });
}

export function clearAuthSessionCookie(response: NextResponse): void {
  response.cookies.set('poppo_session', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });
}
