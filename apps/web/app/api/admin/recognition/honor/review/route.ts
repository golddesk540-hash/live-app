import { NextRequest, NextResponse } from 'next/server';
import { adminReviewHonorRequest } from '@/lib/recognition';
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

    const decision = String(body.decision || '').trim().toLowerCase();
    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { success: false, errorCode: 'INVALID_DECISION', error: 'Decision must be approved or rejected.' },
        { status: 400 }
      );
    }

    const out = await adminReviewHonorRequest({
      requestId: String(body.requestId || '').trim(),
      decision,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      reason: String(body.reason || ''),
      overridePoints: body.overridePoints !== undefined ? Number(body.overridePoints) : undefined,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.8', ...out });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to review Honor recognition request.');
  }
}
