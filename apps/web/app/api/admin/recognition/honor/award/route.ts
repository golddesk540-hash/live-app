import { NextRequest, NextResponse } from 'next/server';
import { adminDirectAwardHonor } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_BODY', error: 'JSON body required.' }, { status: 400 });
    }

    const result = await adminDirectAwardHonor({
      targetUserId: String(body.targetUserId || body.userId || '').trim(),
      factorKey: String(body.factorKey || 'official_platform_recognition').trim(),
      points: Number(body.points),
      reason: String(body.reason || ''),
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : undefined,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.8', result });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to grant Honor recognition award.');
  }
}
