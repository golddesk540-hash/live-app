import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, getSquareFeed, createSquarePost } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    const { searchParams } = new URL(req.url);

    const tab = (searchParams.get('tab') as 'for_you' | 'following' | 'popular') || 'for_you';
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const feed = await getSquareFeed({
      userId: user?.id,
      tab,
      search,
      tag,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...feed,
    });
  } catch (error: any) {
    console.error('Error fetching square posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_POSTS' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      content,
      mediaType,
      images,
      videoUrl,
      videoThumbnailUrl,
      videoDuration,
      videoTitle,
      liveRoomLabel,
      liveRoomId,
      hashtags,
      visibility,
    } = body;

    if (!content && (!images || images.length === 0) && !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Post must contain text content or media.' },
        { status: 400 }
      );
    }

    const post = await createSquarePost({
      userId: user.id,
      content: content || '',
      mediaType,
      images,
      videoUrl,
      videoThumbnailUrl,
      videoDuration,
      videoTitle,
      liveRoomLabel,
      liveRoomId,
      hashtags,
      visibility,
    });

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error('Error creating square post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_CREATE_POST' },
      { status: error.message === 'POST_CONTENT_EMPTY' ? 400 : 500 }
    );
  }
}
