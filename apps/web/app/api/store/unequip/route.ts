import { NextRequest, NextResponse } from 'next/server';
import { unequipStoreItem } from '@/lib/store';
import { resolveStoreUserScope, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = await resolveStoreUserScope(req, body?.userId);
    if (!scope.ok) return scope.response;
    if (!scope.targetUserId) {
      return NextResponse.json({ success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required.' }, { status: 401 });
    }

    const result = await unequipStoreItem({
      userId: scope.targetUserId,
      inventoryId: body?.inventoryId ? String(body.inventoryId) : null,
      slot: body?.slot ? String(body.slot) : null,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to unequip store item.');
  }
}
