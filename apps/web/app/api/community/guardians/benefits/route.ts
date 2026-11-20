import { NextRequest, NextResponse } from 'next/server';
import { getGuardianBenefits } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/guardians/benefits
 * Returns list of Guardian benefits and tier requirements.
 */
export async function GET(req: NextRequest) {
  try {
    const benefits = await getGuardianBenefits();

    return NextResponse.json({
      success: true,
      benefits,
      count: benefits.length,
    });
  } catch (err: any) {
    console.error('GET /api/community/guardians/benefits error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve guardian benefits.' },
      { status: err.status || 500 }
    );
  }
}
