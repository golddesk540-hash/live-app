import { NextRequest, NextResponse } from 'next/server';
import { adminGetRecognitionOverview } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const overview = await adminGetRecognitionOverview(search);

    return NextResponse.json({
      success: true,
      module: '7.8',
      ...overview,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to load recognition admin overview.');
  }
}
