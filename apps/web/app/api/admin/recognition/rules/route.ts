import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateRecognitionRules } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_BODY', error: 'JSON body required.' }, { status: 400 });
    }

    const rules = await adminUpdateRecognitionRules({
      allowPromoCoinsForWealth:
        body.allowPromoCoinsForWealth !== undefined ? Boolean(body.allowPromoCoinsForWealth) : undefined,
      wealthScorePerCoin: body.wealthScorePerCoin !== undefined ? Number(body.wealthScorePerCoin) : undefined,
      shiningScorePerCoin: body.shiningScorePerCoin !== undefined ? Number(body.shiningScorePerCoin) : undefined,
      autoAdjustOnReversal: body.autoAdjustOnReversal !== undefined ? Boolean(body.autoAdjustOnReversal) : undefined,
      fraudDailySpikeThreshold:
        body.fraudDailySpikeThreshold !== undefined ? Number(body.fraudDailySpikeThreshold) : undefined,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      reason: body.reason ? String(body.reason) : undefined,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.8', rules });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to update recognition system rules.');
  }
}
