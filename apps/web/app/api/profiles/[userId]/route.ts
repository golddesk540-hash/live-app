import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getPublicProfile } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, code: 'INVALID_IDENTIFIER', error: 'User identifier is required.' },
        { status: 400 }
      );
    }

    const viewer = await getAuthenticatedUser(req);
    const profile = await getPublicProfile(userId, viewer);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'PUBLIC_PROFILE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
