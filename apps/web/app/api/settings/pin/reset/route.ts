import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyPassword } from '@/lib/auth';
import { validatePinFormat, hashPin } from '@/lib/pinSecurity';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { accountPassword, newPin, confirmPin, removePin } = body;

    if (!accountPassword) {
      return NextResponse.json(
        { error: 'Account password is required to verify identity.' },
        { status: 400 }
      );
    }

    // Verify account password from DB
    const rows = await query('SELECT password_hash FROM popolive.users WHERE id = $1', [user.id]);
    const passHash = rows[0]?.password_hash;

    if (!passHash) {
      return NextResponse.json(
        { error: 'No password set on this account. Please reset password first.' },
        { status: 400 }
      );
    }

    const passMatch = await verifyPassword(accountPassword, passHash);
    if (!passMatch) {
      return NextResponse.json({ error: 'Incorrect account password.' }, { status: 400 });
    }

    // Case A: Remove PIN completely
    if (removePin === true) {
      await query(
        `UPDATE popolive.users 
         SET pin_hash = NULL, is_pin_enabled = false, pin_failed_attempts = 0, pin_locked_until = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [user.id]
      );
      return NextResponse.json({
        success: true,
        message: 'Security PIN has been removed and disabled.',
      });
    }

    // Case B: Set new PIN via recovery
    const check = validatePinFormat(newPin);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    if (newPin !== confirmPin) {
      return NextResponse.json({ error: 'Confirmation PIN does not match.' }, { status: 400 });
    }

    const hashed = await hashPin(newPin);

    await query(
      `UPDATE popolive.users 
       SET pin_hash = $1, is_pin_enabled = true, pin_failed_attempts = 0, pin_locked_until = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashed, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Security PIN reset successfully via account recovery.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/settings/pin/reset:', err);
    return NextResponse.json({ error: 'Failed to reset Security PIN.' }, { status: 500 });
  }
}
