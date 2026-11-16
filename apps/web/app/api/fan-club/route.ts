import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, getFanClubs } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const clubs = await getFanClubs(user?.id, search);

    return NextResponse.json({
      success: true,
      clubs,
      count: clubs.length,
    });
  } catch (error: any) {
    console.error('Error fetching fan clubs:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_CLUBS' }, { status: 500 });
  }
}
