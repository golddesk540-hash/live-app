import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility, updateHostTaskProgress } from '@/lib/hostTasks';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const user = await resolveHostActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const check = await verifyHostEligibility(user.id);
    if (!check.eligible) {
      return NextResponse.json(
        { success: false, error: 'Host permissions or Wealth Level 5 required.', reason: check.reason },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { increment, absoluteProgress } = body;

    const task = await updateHostTaskProgress({
      userId: user.id,
      taskId,
      increment,
      absoluteProgress,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('Error updating task progress:', error);
    const status = error.message === 'TASK_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_UPDATE_PROGRESS' }, { status });
  }
}
