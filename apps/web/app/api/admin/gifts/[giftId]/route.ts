import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { updateGiftItem } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { giftId: string } }
) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const gift = await updateGiftItem({
      giftId: params.giftId,
      updates: {
        name: body.name,
        nameUr: body.nameUr,
        description: body.description,
        descriptionUr: body.descriptionUr,
        coinPrice: body.coinPrice,
        categoryId: body.categoryId,
        thumbnailUrl: body.thumbnailUrl,
        imageUrl: body.imageUrl,
        animationUrl: body.animationUrl,
        assetType: body.assetType,
        giftType: body.giftType,
        isPopular: body.isPopular,
        isNew: body.isNew,
        isFeatured: body.isFeatured,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
      },
      reason: body.reason,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({
      success: true,
      gift,
    });
  } catch (err: any) {
    console.error('PATCH /api/admin/gifts/[giftId] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to update gift.',
        code: err?.code || 'UPDATE_GIFT_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
