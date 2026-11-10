import { NextRequest, NextResponse } from 'next/server';
import { APPROVED_PK_REACTIONS } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  return NextResponse.json({
    success: true,
    catalog: APPROVED_PK_REACTIONS,
    count: APPROVED_PK_REACTIONS.length,
    isFree: true,
    pointsDeducted: 0,
    coinsDeducted: 0,
  });
}
