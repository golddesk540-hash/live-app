import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility, getNewHostPack } from '@/lib/hostTasks';

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
        { success: false, error: 'Host permissions or Wealth Level 5 required.', reason: check.reason },
        { status: 403 }
      );
    }

    const pack = await getNewHostPack(user.id);
    return NextResponse.json({
      success: true,
      pack,
      ...pack,
    });
  } catch (error: any) {
    console.error('Error fetching starter pack:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_PACK' }, { status: 500 });
  }
}
