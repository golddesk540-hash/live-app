import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, newPassword, confirmPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please re-enter.' },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find active token
    const rows = await query(
      `SELECT id, user_id, used, expires_at
       FROM popolive.password_resets
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or does not exist.' },
        { status: 400 }
      );
    }

    const resetRecord = rows[0];

    if (resetRecord.used) {
      return NextResponse.json(
        { error: 'This password reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetRecord.expires_at)) {
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password in users table
    await query('UPDATE popolive.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      newHash,
      resetRecord.user_id,
    ]);

    // Mark token as used
    await query('UPDATE popolive.password_resets SET used = true WHERE id = $1', [resetRecord.id]);

    // Invalidate existing sessions for security
    await query('DELETE FROM popolive.sessions WHERE user_id = $1', [resetRecord.user_id]);

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Error in reset-password:', err);
    return NextResponse.json(
      { error: 'Internal server error resetting password.' },
      { status: 500 }
    );
  }
}
