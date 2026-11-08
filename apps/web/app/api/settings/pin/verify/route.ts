import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { verifyPinAttempt } from '@/lib/pinSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: 'Please enter your Security PIN.' }, { status: 400 });
    }

    const result = await verifyPinAttempt(user.id, pin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, remainingAttempts: result.remainingAttempts },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Security PIN verified successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/settings/pin/verify:', err);
    return NextResponse.json({ error: 'Failed to verify PIN.' }, { status: 500 });
  }
}
