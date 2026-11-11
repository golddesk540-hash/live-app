import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeLevelUpEvents } from '@/lib/recognition';
import { recognitionErrorJson, resolveRecognitionUserScope } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const scope = await resolveRecognitionUserScope(req);
    if (!scope.ok) return scope.response;

    const body = await req.json().catch(() => ({}));
    const eventIds = Array.isArray(body?.eventIds) ? body.eventIds.map((x: any) => String(x)) : undefined;

    const res = await acknowledgeLevelUpEvents(scope.targetUserId, eventIds);
    return NextResponse.json({
      success: true,
      module: '7.8',
      ...res,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to acknowledge level-up events.');
  }
}
