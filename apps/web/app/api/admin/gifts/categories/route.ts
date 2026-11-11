import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { createOrUpdateCategory, getGiftCategories } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const categories = await getGiftCategories({ includeInactive: true });
    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (err: any) {
    console.error('GET /api/admin/gifts/categories error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load admin categories.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const rawName = (body.name || '').trim();
    const generatedId = String(body.categoryId || body.slug || rawName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!generatedId || !rawName) {
      return NextResponse.json(
        { success: false, error: 'name is required to create a category.' },
        { status: 400 }
      );
    }

    const category = await createOrUpdateCategory({
      mode: 'create',
      categoryId: generatedId,
      name: rawName,
      nameUr: body.nameUr,
      shortName: body.shortName,
      shortNameUr: body.shortNameUr,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json(
      {
        success: true,
        category,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('POST /api/admin/gifts/categories error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to create category.',
        code: err?.code || 'CREATE_CATEGORY_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
