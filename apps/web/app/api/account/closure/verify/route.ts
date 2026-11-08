import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const { password, pin } = body;

    const userRows = await query(`SELECT password_hash, pin_hash, is_pin_enabled FROM popolive.users WHERE id = $1 LIMIT 1`, [user.id]);
    const u = userRows[0];

    if (u?.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for identity verification.' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(password, u.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect account password.' }, { status: 400 });
      }
    } else if (u?.is_pin_enabled && u?.pin_hash) {
      if (!pin) {
        return NextResponse.json({ error: 'Security PIN is required.' }, { status: 400 });
      }
      const isPinMatch = await bcrypt.compare(pin, u.pin_hash);
      if (!isPinMatch) {
        return NextResponse.json({ error: 'Incorrect Security PIN.' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Identity verified successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/account/closure/verify:', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
