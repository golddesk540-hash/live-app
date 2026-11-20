import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { equipBagItem, unequipBagItem } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bag/items/:inventoryId/equip
 * Equips an item, enforcing one-slot-per-category on the server.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to equip items.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { inventoryId } = params;
    const result = await equipBagItem(user, inventoryId);

    return NextResponse.json({
      success: true,
      equipSlot: result.equipSlot,
      inventoryId: result.inventoryId,
      itemId: result.itemId,
      equippedAt: result.equippedAt,
    });
  } catch (err: any) {
    console.error('POST /api/bag/items/[inventoryId]/equip error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to equip item.', code: err.code || 'EQUIP_FAILED' },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE /api/bag/items/:inventoryId/equip
 * Unequips an equipped item.
 */
export async function DELETE(
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
    console.error('DELETE /api/bag/items/[inventoryId]/equip error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to unequip item.', code: err.code || 'UNEQUIP_FAILED' },
      { status: err.status || 500 }
    );
  }
}
