import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, getSquarePostComments, createSquareComment } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);

    const comments = await getSquarePostComments(postId, user?.id);
    return NextResponse.json({ success: true, comments, count: comments.length });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_COMMENTS' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { content, parentCommentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Comment text cannot be empty.' }, { status: 400 });
    }

    const comment = await createSquareComment({
      postId,
      userId: user.id,
      content,
      parentCommentId,
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    const status = error.message === 'POST_NOT_FOUND' ? 404 : error.message === 'COMMENT_EMPTY' ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_ADD_COMMENT' }, { status });
  }
}
