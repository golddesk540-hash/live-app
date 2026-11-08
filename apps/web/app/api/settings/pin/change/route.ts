import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { validatePinFormat, hashPin, verifyPinAttempt } from '@/lib/pinSecurity';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPin, newPin, confirmPin } = body;

    // 1. Verify current PIN
    if (!currentPin) {
      return NextResponse.json({ error: 'Please enter your current Security PIN.' }, { status: 400 });
    }

    const currentVerify = await verifyPinAttempt(user.id, currentPin);
    if (!currentVerify.success) {
      return NextResponse.json({ error: currentVerify.error }, { status: 400 });
    }

    // 2. Validate new PIN
    const check = validatePinFormat(newPin);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    if (newPin !== confirmPin) {
      return NextResponse.json({ error: 'Confirmation PIN does not match.' }, { status: 400 });
    }

    if (currentPin === newPin) {
      return NextResponse.json({ error: 'New PIN must be different from your current PIN.' }, { status: 400 });
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
      message: 'Security PIN changed successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/settings/pin/change:', err);
    return NextResponse.json({ error: 'Failed to change Security PIN.' }, { status: 500 });
  }
}
