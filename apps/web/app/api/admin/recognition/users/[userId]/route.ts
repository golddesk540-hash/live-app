import { NextRequest, NextResponse } from 'next/server';
import { getUserRecognitionHistory, getUserRecognitionSummary } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const targetId = decodeURIComponent(params.userId || '').trim();
    const [summary, history] = await Promise.all([
      getUserRecognitionSummary(targetId, { includePrivate: true, skipCache: true }),
      getUserRecognitionHistory(targetId, { limit: 60 }),
    ]);

    return NextResponse.json({
      success: true,
      module: '7.8',
      summary,
      ...history,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to inspect user recognition history.');
  }
}
