import { NextRequest, NextResponse } from 'next/server';
import { getFanClubMembers } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/fan-clubs/:clubId/members
 * Returns fan club members list with pagination.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { clubId } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const members = await getFanClubMembers(clubId, limit, offset);

    return NextResponse.json({
      success: true,
      clubId,
      members,
      count: members.length,
    });
  } catch (err: any) {
    console.error('GET /api/community/fan-clubs/[clubId]/members error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve fan club members.' },
      { status: err.status || 500 }
    );
  }
}
