import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility, claimHostTaskReward } from '@/lib/hostTasks';

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

    const result = await claimHostTaskReward({
      userId: user.id,
      taskId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error claiming task reward:', error);
    let status = 500;
    if (error.message === 'TASK_NOT_COMPLETED' || error.message === 'REWARD_ALREADY_CLAIMED') {
      status = 400;
    } else if (error.message === 'TASK_NOT_FOUND') {
      status = 404;
    }
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_CLAIM_REWARD' }, { status });
  }
}
