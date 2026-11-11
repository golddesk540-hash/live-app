import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { createGiftItem, getGiftCatalog } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const catalog = await getGiftCatalog({
      categoryId,
      search,
      page,
      limit,
      includeInactive: true,
    });

    return NextResponse.json({
      success: true,
      gifts: catalog.gifts,
      pagination: catalog.pagination,
    });
  } catch (err: any) {
    console.error('GET /api/admin/gifts error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load admin gift list.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const gift = await createGiftItem({
      giftId: body.giftId,
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
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json(
      {
        success: true,
        gift,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('POST /api/admin/gifts error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to create gift.',
        code: err?.code || 'CREATE_GIFT_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
