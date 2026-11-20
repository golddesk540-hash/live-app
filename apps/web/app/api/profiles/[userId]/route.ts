import { NextRequest, NextResponse } from 'next/server';
import { getPublicProfile } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const profile = await getPublicProfile(userId);

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
