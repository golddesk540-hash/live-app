import { NextRequest, NextResponse } from 'next/server';
import { adminQueryVipMemberships, adminUpdateMembershipStatus } from '@/lib/vip';
import { requireVipFinanceAdmin, vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = req.nextUrl;
    const data = await adminQueryVipMemberships({
      actorRole: auth.actor.actorRole,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || 'all',
      limit: parseInt(searchParams.get('limit') || '40', 10) || 40,
    });

    return NextResponse.json({ success: true, module: '7.7', ...data });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to load VIP memberships.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const membershipId = String(body.membershipId || '').trim();
    const action = body.action as 'suspend' | 'expire' | 'cancel' | 'reactivate';
    if (!membershipId || !['suspend', 'expire', 'cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'INVALID_ADMIN_ACTION',
          error: 'Valid membershipId and action (suspend|expire|cancel|reactivate) are required.',
        },
        { status: 400 }
      );
    }

    const membership = await adminUpdateMembershipStatus({
      actorRole: auth.actor.actorRole,
      actorId: auth.actor.actorId,
      membershipId,
      action,
      reason: typeof body.reason === 'string' ? body.reason : undefined,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.7', membership });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to update VIP membership status.');
  }
}
