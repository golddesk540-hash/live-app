import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationValidationError,
  EntranceType,
  adminUpdateEntranceEffect,
  getAnimationSystemCatalog,
} from '@/lib/animations';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const catalog = await getAnimationSystemCatalog(true);
    return NextResponse.json({
      success: true,
      entranceEffects: catalog.entranceEffects,
    });
  } catch (err: any) {
    console.error('GET /api/admin/animations/entrances error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load entrance effects.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || !body.entranceType) {
      return NextResponse.json(
        { success: false, error: 'entranceType is required.' },
        { status: 400 }
      );
    }

    const updated = await adminUpdateEntranceEffect({
      entranceType: String(body.entranceType) as EntranceType,
      name: body.name,
      nameUr: body.nameUr,
      requiredVipLevel: body.requiredVipLevel,
      minHostLevel: body.minHostLevel,
      requiresSpecialEvent: body.requiresSpecialEvent,
      vipBadgeLabel: body.vipBadgeLabel,
      assetType: body.assetType,
      animationUrl: body.animationUrl,
      previewImageUrl: body.previewImageUrl,
      soundUrl: body.soundUrl,
      durationMs: body.durationMs,
      priorityWeight: body.priorityWeight,
      isActive: body.isActive,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, entranceEffect: updated });
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.errorCode },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/admin/animations/entrances error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update host entrance effect.' },
      { status: err?.statusCode || 500 }
    );
  }
}
