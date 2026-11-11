import { NextRequest, NextResponse } from 'next/server';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { updateGiftItem } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { giftId: string } }
) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Boolean isActive flag is required.' },
        { status: 400 }
      );
    }

    const gift = await updateGiftItem({
      giftId: params.giftId,
      updates: { isActive: body.isActive },
      reason: body.reason || `${body.isActive ? 'Activated' : 'Deactivated'} gift via status control`,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({
      success: true,
      gift,
    });
  } catch (err: any) {
    console.error('POST /api/admin/gifts/[giftId]/status error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to change gift status.',
        code: err?.code || 'STATUS_CHANGE_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
