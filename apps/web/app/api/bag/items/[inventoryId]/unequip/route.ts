import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { unequipBagItem } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bag/items/:inventoryId/unequip
 * Unequips an equipped item.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to unequip items.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { inventoryId } = params;
    const result = await unequipBagItem(user, inventoryId);

    return NextResponse.json({
      success: true,
      inventoryId: result.inventoryId,
      equipSlot: result.equipSlot,
      message: 'Item unequipped cleanly.',
    });
  } catch (err: any) {
    console.error('POST /api/bag/items/[inventoryId]/unequip error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to unequip item.', code: err.code || 'UNEQUIP_FAILED' },
      { status: err.status || 500 }
    );
  }
}
