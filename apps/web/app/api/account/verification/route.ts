import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const rows = await query(
      `SELECT email, phone, is_adult_verified, is_profile_completed,
              COALESCE(is_email_verified, true) as is_email_verified,
              COALESCE(is_phone_verified, false) as is_phone_verified
       FROM popolive.users WHERE id = $1 LIMIT 1`,
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const u = rows[0];

    return NextResponse.json({
      success: true,
      email: {
        value: u.email,
        isVerified: Boolean(u.is_email_verified),
        status: Boolean(u.is_email_verified) ? 'verified' : 'not_verified',
      },
      phone: {
        value: u.phone,
        isVerified: Boolean(u.is_phone_verified),
        status: Boolean(u.is_phone_verified) ? 'verified' : (u.phone ? 'pending' : 'not_linked'),
      },
      identity: {
        isAdultVerified: Boolean(u.is_adult_verified),
        status: Boolean(u.is_adult_verified) ? 'verified' : 'pending',
      },
      profile: {
        isCompleted: Boolean(u.is_profile_completed),
        status: Boolean(u.is_profile_completed) ? 'completed' : 'incomplete',
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/verification:', err);
    return NextResponse.json({ error: 'Failed to retrieve verification status.' }, { status: 500 });
  }
}
