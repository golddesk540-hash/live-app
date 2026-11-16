import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, deleteSquareComment } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    await deleteSquareComment(commentId, user.id);
    return NextResponse.json({ success: true, message: 'Comment successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    const status = error.message === 'FORBIDDEN_NOT_COMMENT_AUTHOR' ? 403 : error.message === 'COMMENT_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_DELETE_COMMENT' }, { status });
  }
}
