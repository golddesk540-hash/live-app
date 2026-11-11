import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationValidationError,
  completeAnimationPlayback,
} from '@/lib/animations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.queueId) {
      return NextResponse.json(
        { success: false, error: 'queueId is required.', code: 'QUEUE_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await completeAnimationPlayback(String(body.queueId));
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.errorCode },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/animations/gift/complete error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to complete animation playback.' },
      { status: 500 }
    );
  }
}
