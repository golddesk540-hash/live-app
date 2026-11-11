import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationValidationError,
  EntranceType,
  triggerHostEntrance,
} from '@/lib/animations';
import { isAuthorizedGiftAdmin } from '@/lib/giftCatalog';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

const VALID_ENTRANCE_TYPES = new Set<EntranceType>(['standard', 'premium', 'vip', 'special_event']);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const isPreviewDemo = searchParams.get('preview') === 'demo' || body.preview === 'demo';
    const actor = await resolveWalletActor(req);
    const requestedHostId = (body.hostUserId || '').trim();

    if (actor.user) {
      if (
        requestedHostId &&
        requestedHostId !== actor.user.id &&
        requestedHostId !== actor.user.poppo_id &&
        !isAuthorizedGiftAdmin(actor.actorRole) &&
        !isPreviewDemo
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Cannot forge host entrance for another host account.',
            code: 'UNAUTHORIZED_HOST_SPOOF',
          },
          { status: 403 }
        );
      }
    } else if (!isPreviewDemo && actor.actorId === 'anonymous') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication or preview demo mode is required to trigger host entrances.',
          code: 'AUTHENTICATION_REQUIRED',
        },
        { status: 401 }
      );
    }

    const hostUserId =
      requestedHostId || actor.user?.id || DEFAULT_DEMO_WALLET_USER_ID;

    const rawType = String(body.entranceType || 'standard') as EntranceType;
    if (!VALID_ENTRANCE_TYPES.has(rawType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entranceType requested.', code: 'INVALID_ENTRANCE_TYPE' },
        { status: 400 }
      );
    }

    const result = await triggerHostEntrance({
      hostUserId,
      entranceType: rawType,
      roomId: body.roomId || null,
      pkBattleId: body.pkBattleId || null,
      idempotencyKey: req.headers.get('x-idempotency-key') || body.idempotencyKey || null,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.errorCode },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/animations/entrance/trigger error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to trigger host entrance.' },
      { status: err?.statusCode || 500 }
    );
  }
}
