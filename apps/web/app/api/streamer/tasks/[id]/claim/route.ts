import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { claimStreamerTask } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const idempotencyKey = req.headers.get('x-idempotency-key') || undefined;

    const res = await claimStreamerTask(user, id, idempotencyKey);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'TASK_CLAIM_ERROR' },
      { status: err.status || 500 }
    );
  }
}
