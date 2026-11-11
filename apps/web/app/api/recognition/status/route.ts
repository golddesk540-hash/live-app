import { NextRequest, NextResponse } from 'next/server';
import { getUserRecognitionSummary } from '@/lib/recognition';
import { recognitionErrorJson, resolveRecognitionUserScope } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveRecognitionUserScope(req);
    if (!scope.ok) return scope.response;

    const summary = await getUserRecognitionSummary(scope.targetUserId, {
      includePrivate: true,
      skipCache: true,
    });

    return NextResponse.json({
      success: true,
      module: '7.8',
      summary,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to fetch Wealth, Shining and Honor status.');
  }
}
