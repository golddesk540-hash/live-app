import { NextRequest, NextResponse } from 'next/server';
import { equipStoreInventoryItem } from '@/lib/store';
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
      return NextResponse.json({ success: false, error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Allow inventoryId on /equip specifically, reject coin/vip/level/expiry overrides
    const { inventoryId, slot, expectedSlot, userId, ...rest } = body;
    const tampered = rejectIfStoreTampered(rest);
    if (tampered) return tampered;

    const scope = await resolveStoreUserScope(req, userId);
    if (!scope.ok) return scope.response;
    if (!scope.targetUserId) {
      return NextResponse.json({ success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required.' }, { status: 401 });
    }

    const result = await equipStoreInventoryItem({
      userId: scope.targetUserId,
      inventoryId: String(inventoryId || ''),
      expectedSlot: expectedSlot || slot || null,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to equip store item.');
  }
}
