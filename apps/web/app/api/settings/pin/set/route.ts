import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
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
    const { pin, confirmPin } = body;

    const check = validatePinFormat(pin);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'Confirmation PIN does not match.' }, { status: 400 });
    }

    const hashed = await hashPin(pin);

    await query(
      `UPDATE popolive.users 
       SET pin_hash = $1, is_pin_enabled = true, pin_failed_attempts = 0, pin_locked_until = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashed, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Security PIN set successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/settings/pin/set:', err);
    return NextResponse.json({ error: 'Failed to set Security PIN.' }, { status: 500 });
  }
}
