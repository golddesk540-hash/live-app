import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getStreamerStarterPack, assertAdult } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    assertAdult(user, 'view starter pack');

    const starterPack = await getStreamerStarterPack(user.id);
    return NextResponse.json({
      success: true,
      starterPack,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'STARTER_PACK_ERROR' },
      { status: err.status || 500 }
    );
  }
}
