import { NextRequest, NextResponse } from 'next/server';
import { getCoinPackages } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wallet/packages
 * Returns real active coin packages from popolive.coin_packages.
 * Master Plan B5: Coin packages remain display-only in this prompt.
 */
export async function GET(req: NextRequest) {
  try {
    const packages = await getCoinPackages();

    return NextResponse.json({
      success: true,
      packages,
      total: packages.length,
      isReadOnly: true,
      message: 'Coin packages are provided for catalogue display only.',
    });
  } catch (err: any) {
    console.error('GET /api/wallet/packages error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve coin packages.' },
      { status: 500 }
    );
  }
}
