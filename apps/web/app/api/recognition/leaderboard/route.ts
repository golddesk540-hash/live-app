import { NextRequest, NextResponse } from 'next/server';
import { getRecognitionLeaderboard } from '@/lib/recognition';
import { recognitionErrorJson } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'wealth';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const leaderboard = await getRecognitionLeaderboard({
      category,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({
      success: true,
      module: '7.8',
      ...leaderboard,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to fetch recognition leaderboard.');
  }
}
