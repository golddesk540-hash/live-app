import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, toggleCommentLike } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await toggleCommentLike(commentId, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_LIKE_COMMENT' }, { status: 500 });
  }
}
