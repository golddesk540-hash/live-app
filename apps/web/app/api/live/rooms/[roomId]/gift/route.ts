import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { executeAtomicGiftSend } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/gift
 * Send a virtual gift to the broadcaster of a live room.
 * Extends & integrates with P7-P7 Economy Module:
 * - Row-level locking on sender wallet (SELECT FOR UPDATE)
 * - Balance verification (coins >= totalCost)
 * - Atomic coin deduction
 * - Locked 70% host revenue share credited to host diamond points
 * - Immutable records in coin_transactions, points_transactions, and gift_transactions
 * - Room coins_earned and points_received tally update
 * - Duplicate prevention via idempotency key
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to send gifts.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const { giftId, quantity = 1 } = body;
    const idempotencyKey = (
      body.idempotencyKey ||
      req.headers.get('idempotency-key') ||
      `gift_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    ).trim();

    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'Gift ID is required.', code: 'MISSING_GIFT_ID' },
        { status: 400 }
      );
    }

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
    if (
      err.code === 'INSUFFICIENT_COINS' ||
      err.code === 'INSUFFICIENT_BALANCE' ||
      (err.message && err.message.includes('INSUFFICIENT_'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: err.message.replace(/^INSUFFICIENT_(COINS|BALANCE):\s*/, ''),
          code: 'INSUFFICIENT_COINS',
          requiredCoins: err.requiredCoins,
          availableCoins: err.availableCoins,
        },
        { status: 400 }
      );
    }
    if (err.code === 'ROOM_ENDED') {
      return NextResponse.json(
        {
          success: false,
          error: err.message.replace(/^ROOM_ENDED:\s*/, ''),
          code: 'ROOM_ENDED',
        },
        { status: 400 }
      );
    }
    if (err.code === 'GIFT_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: err.message.replace(/^GIFT_NOT_FOUND:\s*/, ''),
          code: 'GIFT_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    if (err.code === 'GIFT_UNAVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          error: err.message.replace(/^GIFT_UNAVAILABLE:\s*/, ''),
          code: 'GIFT_UNAVAILABLE',
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
    if (err.code === 'FINANCE_RULE_MISSING' || err.code === 'FINANCE_RULE_INVALID') {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: err.code,
        },
        { status: 500 }
      );
    }

    console.error(`POST /api/live/rooms/${params.roomId}/gift error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process gift transaction.' },
      { status: err.status || 500 }
    );
  }
}
