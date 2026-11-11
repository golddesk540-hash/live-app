import { NextRequest, NextResponse } from 'next/server';
import { getUserStoreInventory } from '@/lib/store';
import { resolveStoreUserScope, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveStoreUserScope(req);
    if (!scope.ok) return scope.response;
    if (!scope.targetUserId) {
      return NextResponse.json({ success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusParam = (url.searchParams.get('status') || 'all').toLowerCase();
    const status = (['all', 'active', 'expired', 'revoked'].includes(statusParam)
      ? statusParam
      : 'all') as 'all' | 'active' | 'expired' | 'revoked';
    const slot = url.searchParams.get('slot') || 'all';

    const inv = await getUserStoreInventory(scope.targetUserId, { status, slot });
    return NextResponse.json({
      success: true,
      ...inv,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to retrieve store inventory.');
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      errorCode: 'STORE_FORBIDDEN_DIRECT_INVENTORY',
      code: 'STORE_FORBIDDEN_DIRECT_INVENTORY',
      error: 'Inventory items can only be created via verified backend purchases or official VIP/Admin grants.',
    },
    { status: 403 }
  );
}
