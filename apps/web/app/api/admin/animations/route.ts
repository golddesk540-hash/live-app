import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationTier,
  AnimationValidationError,
  PriorityCategory,
  PKEffectStyle,
  adminSetUserVipMembership,
  adminUpdatePriorityConfig,
  adminUpsertGiftAnimation,
  getAnimationSystemCatalog,
  listAnimationAuditLogs,
  listVipMemberships,
} from '@/lib/animations';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const [catalog, vipMemberships, auditLogs] = await Promise.all([
      getAnimationSystemCatalog(true),
      listVipMemberships(),
      listAnimationAuditLogs(50),
    ]);

    return NextResponse.json({
      success: true,
      ...catalog,
      vipMemberships,
      auditLogs,
    });
  } catch (err: any) {
    console.error('GET /api/admin/animations error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load admin animations data.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const action = String(body.action || 'upsert_gift_animation');

    if (action === 'update_priority') {
      const updated = await adminUpdatePriorityConfig({
        configKey: String(body.configKey || ''),
        priorityWeight: body.priorityWeight,
        maxConcurrent: body.maxConcurrent,
        defaultDurationMs: body.defaultDurationMs,
        isEnabled: body.isEnabled,
        actorId: auth.actor.actorId,
        actorRole: auth.actor.actorRole,
        ipAddress: auth.actor.ipAddress,
      });
      return NextResponse.json({ success: true, priorityConfig: updated });
    }

    if (action === 'set_vip_membership') {
      const membership = await adminSetUserVipMembership({
        userId: String(body.userId || ''),
        vipLevel: Number(body.vipLevel ?? 1),
        vipTier: body.vipTier || 'vip_gold',
        badgeLabel: String(body.badgeLabel || 'VIP'),
        specialEventAccess: Boolean(body.specialEventAccess),
        status: body.status || 'active',
        expiresInDays: body.expiresInDays,
        actorId: auth.actor.actorId,
        actorRole: auth.actor.actorRole,
        ipAddress: auth.actor.ipAddress,
      });
      return NextResponse.json({ success: true, membership });
    }

    const animation = await adminUpsertGiftAnimation({
      giftId: String(body.giftId || ''),
      animationTier: (body.animationTier || 'medium_animated') as AnimationTier,
      priorityCategory: (body.priorityCategory || 'standard') as PriorityCategory,
      priorityWeight: Number(body.priorityWeight ?? 20),
      durationMs: Number(body.durationMs ?? 3000),
      loopCount: Number(body.loopCount ?? 1),
      isFullscreen: Boolean(body.isFullscreen),
      soundUrl: body.soundUrl,
      animationUrl: body.animationUrl,
      assetType: body.assetType,
      pkEffectStyle: (body.pkEffectStyle || 'side_burst') as PKEffectStyle,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, animation });
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.errorCode },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/admin/animations error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save animation configuration.' },
      { status: err?.statusCode || 500 }
    );
  }
}
