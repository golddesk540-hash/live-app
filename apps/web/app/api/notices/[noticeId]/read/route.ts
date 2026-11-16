import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, markNoticeRead } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { noticeId } = await params;
    await markNoticeRead(noticeId, actor.id);

    return NextResponse.json({
      success: true,
      data: {
        noticeId,
        markedRead: true,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/notices/[noticeId]/read:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
