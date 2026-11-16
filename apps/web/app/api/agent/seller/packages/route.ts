import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getSellerCoinPackages } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id, 'coin_seller');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'User is not an authorized coin seller.' }, { status: 403 });
    }

    const packages = await getSellerCoinPackages();

    return NextResponse.json({
      success: true,
      packages,
      sellerCoinBalance: auth.profile?.sellerCoinBalance || 0,
      commissionRate: auth.profile?.commissionRate || 8.0,
    });
  } catch (error: any) {
    console.error('Error fetching seller coin packages:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_PACKAGES' },
      { status: 500 }
    );
  }
}
