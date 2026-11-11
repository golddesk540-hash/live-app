import { NextRequest, NextResponse } from 'next/server';
import { adminToggleStoreItem, adminUpsertStoreItem } from '@/lib/store';
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

    const item = await adminUpsertStoreItem({
      adminId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      itemId: body.itemId,
      categoryId: String(body.categoryId || ''),
      name: String(body.name || ''),
      nameUr: body.nameUr,
      description: body.description,
      descriptionUr: body.descriptionUr,
      thumbnailUrl: String(body.thumbnailUrl || ''),
      previewImageUrl: body.previewImageUrl,
      animationAssetUrl: body.animationAssetUrl ?? null,
      visualStyle: body.visualStyle,
      coinPrice: Number(body.coinPrice ?? 0),
      durationType: body.durationType || 'limited_duration',
      durationValue: body.durationValue !== undefined && body.durationValue !== null ? Number(body.durationValue) : null,
      durationUnit: body.durationUnit,
      durationLabel: body.durationLabel,
      durationLabelUr: body.durationLabelUr,
      eventEndAt: body.eventEndAt ?? null,
      equipSlot: body.equipSlot,
      isEquippable: body.isEquippable,
      usageLimitPerUser:
        body.usageLimitPerUser !== undefined && body.usageLimitPerUser !== null && body.usageLimitPerUser !== ''
          ? Number(body.usageLimitPerUser)
          : null,
      maxTotalStock:
        body.maxTotalStock !== undefined && body.maxTotalStock !== null && body.maxTotalStock !== ''
          ? Number(body.maxTotalStock)
          : null,
      vipOnly: Boolean(body.vipOnly),
      requiredVipLevel: Number(body.requiredVipLevel || 0),
      minWealthLevel: Number(body.minWealthLevel || 1),
      minShiningLevel: Number(body.minShiningLevel || 1),
      minHonorLevel: Number(body.minHonorLevel || 1),
      eligibilityRules: body.eligibilityRules,
      isFeatured: Boolean(body.isFeatured),
      isPopular: Boolean(body.isPopular),
      isNewArrival: Boolean(body.isNewArrival),
      isApproved: body.isApproved,
      isActive: body.isActive,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to save store item.');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireStoreFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || !body.itemId) {
      return NextResponse.json({ success: false, error: 'itemId and isActive are required.' }, { status: 400 });
    }

    const item = await adminToggleStoreItem({
      adminId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      itemId: String(body.itemId),
      isActive: Boolean(body.isActive),
      reason: body.reason,
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to toggle store item status.');
  }
}
