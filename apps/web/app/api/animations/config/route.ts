import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationValidationError,
  getAnimationSystemCatalog,
  getHostEntranceEligibility,
  getRoomAnimationStateSync,
} from '@/lib/animations';
import { resolveRoomStage } from '@/lib/giftSending';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const pkBattleId = searchParams.get('pkBattleId');
    const requestedHostId = searchParams.get('hostUserId');
    const requestedUserId = searchParams.get('userId');
    const isPreviewDemo = searchParams.get('preview') === 'demo';

    const actor = await resolveWalletActor(req);
    const userId =
      actor.user?.id ||
      requestedUserId ||
      (isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : 'anonymous');

    const [catalog, stage] = await Promise.all([
      getAnimationSystemCatalog(false),
      resolveRoomStage({
        roomId: roomId || (!pkBattleId ? '880219' : null),
        pkBattleId,
        requireActiveForSend: false,
      }).catch(() => null),
    ]);

    const roomScope = stage?.roomScope || (pkBattleId ? `pk:${pkBattleId}` : `room:${roomId || '880219'}`);
    const defaultHostId =
      requestedHostId || stage?.hosts?.[0]?.hostId || '00000000-0000-0000-0000-000000088201';

    const [stateSync, hostEligibility] = await Promise.all([
      getRoomAnimationStateSync({
        roomScope,
        userId,
        pkBattleId: stage?.pkBattleId || pkBattleId,
      }),
      getHostEntranceEligibility(defaultHostId).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      roomScope,
      stage,
      catalog,
      stateSync,
      hostEligibility,
    });
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.errorCode },
        { status: err.statusCode }
      );
    }
    console.error('GET /api/animations/config error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load animation configuration.' },
      { status: err?.statusCode || 500 }
    );
  }
}
