import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility, getHostDailyTasks } from '@/lib/hostTasks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveHostActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const check = await verifyHostEligibility(user.id);
    if (!check.eligible) {
      return NextResponse.json(
        { success: false, error: 'Host permissions or Wealth Level 5 required to access daily host tasks.', reason: check.reason },
        { status: 403 }
      );
    }

    const data = await getHostDailyTasks(user.id);
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('Error fetching host daily tasks:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_TASKS' }, { status: 500 });
  }
}
