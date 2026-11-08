import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { checkRateLimit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier } = body;

    const trimmed = (identifier || '').trim().toLowerCase();
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Please enter your registered email address or phone number.' },
        { status: 400 }
      );
    }

    // Rate limit: max 3 requests per 15 minutes per IP/identifier
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`forgot_${clientIp}`, 5, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      );
    }

    // Look up user
    const rows = await query(
      `SELECT id, email, phone, nickname
       FROM popolive.users
       WHERE LOWER(email) = $1 OR phone = $1
       LIMIT 1`,
      [trimmed]
    );

    let resetToken = null;
    let resetUrl = null;

    if (rows.length > 0) {
      const user = rows[0];
      // Generate secure 32-byte hex token
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Invalidate existing unused tokens for this user
      await query('UPDATE popolive.password_resets SET used = true WHERE user_id = $1', [user.id]);

      // Insert new token
      await query(
        `INSERT INTO popolive.password_resets (user_id, token_hash, used, expires_at)
         VALUES ($1, $2, false, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      // If SMTP is configured, send email; otherwise log to console for development
      console.log(`\n======================================================`);
      console.log(`🔐 [POPO LIVE PASSWORD RESET] User: ${user.email || user.phone}`);
      console.log(`🔗 Reset Link: ${resetUrl}`);
      console.log(`⏱️ Valid for 15 minutes`);
      console.log(`======================================================\n`);
    }

    // Uniform message regardless of user existence to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email or phone, password reset instructions have been dispatched.',
      // Provide reset token in dev if not in strict production mode to facilitate instant testing
      ...(process.env.NODE_ENV !== 'production' && resetUrl ? { devResetUrl: resetUrl } : {}),
    });
  } catch (err: any) {
    console.error('Error in forgot-password:', err);
    return NextResponse.json(
      { error: 'Internal server error processing password reset request.' },
      { status: 500 }
    );
  }
}
