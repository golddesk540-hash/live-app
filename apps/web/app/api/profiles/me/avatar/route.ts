import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateAvatar } from '@/lib/finalApiService';
import { storageService } from '@/lib/storageService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const avatarUrl = body.avatarUrl || body.avatar_url;
    const imageBase64 = body.imageBase64 || body.image;

    if (imageBase64 && typeof imageBase64 === 'string') {
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''), 'base64');
      const res = await storageService.updateAvatarWithStorage(user.id, buffer);
      return NextResponse.json({
        success: true,
        avatarUrl: res.avatarUrl,
        oldAvatarDeleted: res.oldAvatarDeleted,
      });
    }

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Avatar image or URL is required.' }, { status: 400 });
    }

    const res = await updateAvatar(user.id, avatarUrl);
    return NextResponse.json({
      success: true,
      avatarUrl: res.avatar_url,
      oldAvatarDeleted: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'AVATAR_UPDATE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
