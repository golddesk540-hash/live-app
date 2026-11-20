import { NextRequest, NextResponse } from 'next/server';
import { getCoinPackages } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/coins/packages
 * Returns the list of coin packages available for display.
 * LOCKED RULE 8: Coin packages are display-only — no real purchase processing.
 */
export async function GET(req: NextRequest) {
  try {
    const packages = await getCoinPackages();

    return NextResponse.json({
      success: true,
      packages,
      total: packages.length,
      isReadOnly: true,
      message: 'Coin packages are provided for catalogue display only. Real payment processing is disabled.',
    });
  } catch (err: any) {
    console.error('GET /api/economy/coins/packages error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve coin packages.' },
      { status: 500 }
    );
  }
}

/**
 * Reject any write/purchase requests
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'PACKAGES_READ_ONLY: Real payment processing is disabled. Coin packages are for catalogue display only.',
      code: 'PACKAGES_READ_ONLY',
    },
    { status: 405 }
  );
}

export async function PUT(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
