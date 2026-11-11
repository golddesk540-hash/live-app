import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { createOrUpdateCategory } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const category = await createOrUpdateCategory({
      mode: 'update',
      categoryId: params.categoryId,
      name: body.name,
      nameUr: body.nameUr,
      shortName: body.shortName,
      shortNameUr: body.shortNameUr,
      description: body.description,
      icon: body.icon,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (err: any) {
    console.error('PATCH /api/admin/gifts/categories/[categoryId] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to update category.',
        code: err?.code || 'UPDATE_CATEGORY_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
