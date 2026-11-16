import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, getSquarePostById, deleteSquarePost } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);

    const post = await getSquarePostById(postId, user?.id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found or unavailable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_POST' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    await deleteSquarePost(postId, user.id);
    return NextResponse.json({ success: true, message: 'Post successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    const status = error.message === 'FORBIDDEN_NOT_POST_AUTHOR' ? 403 : error.message === 'POST_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_DELETE_POST' }, { status });
  }
}
