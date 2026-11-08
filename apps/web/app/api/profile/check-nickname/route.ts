import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateNicknameFormat, getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNickname = searchParams.get('nickname') || '';
    const trimmed = rawNickname.trim();

    const formatCheck = validateNicknameFormat(trimmed);
    if (!formatCheck.valid) {
      return NextResponse.json({
        available: false,
        reason: formatCheck.error,
        nickname: trimmed,
      });
    }

    // Get current user if logged in, so they can keep their existing nickname
    const currentUser = await getAuthenticatedUser(req);
    const currentUserId = currentUser ? currentUser.id : '00000000-0000-0000-0000-000000000000';

    const existing = await query(
      `SELECT id FROM popolive.users WHERE LOWER(nickname) = LOWER($1) AND id != $2 LIMIT 1`,
      [trimmed, currentUserId]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        available: false,
        reason: 'This nickname is already taken by another Popo Live streamer.',
        nickname: trimmed,
      });
    }

    return NextResponse.json({
      available: true,
      reason: 'Nickname is available!',
      nickname: trimmed,
    });
  } catch (err: any) {
    console.error('Error in check-nickname:', err);
    return NextResponse.json(
      { available: false, reason: 'Failed to verify nickname availability.' },
      { status: 500 }
    );
  }
}
