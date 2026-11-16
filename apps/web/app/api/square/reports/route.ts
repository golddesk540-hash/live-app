import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor, submitSquareReport } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetType, targetId, reason, description } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { success: false, error: 'targetType, targetId, and reason are required.' },
        { status: 400 }
      );
    }

    const report = await submitSquareReport({
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping Popo Live safe.',
      reportId: report.id,
      status: report.status,
    });
  } catch (error: any) {
    console.error('Error submitting square report:', error);
    const status = error.message === 'INVALID_REPORT_REASON' ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_SUBMIT_REPORT' }, { status });
  }
}
