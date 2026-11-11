import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  adminToggleVipPlanStatus,
  adminUpsertVipPlan,
  listVipBenefitCatalog,
  listVipPlans,
} from '@/lib/vip';
import { requireVipFinanceAdmin, vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const [plans, benefitCatalog, entranceEffects] = await Promise.all([
      listVipPlans({ includeInactive: true }),
      listVipBenefitCatalog(true),
      query<any>(
        `SELECT entrance_id, entrance_type, name, required_vip_level, is_active
         FROM popolive.host_entrance_effects
         ORDER BY priority_weight ASC`
      ),
    ]);

    return NextResponse.json({
      success: true,
      module: '7.7',
      plans,
      benefitCatalog,
      entranceEffects,
    });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to fetch admin VIP plans.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const saved = await adminUpsertVipPlan({
      actorRole: auth.actor.actorRole,
      actorId: auth.actor.actorId,
      ipAddress: auth.actor.ipAddress,
      planId: body.planId,
      planTier: body.planTier || 'vip_gold',
      vipLevel: Number(body.vipLevel || 3),
      planName: String(body.planName || ''),
      planNameUr: body.planNameUr,
      description: body.description,
      descriptionUr: body.descriptionUr,
      durationDays: Number(body.durationDays || 30),
      priceAmount: Number(body.priceAmount),
      renewalPriceAmount:
        body.renewalPriceAmount !== undefined && body.renewalPriceAmount !== null
          ? Number(body.renewalPriceAmount)
          : undefined,
      currency: body.currency || 'USD',
      allowCoinPurchase: Boolean(body.allowCoinPurchase),
      coinPrice:
        body.coinPrice !== undefined && body.coinPrice !== null && body.coinPrice !== ''
          ? Number(body.coinPrice)
          : null,
      badgeLabel: String(body.badgeLabel || 'VIP'),
      badgeAssetUrl: body.badgeAssetUrl,
      profileFrameAssetUrl: body.profileFrameAssetUrl,
      nameDecorationStyle: body.nameDecorationStyle,
      themeKey: body.themeKey,
      entranceId: body.entranceId,
      entranceAnimationRef: body.entranceAnimationRef,
      benefitKeys: Array.isArray(body.benefitKeys) ? body.benefitKeys : undefined,
      benefitsConfig: body.benefitsConfig,
      specialEventAccess: Boolean(body.specialEventAccess),
      isPopular: Boolean(body.isPopular),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
    });

    return NextResponse.json({ success: true, module: '7.7', plan: saved }, { status: 201 });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to save VIP plan.');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    if (!body.planId || body.isActive === undefined) {
      return NextResponse.json(
        { success: false, errorCode: 'INVALID_INPUT', error: 'planId and isActive are required.' },
        { status: 400 }
      );
    }

    const plan = await adminToggleVipPlanStatus({
      actorRole: auth.actor.actorRole,
      actorId: auth.actor.actorId,
      planId: String(body.planId),
      isActive: Boolean(body.isActive),
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.7', plan });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to toggle VIP plan status.');
  }
}
