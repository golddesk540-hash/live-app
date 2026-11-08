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

    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    // Fetch user password_hash
    const userRows = await query(`SELECT password_hash FROM popolive.users WHERE id = $1 LIMIT 1`, [user.id]);
    if (userRows.length === 0 || !userRows[0].password_hash) {
      return NextResponse.json({ error: 'No password set on account. Please use password setup.' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRows[0].password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password. Please try again.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      `UPDATE popolive.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, user.id]
    );

    await query(
      `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
       VALUES ($1, 'password_change', 'Account password was successfully changed', $2)`,
      [user.id, req.headers.get('user-agent') || 'Browser']
    );

    return NextResponse.json({
      success: true,
      message: 'Account password changed successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/account/password/change:', err);
    return NextResponse.json({ error: 'Failed to update account password.' }, { status: 500 });
  }
}
