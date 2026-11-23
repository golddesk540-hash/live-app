import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { executeAtomicGiftSend } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/economy/gifts/send
 * Authenticated atomic gift sending endpoint.
 * Phase B5 Prompt 3:
 * - 100% server-authoritative calculations
 * - Single atomic PostgreSQL transaction
 * - Row locks protecting sender and host balances
 * - Authoritative 70% host share from finance_rules
 * - Immutable ledger rows in coin_transactions, points_transactions, gift_transactions, gift_realtime_events
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to send gifts.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { roomId, liveRoomId, giftId, quantity = 1 } = body;
    const effectiveRoomId = roomId || liveRoomId;

    if (!effectiveRoomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required to send gifts.', code: 'MISSING_ROOM_ID' },
        { status: 400 }
      );
    }

    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'Gift ID is required.', code: 'MISSING_GIFT_ID' },
        { status: 400 }
      );
    }

    const idempotencyKey = (
      body.idempotencyKey ||
      req.headers.get('x-idempotency-key') ||
      req.headers.get('idempotency-key') ||
      `gift_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    ).trim();

    const result = await executeAtomicGiftSend({
      senderUser: user,
      roomId: effectiveRoomId,
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

    console.error('POST /api/economy/gifts/send error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process gift transaction.' },
      { status: err.status || 500 }
    );
  }
}
