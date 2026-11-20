import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getBlockedUsers, blockUser } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const blocked = await getBlockedUsers(user.id);
    return NextResponse.json({
      success: true,
      blocked,
      count: blocked.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'GET_BLOCKED_ERROR' },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const targetUserId = body.userId || body.targetUserId;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'Target userId is required.' }, { status: 400 });
    }

    const res = await blockUser(user.id, targetUserId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'BLOCK_USER_ERROR' },
      { status: err.status || 500 }
    );
  }
}
