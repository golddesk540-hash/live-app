import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { unfollowUser } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const viewer = await getAuthenticatedUser(req);
    if (!viewer) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const result = await unfollowUser(viewer.id, params.userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in POST /api/users/[userId]/unfollow:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to unfollow user.' },
      { status: err.status || 500 }
    );
  }
}
