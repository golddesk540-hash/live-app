import { NextRequest, NextResponse } from 'next/server';
import { adminUpsertStoreCategory } from '@/lib/store';
import { requireStoreFinanceAdmin, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStoreFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const category = await adminUpsertStoreCategory({
      adminId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      categoryId: String(body.categoryId || ''),
      slug: body.slug,
      name: String(body.name || ''),
      nameUr: body.nameUr,
      shortLabel: body.shortLabel,
      shortLabelUr: body.shortLabelUr,
      description: body.description,
      descriptionUr: body.descriptionUr,
      iconKey: body.iconKey,
      defaultEquipSlot: body.defaultEquipSlot,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
      isApproved: body.isApproved,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to save store category.');
  }
}
