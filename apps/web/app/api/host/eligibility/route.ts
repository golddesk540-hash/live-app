import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility } from '@/lib/hostTasks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveHostActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const check = await verifyHostEligibility(user.id);
    return NextResponse.json({
      success: true,
      userId: user.id,
      ...check,
    });
  } catch (error: any) {
    console.error('Error checking host eligibility:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_CHECK_ELIGIBILITY' }, { status: 500 });
  }
}
