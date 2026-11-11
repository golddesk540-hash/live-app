import { NextRequest, NextResponse } from 'next/server';
import { getUserRecognitionHistory } from '@/lib/recognition';
import { recognitionErrorJson, resolveRecognitionUserScope } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveRecognitionUserScope(req);
    if (!scope.ok) return scope.response;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '40', 10);

    const history = await getUserRecognitionHistory(scope.targetUserId, {
      category,
      limit: Number.isFinite(limit) ? limit : 40,
    });

    return NextResponse.json({
      success: true,
      module: '7.8',
      userId: scope.targetUserId,
      ...history,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to retrieve recognition history.');
  }
}
