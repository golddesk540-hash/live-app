import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, likeSquarePost, unlikeSquarePost } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.unlike === true) {
      const result = await unlikeSquarePost(postId, user.id);
      return NextResponse.json({ ...result });
    }

    const result = await likeSquarePost(postId, user.id);
    return NextResponse.json({ ...result });
  } catch (error: any) {
    console.error('Error liking post:', error);
    const status = error.message === 'POST_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_LIKE_POST' }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await unlikeSquarePost(postId, user.id);
    return NextResponse.json({ ...result });
  } catch (error: any) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_UNLIKE_POST' }, { status: 500 });
  }
}
