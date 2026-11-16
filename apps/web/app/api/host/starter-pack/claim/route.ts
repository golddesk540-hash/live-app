import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, verifyHostEligibility, claimNewHostPack } from '@/lib/hostTasks';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    const result = await claimNewHostPack(user.id);
    return NextResponse.json({
      ...result,
      claimed: true,
      message: 'Starter pack claimed successfully! Rewards added to your wallet.',
    });
  } catch (error: any) {
    console.error('Error claiming starter pack:', error);
    const status = error.message === 'PACK_ALREADY_CLAIMED' ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_CLAIM_PACK' }, { status });
  }
}
