import { NextRequest, NextResponse } from 'next/server';
import { purchaseStoreItem } from '@/lib/store';
import {
  rejectIfStoreTampered,
  resolveStoreUserScope,
  storeErrorJson,
} from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_JSON', error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const tampered = rejectIfStoreTampered(body);
    if (tampered) return tampered;

    const scope = await resolveStoreUserScope(req, body.userId);
    if (!scope.ok) return scope.response;
    if (!scope.targetUserId) {
      return NextResponse.json({ success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required.' }, { status: 401 });
    }

    const idempotencyKey =
      req.headers.get('x-idempotency-key') ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);

    const result = await purchaseStoreItem({
      userId: scope.targetUserId,
      itemId: String(body.itemId || ''),
      quantity: body.quantity,
      idempotencyKey,
      actorId: scope.actor.actorId,
      autoEquip: Boolean(body.autoEquip),
    });

    return NextResponse.json(
      {
        success: result.success,
        deduplicated: Boolean(result.deduplicated),
        errorCode: result.code,
        code: result.code,
        error: result.error,
        purchase: result.purchase,
        inventory: result.inventory,
        wallet: result.wallet,
      },
      { status: result.statusCode }
    );
  } catch (err: any) {
    return storeErrorJson(err, 'Store purchase failed.');
  }
}
