import { NextRequest, NextResponse } from 'next/server';
import { getHelpTopicDetail } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topic = await getHelpTopicDetail(id);
    return NextResponse.json({
      success: true,
      topic,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'TOPIC_NOT_FOUND' },
      { status: err.status || 500 }
    );
  }
}
