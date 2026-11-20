import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'kyc:moderate');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const submission = adminDeskService.approveKyc(
      auth.actor,
      params.id,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
