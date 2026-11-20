import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateAvatar } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const avatarUrl = body.avatarUrl || body.avatar_url;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Avatar URL is required.' }, { status: 400 });
    }

    const res = await updateAvatar(user.id, avatarUrl);
    return NextResponse.json({
      success: true,
      avatarUrl: res.avatar_url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'AVATAR_UPDATE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
