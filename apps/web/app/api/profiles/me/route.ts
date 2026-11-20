import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getMyProfile, updateMyProfile } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const profile = await getMyProfile(user);
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'GET_PROFILE_ERROR' },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateMyProfile(user.id, body);

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UPDATE_PROFILE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
