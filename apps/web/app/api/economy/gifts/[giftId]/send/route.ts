import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { executeAtomicGiftSend } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/economy/gifts/[giftId]/send
 * Delegates directly to the reconciled atomic gift sending engine.
 * Requires:
 * - giftId in route param
 * - roomId in body or query
 * - optional quantity (default 1)
 * - optional idempotencyKey
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { giftId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to send gifts.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const giftId = params.giftId;
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const roomId = body.roomId || searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'roomId is required to send a gift.', code: 'MISSING_ROOM_ID' },
        { status: 400 }
      );
    }

    const quantity = body.quantity || searchParams.get('quantity') || 1;
    const idempotencyKey = (
      body.idempotencyKey ||
      req.headers.get('idempotency-key') ||
      `gift_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    ).trim();

    const result = await executeAtomicGiftSend({
      senderUser: user,
      roomId,
      giftId,
      quantity,
      idempotencyKey,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (err: any) {
    if (err.message && err.message.startsWith('INSUFFICIENT_BALANCE:')) {
      return NextResponse.json(
        {
          success: false,
          error: err.message.replace('INSUFFICIENT_BALANCE: ', ''),
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      );
    }
    if (err.code === 'AGE_RESTRICTION_18_PLUS' || (err.message && err.message.includes('AGE_RESTRICTION_18_PLUS'))) {
      return NextResponse.json(
        {
          success: false,
          error: err.message || 'User must be 18 or older to send gifts.',
          code: 'AGE_RESTRICTION_18_PLUS',
        },
        { status: 403 }
      );
    }
    if (err.code === 'SELF_GIFT_DISALLOWED') {
      return NextResponse.json(
        {
          success: false,
          error: err.message || 'Broadcasters cannot send gifts to their own broadcast room.',
          code: 'SELF_GIFT_DISALLOWED',
        },
        { status: 400 }
      );
    }
    if (err.code === 'ROOM_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: err.message || 'Live room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error(`POST /api/economy/gifts/${params.giftId}/send error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process gift transfer.' },
      { status: err.status || 500 }
    );
  }
}
